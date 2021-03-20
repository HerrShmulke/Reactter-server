import { forwardRef, Inject, ParseIntPipe, UseGuards } from '@nestjs/common';
import { Args, Resolver, Query, Mutation, Context } from '@nestjs/graphql';
import { AuthService } from 'src/auth/auth.service';
import { UserLoginInput, UserRegisterInput } from 'src/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Response } from 'express';
import {
  COOKIE_ACCESS_TOKEN_MAX_AGE,
  COOKIE_REFRESH_TOKEN_MAX_AGE,
} from 'src/common/constants';
import { TokenService } from 'src/token/token.service';
import { Token } from 'src/token/token.decorator';
import { IToken } from 'src/common/interfaces/token';

@Resolver('User')
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @UseGuards(AuthGuard)
  @Query('user')
  async getUser(@Token() strToken): Promise<User> {
    const accessToken: IToken = this.tokenService.stringToAccessToken(strToken);

    return this.userService.findById(accessToken.id, [
      'ownedPosts',
      'postsLikes',
    ]);
  }

  @Mutation('userLogin')
  async authorize(
    @Context() context: any,
    @Args('input') input: UserLoginInput,
  ): Promise<boolean> {
    const tokens = await this.authService.authorize(input.name, input.password);

    if (!tokens) return false;

    const response: Response = context.req.res;

    response.cookie('access_token', tokens.accessToken, {
      maxAge: COOKIE_ACCESS_TOKEN_MAX_AGE,
    });
    response.cookie('refresh_token', tokens.refreshToken, {
      maxAge: COOKIE_REFRESH_TOKEN_MAX_AGE,
      httpOnly: true,
    });

    return true;
  }

  @UseGuards(AuthGuard)
  @Mutation('killAllSessions')
  async killAllSessions(@Token() strToken: string): Promise<boolean> {
    try {
      const token = this.tokenService.stringToAccessToken(strToken);
      const user = await this.userService.findById(token.id);

      return this.tokenService.killAllSessionsForUser(user);
    } catch {
      return false;
    }
  }

  @Mutation('userRegister')
  async createUser(@Args('input') args: UserRegisterInput): Promise<boolean> {
    await this.userService.create(args);
    return true;
  }
}
