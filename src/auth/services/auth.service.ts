import { Injectable } from '@nestjs/common';

import { JwtService } from './jwt.service';
import { comparePasswordWithHashed } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { 
  CheckStatusTokenDto, CreateUserDto, 
  LoginUserDto
} from '../dto';
import { JwtPayload } from '../interfaces';
import { UserRepository } from '../repositories/user.repository';


@Injectable()
export class AuthService{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto)

    const { accessToken, refreshToken } = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(newUser.id)
    );

    const data = {
      ...newUser,
      token: accessToken,
      refreshToken
    };

    return {
      data,
      message: 'User created successfully',
    };
  }

  async login( loginUserDto: LoginUserDto ) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findByEmail(email);
    
    if ( !user ) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if ( !comparePasswordWithHashed( password, user.password ) )
      throw new UnauthorizedException('Credentials are not valid (password)');

    const { accessToken, refreshToken } = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(user.id)
    );

    const { password: _password, ...userWithoutPassword } = user;
    return { 
      ...userWithoutPassword,
      token: accessToken,
      refreshToken
    };
  }

  async renewUserToken( token: string ) {
    const { id }: JwtPayload = await this.jwtService.getPayloadAndVerifyToken(token);
    
    const { refreshToken, refreshTokenExpiresAt } = await this.userRepository.findById(id, {
      select: 'refreshToken refreshTokenExpiresAt'
    });

    if (!refreshToken) throw new UnauthorizedException('Token not found');
    if (!refreshTokenExpiresAt || refreshTokenExpiresAt < new Date()) {
      await this.jwtService.clearRefreshToken(id);
      throw new UnauthorizedException('Refresh token expirado en el servidor');
    }
    
    const isValid = await comparePasswordWithHashed(token, refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token or expired');
    
    return await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(id)
    );
  }

  async checkStatusToken( { token }: CheckStatusTokenDto ): Promise<boolean> {
    const payload: JwtPayload = await this.jwtService.getPayloadAndVerifyToken(token);
    return !!(payload);
  }

  async logout(userId: string): Promise<Record<string, any>> {
    await this.jwtService.clearRefreshToken(userId);
    return {
      data: { id: userId },
      message: 'Come back soon!!'
    };
  }

  async getUsers(): Promise<Record<string, any>> {
    return await this.userRepository.searchUsers('a');
    // return users.data;
  }
}
