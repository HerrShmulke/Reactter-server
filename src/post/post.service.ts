import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LikeAction, PostCreateInput } from 'src/graphql';
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
    currentUserId?: number,
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

      if (currentUserId) {
        const foundLike = post.usersLikes.find(
          (user) => user.id === currentUserId,
        );

        graphPost.isLikes = foundLike !== undefined;
      } else {
        graphPost.isLikes = false;
      }

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

  async toggleLike(userId: number, postId: number): Promise<LikeAction> {
    const post = await this.postRepository.findOne(postId, {
      relations: ['usersLikes'],
    });

    const owner = await this.userRepository.findOne(userId);

    let action: LikeAction = LikeAction.DISLIKE;
    let foundLike: User = undefined;

    if (post.usersLikes) {
      foundLike = post.usersLikes.find((user) => user.id === owner.id);

      if (!foundLike) {
        post.usersLikes.push(owner);
        action = LikeAction.LIKE;
      } else {
        post.usersLikes = post.usersLikes.filter(
          (user) => user.id !== owner.id,
        );
      }
    } else {
      post.usersLikes = [owner];

      action = LikeAction.LIKE;
    }

    this.postRepository.save(post);

    return action;
  }

  async create(post: PostCreateInput, ownerId: number): Promise<Post> {
    const newPost: Post = this.postRepository.create();

    newPost.message = post.message;
    newPost.owner = await this.userRepository.findOne(ownerId);

    if (post.mention) {
      newPost.mention = await this.postRepository.findOne(post.mention, {
        relations: ['owner'],
      });
    }

    return this.postRepository.save(newPost);
  }
}
