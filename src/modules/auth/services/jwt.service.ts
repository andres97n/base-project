import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';

import { hashString } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import {
  CONFIG_FIELD_JWT_REFRESH_TIME,
  CONFIG_FIELD_JWT_SECRET_REFRESH,
  JWT_REFRESH_TIME,
} from 'src/common/constants';
import { JwtPayload } from '../interfaces';
import { JwtHelper } from '../helpers';
import { UserRepository } from '../repositories';

@Injectable()
export class JwtService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async storeRefreshToken(userId: string, token: string) {
    const hashed = await hashString(token);
    const refreshExpiration = (this.configService.get<string>(
      CONFIG_FIELD_JWT_REFRESH_TIME,
    ) ?? JWT_REFRESH_TIME) as ms.StringValue;
    const expiresInMs = ms(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.userRepository.updateById(userId, {
      refreshToken: hashed,
      refreshTokenExpiresAt: expiresAt,
    });
  }

  async generateTokens(payload: JwtPayload, withAccessToken: boolean = true) {
    const accessToken = withAccessToken
      ? await this.jwtHelper.generateAccessToken(payload)
      : null;
    const refreshToken = await this.jwtHelper.generateRefreshToken(payload);

    await this.storeRefreshToken(payload.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userRepository.updateById(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  }

  async getPayloadAndVerifyToken(
    token: string,
    secretKey: string = CONFIG_FIELD_JWT_SECRET_REFRESH,
  ): Promise<JwtPayload> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtHelper.verifyToken(token, secretKey);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return payload;
  }

  getJwtPayload(idUsuario: string): JwtPayload {
    return this.jwtHelper.getJwtPayload(idUsuario);
  }
}
