import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(
    @InjectModel( User.name ) 
    private readonly userModel: Model<User>,

    configService: ConfigService
  ) {
    super({
      secretOrKey: configService.get<string>('jwtSecret'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }


  async validate(payload: JwtPayload): Promise<Omit<User, 'isActive'>> {

    const { id } = payload;
    const user = await this.userModel.findById(id);

    if (!user)
      throw new UnauthorizedException('Token not valid')

    if (!user.isActive)
      throw new UnauthorizedException('User is inactive, talk with an admin');

    const { isActive: _, ...userWithoutIsActive } = user.toObject();
    return userWithoutIsActive as Omit<User, 'isActive'>;
  }

}