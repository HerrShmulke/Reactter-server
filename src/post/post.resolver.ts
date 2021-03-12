import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Subscription } from '@nestjs/graphql';
import { AuthGuard } from 'src/auth/auth.guard';
import { IToken } from 'src/common/interfaces/token';
import { PostCreateInput, PostAddLikeInput } from 'src/graphql';
import { Token } from 'src/token/token.decorator';
import { TokenService } from 'src/token/token.service';
import { Post } from './post.entity';
import { Post as GraphPost } from 'src/graphql';
import { PostService } from './post.service';
import { PubSub } from 'apollo-server-express';

const pubSub = new PubSub();

@Resolver('Post')
export class PostResolver {
  constructor(
    private readonly postService: PostService,
    private readonly tokenSerice: TokenService,
  ) {}

  @UseGuards(AuthGuard)
  @Query('posts')
  async getPosts(
    @Args('take', ParseIntPipe) take: number,
    @Args('skip', ParseIntPipe) skip: number,
  ): Promise<GraphPost[]> {
    const posts = await this.postService.findAll(take, skip, [
      'owner',
      'mention',
      'mentionBy',
      'usersLikes',
    ]);

    return posts;
  }

  @UseGuards(AuthGuard)
  @Query('post')
  async getPostById(@Args('id', ParseIntPipe) id: number): Promise<GraphPost> {
    const post = this.postService.findById(id, [
      'owner',
      'mention',
      'mentionBy',
      'usersLikes',
    ]);

    return post;
  }

  @UseGuards(AuthGuard)
  @Mutation('postAddLike')
  async addLike(@Args('input') input: PostAddLikeInput): Promise<boolean> {
    try {
      await this.postService.addLike(input.userId, input.postId);
      return true;
    } catch (error) {
      return false;
    }
  }

  @UseGuards(AuthGuard)
  @Mutation('postCreate')
  async create(
    @Args('input') args: PostCreateInput,
    @Token() strToken: string,
  ): Promise<boolean> {
    try {
      if (args.message === '') return false;

      const token: IToken = this.tokenSerice.stringToAccessToken(strToken);
      const newPost = await this.postService.create(args, token.id);

      const graphPost = (newPost as unknown) as GraphPost;

      graphPost.commentsCount = 0;
      graphPost.likesCount = 0;
      graphPost.isLikes = false;

      pubSub.publish('postAdded', { postAdded: graphPost });
      return true;
    } catch (error) {
      return false;
    }
  }

  @Subscription((returns) => GraphPost)
  postAdded() {
    return pubSub.asyncIterator('postAdded');
  }
}
