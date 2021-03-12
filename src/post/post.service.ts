import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostCreateInput } from 'src/graphql';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Post as GraphPost } from 'src/graphql';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    take: number,
    skip: number,
    relations: string[] = [],
  ): Promise<GraphPost[]> {
    const posts = await this.postRepository.find({
      relations: relations,
      take: take,
      skip: skip,
      order: {
        id: 'DESC',
      },
    });

    return posts.map((post) => {
      const graphPost = (post as unknown) as GraphPost;

      graphPost.commentsCount = post.mentionBy.length;
      graphPost.likesCount = post.usersLikes.length;
      graphPost.isLikes = false;

      return graphPost;
    });
  }

  async findById(id: number, relations: string[] = []): Promise<GraphPost> {
    const post = await this.postRepository.findOne(id, {
      relations: relations,
    });

    const graphPost = (post as unknown) as GraphPost;

    graphPost.likesCount = post.usersLikes.length;
    graphPost.commentsCount = post.mentionBy.length;

    return graphPost;
  }

  async addLike(userId: number, postId: number): Promise<void> {
    const post = await this.postRepository.findOne(postId);
    const owner = await this.userRepository.findOne(userId);

    if (owner.postsLikes) owner.postsLikes.push(post);
    else owner.postsLikes = [post];

    this.userRepository.save(owner);
  }

  async create(post: PostCreateInput, ownerId: number): Promise<Post> {
    const newPost: Post = this.postRepository.create();

    newPost.message = post.message;
    newPost.owner = await this.userRepository.findOne(ownerId);

    if (post.mention)
      newPost.mention = await this.postRepository.findOne(post.mention);

    return this.postRepository.save(newPost);
  }
}
