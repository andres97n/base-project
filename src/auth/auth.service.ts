import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ms from 'ms';

import { CheckStatusTokenDto, CreateUserDto, LoginUserDto, RenewTokenDto } from './dto';
import { User } from './entities';
import { JwtHelper } from './helpers';
import { comparePasswordWithHashed, hashString } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { JWT_REFRESH_TIME } from 'src/common/constants';
import { JwtPayload } from './interfaces';
import { GenericService } from 'src/common/services';
import { JWT_FIELD_NAME_REFRESH_TOKEN, } from './constants';


@Injectable()
export class AuthService extends GenericService<User>{
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtHelper: JwtHelper,
    private readonly configService: ConfigService,
  ) {
    super(userModel);
  }

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

  private async generateTokens(payload: JwtPayload, withAccessToken: boolean = true) {
    const accessToken = withAccessToken
      ? await this.jwtHelper.generateAccessToken(payload)
      : null;
    const refreshToken = await this.jwtHelper.generateRefreshToken(payload);
    
    await this.storeRefreshToken(payload.id, refreshToken);
    
    return { accessToken, refreshToken };
  }

  private async clearRefreshToken(userId: string): Promise<void>{
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });
  }

  private async getPayloadAndVerifyToken(refreshToken: string): Promise<JwtPayload>{
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

  async createUser(createUserDto: CreateUserDto) {
    const newUser = await super.create(createUserDto)

    const { accessToken, refreshToken } = await this.generateTokens(
      this.jwtHelper.getJwtPayload(newUser.id)
    );
    const { _id, fullName, email } = newUser.toObject();

    const data = {
      _id,
      email,
      fullName,
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

    const user = await super.findOne({email}, {
      email: 1, password: 1, id: 1
    });
    if ( !user ) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if ( !comparePasswordWithHashed( password, user.password ) )
      throw new UnauthorizedException('Credentials are not valid (password)');

    const { accessToken, refreshToken } = await this.generateTokens(
      this.jwtHelper.getJwtPayload(user.id)
    );

    const { password: _password, ...userWithoutPassword } = user as any;
    return { 
      ...userWithoutPassword,
      token: accessToken,
      refreshToken
    };
  }

  async renewUserToken( user: User, { refreshToken }: RenewTokenDto ) {
    const { id }: JwtPayload = await this.getPayloadAndVerifyToken(refreshToken);
    
    if (!user.refreshToken) throw new UnauthorizedException('Token not found');
    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      await this.clearRefreshToken(id);
      throw new UnauthorizedException('Refresh token expirado en el servidor');
    }
    
    const isValid = await comparePasswordWithHashed(refreshToken, user.refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token or expired');
    
    return await this.generateTokens(
      this.jwtHelper.getJwtPayload(id)
    );
  }

  async checkStatusToken( { token }: CheckStatusTokenDto ): Promise<boolean> {
    const payload: JwtPayload = await this.getPayloadAndVerifyToken(token);
    return !!(payload);
  }
  
}
