import { Injectable } from '@nestjs/common';

import { JwtService } from './jwt.service';
import { comparePasswordWithHashed } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { CONFIG_FIELD_JWT_SECRET } from 'src/common/constants';
import { CheckStatusTokenDto, CreateUserDto, LoginUserDto } from '../dto';
import { JwtPayload } from '../interfaces';
import { UserRepository } from '../repositories';
import { toAuthResponse } from '../helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto);

    const tokens = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(newUser.id),
    );

    return toAuthResponse(newUser, tokens);
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findByEmail(email);

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if (!(await comparePasswordWithHashed(password, user.password)))
      throw new UnauthorizedException('Credentials are not valid (password)');

    if (!user.isActive)
      throw new UnauthorizedException('User account is inactive');

    const tokens = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(user.id),
    );

    return toAuthResponse(user, tokens);
  }

  async renewUserToken(token: string) {
    const { id }: JwtPayload =
      await this.jwtService.getPayloadAndVerifyToken(token);

    const { refreshToken, refreshTokenExpiresAt } =
      await this.userRepository.findById(id, {
        select: 'refreshToken refreshTokenExpiresAt',
      });

    if (!refreshToken) throw new UnauthorizedException('Token not found');
    if (!refreshTokenExpiresAt || refreshTokenExpiresAt < new Date()) {
      await this.jwtService.clearRefreshToken(id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const isValid = await comparePasswordWithHashed(token, refreshToken);
    if (!isValid)
      throw new UnauthorizedException('Invalid refresh token or expired');

    return await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(id),
    );
  }

  async checkStatusToken({
    token,
  }: CheckStatusTokenDto): Promise<{ valid: boolean }> {
    await this.jwtService.getPayloadAndVerifyToken(
      token,
      CONFIG_FIELD_JWT_SECRET,
    );
    return { valid: true };
  }

  async logout(userId: string): Promise<{ id: string }> {
    await this.jwtService.clearRefreshToken(userId);
    return { id: userId };
  }
}
