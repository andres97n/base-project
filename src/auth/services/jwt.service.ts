// users.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';

import { User } from '../entities';
import { GenericService } from 'src/common/services';
import { hashString } from 'src/common/utils';
import { JWT_REFRESH_TIME } from 'src/common/constants';
import { JwtPayload } from '../interfaces';
import { JwtHelper } from '../helpers';
import { JWT_FIELD_NAME_REFRESH_TOKEN } from '../constants';


@Injectable()
export class JwtService extends GenericService<User>{
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly jwtHelper: JwtHelper,
  ) {
    super(userModel);
  }

  async storeRefreshToken(userId: string, token: string) {
    const hashed = await hashString(token);
    const refreshExpiration = (this.configService.get<string>('jwtRefreshTime') ?? JWT_REFRESH_TIME) as ms.StringValue;
    const expiresInMs = ms(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.userModel.findByIdAndUpdate(userId, {
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
    await super.update(userId, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  async getPayloadAndVerifyToken(refreshToken: string): Promise<JwtPayload>{
    let payload: JwtPayload;

    try {
      payload = await this.jwtHelper.verifyToken(
        refreshToken, 
        JWT_FIELD_NAME_REFRESH_TOKEN
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
