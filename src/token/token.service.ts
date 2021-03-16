import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IToken } from 'src/common/interfaces/token';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid4 } from 'uuid';
import { Token } from './token.entity';
import { User } from 'src/user/user.entity';
import { ACCESS_TOKEN_MAX_AGE } from 'src/common/constants';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  stringToAccessTokenAndVerify(strToken: string): IToken | undefined {
    try {
      return jwt.verify(strToken, process.env.JWT_SECRET) as IToken;
    } catch {
      return undefined;
    }
  }

  /**
   * Convert string to token.
   * If the conversion failed, the function will return undefined.
   * @param strToken Token as a string
   */
  stringToAccessToken(strToken: string): IToken {
    return jwt.decode(strToken) as IToken;
  }

  /**
   * Will return true if a pair of tokens are connected and valid
   * @param strToken Token as a string
   * @param refreshToken Refresh token
   */
  async verifyPair(strToken: string, refreshToken: string): Promise<boolean> {
    const tokens = await this.getTokensFromRefreshToken(refreshToken);

    if (!tokens) return false;

    return tokens.accessToken === strToken;
  }

  /**
   * @param refreshToken Refresh token
   */
  getTokensFromRefreshToken(refreshToken: string): Promise<Token | undefined> {
    return this.tokenRepository.findOne({
      where: {
        refreshToken: refreshToken,
      },
      relations: ['owner'],
    });
  }

  /**
   * @param strToken token as a string
   */
  getTokensFromAccessToken(strToken: string): Promise<Token | undefined> {
    return this.tokenRepository.findOne({
      where: {
        accessToken: strToken,
      },
      relations: ['owner'],
    });
  }

  /**
   * @param user User for whom a pair of tokens will be generated
   */
  async generateNewPairForUser(user: User): Promise<Token> {
    const payload: IToken = { id: user.id };

    const refreshToken = uuid4();
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_MAX_AGE,
    });

    const newToken = this.tokenRepository.create({
      owner: user,
      accessToken: token,
      refreshToken: refreshToken,
    });

    return this.tokenRepository.save(newToken);
  }

  /**
   * @param refreshToken Refresh token
   */
  async replaceTokens(refreshToken: string): Promise<Token> {
    const tokens = await this.tokenRepository.findOne({
      where: {
        refreshToken: refreshToken,
      },
    });

    if (!tokens) return;

    const newToken: IToken = {
      id: (jwt.decode(tokens.accessToken) as IToken).id,
    };

    tokens.refreshToken = uuid4();
    tokens.accessToken = jwt.sign(newToken, process.env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_MAX_AGE,
    });

    return this.tokenRepository.save(tokens);
  }

  killSession(tokens: Token) {
    this.tokenRepository.delete(tokens.id);
  }

  async killAllSessionsForUser(user: User): Promise<boolean> {
    try {
      await this.tokenRepository.delete({ owner: user });
      return true;
    } catch (error) {
      return false;
    }
  }
}
