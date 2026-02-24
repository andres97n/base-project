import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtService } from './jwt.service';
import { GenericService } from 'src/common/services';
import { comparePasswordWithHashed } from 'src/common/utils';
import { UnauthorizedException } from 'src/common/exceptions';
import { 
  CheckStatusTokenDto, CreateUserDto, 
  LoginUserDto, RenewTokenDto 
} from '../dto';
import { User } from '../entities';
import { JwtPayload } from '../interfaces';


@Injectable()
export class AuthService extends GenericService<User>{
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {
    super(userModel);
  }

  async createUser(createUserDto: CreateUserDto) {
    const newUser = await super.create(createUserDto)

    const { accessToken, refreshToken } = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(newUser.id)
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

    const { accessToken, refreshToken } = await this.jwtService.generateTokens(
      this.jwtService.getJwtPayload(user.id)
    );

    const { password: _password, ...userWithoutPassword } = user as any;
    return { 
      ...userWithoutPassword,
      token: accessToken,
      refreshToken
    };
  }

  async renewUserToken( token: string ) {
    const { id }: JwtPayload = await this.jwtService.getPayloadAndVerifyToken(token);
    
    const { refreshToken, refreshTokenExpiresAt } = await super.findById(id, {
      refreshToken: 1, refreshTokenExpiresAt: 1
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
      message: 'Get well soon!!'
    };
  }
  
}
