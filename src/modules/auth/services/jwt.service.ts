import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';

import { hashString } from 'src/common/utils';
import { 
  CONFIG_FIELD_JWT_REFRESH_TIME, CONFIG_FIELD_JWT_SECRET_REFRESH, 
  JWT_REFRESH_TIME 
} from 'src/common/constants';
import { JwtPayload } from '../interfaces';
import { JwtHelper } from '../helpers';
import { UserRepository } from '../repositories';


@Injectable()
export class JwtService{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async storeRefreshToken(userId: string, token: string) {
    const hashed = await hashString(token);
    const refreshExpiration = (this.configService.get<string>(
      CONFIG_FIELD_JWT_REFRESH_TIME) ?? JWT_REFRESH_TIME
    ) as ms.StringValue;
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
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  async getPayloadAndVerifyToken(refreshToken: string): Promise<JwtPayload>{
    let payload: JwtPayload;

    try {
      payload = await this.jwtHelper.verifyToken(
        refreshToken, 
        CONFIG_FIELD_JWT_SECRET_REFRESH
      );
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token or expired');
    }

    return payload;
  }

  getJwtPayload(idUsuario: string): JwtPayload {
    return this.jwtHelper.getJwtPayload(idUsuario)
  }
  
}
