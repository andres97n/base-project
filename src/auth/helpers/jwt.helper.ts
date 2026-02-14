import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { JwtPayload } from "../interfaces";


@Injectable()
export class JwtHelper {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  // generateRefreshToken(payload: any) {
  //   return this.jwtService.signAsync(payload, { expiresIn: '7d' });
  // }

  verifyToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }
}