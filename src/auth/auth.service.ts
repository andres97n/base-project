import { 
  BadRequestException, Injectable, 
  InternalServerErrorException, UnauthorizedException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities';
import { JwtHelper } from './helpers';
import { comparePasswordWithHashed } from 'src/common/utils';


@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly jwtHelper: JwtHelper,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {

      const { id, ...user } = await this.userModel.create(createUserDto);

      // await this.userModel.save(user)
      // delete user.password;

      return {
        ...user,
        token: await this.jwtHelper.generateAccessToken({ id })
      };

    } catch (error) {
      if (error?.detail) throw new BadRequestException( error.detail );

      throw new InternalServerErrorException('Please check server logs');
    }

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
