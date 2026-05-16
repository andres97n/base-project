import { Controller, Post, Body, Get } from '@nestjs/common';

import { AuthService } from '../services';
import {
  CheckStatusTokenDto, CreateUserDto,
  LoginUserDto, RenewTokenDto
} from '../dto';
import { Auth, GetUser } from '../decorators';
import { User } from '../entities';
import { Public } from 'src/common/decorators';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto ) {
    return this.authService.createUser( createUserDto );
  }

  @Public()
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto );
  }

  @Public()
  @Post('refresh')
  async refreshUserToken(
    @Body() { refreshToken }: RenewTokenDto
  ) {
    return this.authService.renewUserToken( refreshToken );
  }

  @Public()
  @Post('check-status')
  async checkStatusToken(@Body() tokenDto: CheckStatusTokenDto) {
    return this.authService.checkStatusToken( tokenDto );
  }

  @Auth()
  @Get('logout')
  async logout(@GetUser() user: User) {
    return this.authService.logout( user.id );
  }
}
