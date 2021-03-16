import { CanActivate, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import {
  COOKIE_ACCESS_TOKEN_MAX_AGE,
  COOKIE_REFRESH_TOKEN_MAX_AGE,
} from 'src/common/constants';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: any): boolean | Promise<boolean> | Observable<boolean> {
    const stringAccessToken: string = context.switchToHttp().args[2].req.cookies
      .access_token;
    const refreshToken: string = context.switchToHttp().args[2].req.cookies
      .refresh_token;

    const accessToken = this.tokenService.stringToAccessTokenAndVerify(
      stringAccessToken,
    );

    if (accessToken) return Promise.resolve(true);

    return new Promise(async (res) => {
      const response: Response = context.switchToHttp().args[2].req.res;

      const tokens = await this.tokenService.getTokensFromRefreshToken(
        refreshToken,
      );

      if (!tokens) return res(false);

      if (tokens.accessToken === stringAccessToken) {
        const newTokens = await this.tokenService.replaceTokens(refreshToken);

        response.cookie('access_token', newTokens.accessToken, {
          maxAge: COOKIE_ACCESS_TOKEN_MAX_AGE,
        });
        response.cookie('refresh_token', newTokens.refreshToken, {
          maxAge: COOKIE_REFRESH_TOKEN_MAX_AGE,
          httpOnly: true,
        });

        return res(true);
      }

      await this.tokenService.killSession(tokens);

      response.clearCookie('access_token');
      response.clearCookie('refresh_token');

      return res(false);
    });
  }
}
