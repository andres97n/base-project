import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ms from 'ms';

import { CreateUserDto, LoginUserDto, RenewTokenDto } from './dto';
import { User } from './entities';
import { JwtHelper } from './helpers';
import { comparePasswordWithHashed, hashString } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { JWT_REFRESH_TIME } from 'src/common/constants';
import { JwtPayload } from './interfaces';
import { JWT_FIELD_NAME_REFRESH_TOKEN } from './constants';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtHelper: JwtHelper,
    private readonly configService: ConfigService,
  ) {}

  private async storeRefreshToken(userId: string, token: string) {
    const hashed = await hashString(token);
    const refreshExpiration = (this.configService.get<string>('jwtRefreshTime') ?? JWT_REFRESH_TIME) as ms.StringValue;
    const expiresInMs = ms(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashed,
      refreshTokenExpiresAt: expiresAt,
    });
  }

  private async generateTokens(userId: string, withAccessToken: boolean = true) {
    const payload = { id: userId};
    
    const accessToken = withAccessToken
      ? await this.jwtHelper.generateAccessToken(payload)
      : null;
    const refreshToken = await this.jwtHelper.generateRefreshToken(payload);
    
    await this.storeRefreshToken(userId, refreshToken);
    
    return { accessToken, refreshToken };
  }

  private async clearRefreshToken(userId: string): Promise<void>{
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  }

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userModel.create(createUserDto);

    const { accessToken, refreshToken } = await this.generateTokens(newUser.id);

    const data = {
      ...newUser.toObject(),
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

    const user = await this.userModel.findOne({email}, {
      email: true, _id: true
    });
    if ( !user ) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if ( !comparePasswordWithHashed( password, user.password ) )
      throw new UnauthorizedException('Credentials are not valid (password)');

    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      ...user,
      token: accessToken,
      refreshToken
    };
  }

  async renewUserToken( { refreshToken }: RenewTokenDto ) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtHelper.verifyToken(
        refreshToken, 
        JWT_FIELD_NAME_REFRESH_TOKEN
      );
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token or expired');
    }
    
    const user = await this.userModel.findById(payload.id);
    if (!user) throw new BadRequestException('User not found');
    if (!user.refreshToken) throw new UnauthorizedException('Token not found');

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      await this.clearRefreshToken(user.id);
      throw new UnauthorizedException('Refresh token expirado en el servidor');
    }
    
    const isValid = await comparePasswordWithHashed(refreshToken, user.refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token or expired');
    
    return await this.generateTokens(user.id);
  }
  
}
