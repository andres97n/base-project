import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { StringValue } from 'ms';

import { JwtPayload } from "../interfaces";


@Injectable()
export class JwtHelper {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  generateRefreshToken(payload: any) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwtRefreshSecret'),
      expiresIn: this.configService.get<StringValue>('jwtRefreshTime'),
    });
  }

  verifyToken(token: string, envSecretToken: string): Promise<JwtPayload> {
    const secret: string | null = this.configService.get<string>(envSecretToken) ?? null;
    if (!secret) throw new BadRequestException('Invalid key token');
    
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }
}