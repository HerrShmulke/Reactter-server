
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum LikeAction {
    LIKE = "LIKE",
    DISLIKE = "DISLIKE"
}

export class PostCreateInput {
    message: String250;
    mention?: number;
}

export class UserRegisterInput {
    name: string;
    password: string;
}

export class UserLoginInput {
    name: string;
    password: string;
}

export abstract class IQuery {
    abstract posts(take: number, skip: number): Post[] | Promise<Post[]>;

    abstract post(id: number): Post | Promise<Post>;

    abstract user(): User | Promise<User>;
}

export abstract class IMutation {
    abstract postCreate(input: PostCreateInput): boolean | Promise<boolean>;

    abstract postToggleLike(postId: number): LikeAction | Promise<LikeAction>;

    abstract userRegister(input: UserRegisterInput): boolean | Promise<boolean>;

    abstract userLogin(input: UserLoginInput): boolean | Promise<boolean>;

    abstract killAllSessions(): boolean | Promise<boolean>;
}

export abstract class ISubscription {
    abstract postAdded(): Post | Promise<Post>;
}

export class Post {
    id: number;
    message: String250;
    owner: User;
    likesCount: number;
    commentsCount: number;
    isLikes: boolean;
    mention?: Post;
    mentionBy?: Post[];
}

export class User {
    id: string;
    name: string;
    ownedPosts?: Post[];
    avatarUrl: string;
}

export type String250 = any;
