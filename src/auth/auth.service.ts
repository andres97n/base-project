import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ms from 'ms';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities';
import { JwtHelper } from './helpers';
import { comparePasswordWithHashed, hashString } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { JWT_REFRESH_TIME } from 'src/common/constants';


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

    return await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashed,
      refreshTokenExpiresAt: expiresAt,
    });
  }

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.userModel.create(createUserDto);
     const { _id, ...user } = newUser.toObject()
     const id = _id.toString();

    const refreshToken = await this.jwtHelper.generateRefreshToken({ id });
    await this.storeRefreshToken(id, refreshToken);

    const data = {
      ...user,
      token: await this.jwtHelper.generateAccessToken({ id }),
      refreshToken
    };

    return {
      data,
      message: 'User created successfully',
    };
  }

  async login( loginUserDto: LoginUserDto ) {

    const { password, email } = loginUserDto;

    const user = await this.userModel.findOne({
      where: { email },
      select: { email: true, id: true }
    });

    if ( !user ) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if ( !comparePasswordWithHashed( password, user.password ) )
      throw new UnauthorizedException('Credentials are not valid (password)');

    return {
      ...user,
      token: this.jwtHelper.generateAccessToken({ id: user.id })
    };
  }
}
