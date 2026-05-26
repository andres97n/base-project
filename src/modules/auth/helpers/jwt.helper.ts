import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { JwtPayload } from '../interfaces';
import {
  CONFIG_FIELD_JWT_REFRESH_TIME,
  CONFIG_FIELD_JWT_SECRET_REFRESH,
} from 'src/common/constants';

@Injectable()
export class JwtHelper {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  generateRefreshToken(payload: any) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(CONFIG_FIELD_JWT_SECRET_REFRESH),
      expiresIn: this.configService.get<StringValue>(
        CONFIG_FIELD_JWT_REFRESH_TIME,
      ),
    });
  }

  verifyToken(token: string, envSecretToken: string): Promise<JwtPayload> {
    const secret: string | null =
      this.configService.get<string>(envSecretToken) ?? null;
    if (!secret)
      throw new UnauthorizedException('Invalid authentication configuration');

    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }

  getJwtPayload(userId: string): JwtPayload {
    return {
      id: userId,
    };
  }
}
