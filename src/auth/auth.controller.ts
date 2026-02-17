import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, RenewTokenDto } from './dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto ) {
    return this.authService.create( createUserDto );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto );
  }

  @Post('refresh')
  async refreshUserToken(@Body() tokenDto: RenewTokenDto) {
    return this.authService.renewUserToken( tokenDto );
  }

  // @Get('check-status')
  // @Auth()
  // checkAuthStatus(
  //   @GetUser() user: User
  // ) {
  //   return this.authService.checkAuthStatus( user );
  // }
}
