import { Controller, Post, Body, Get } from '@nestjs/common';

import { AuthService } from './services/auth.service';
import { Auth, GetUser } from './decorators';
import { 
  CheckStatusTokenDto, CreateUserDto, 
  LoginUserDto 
} from './dto';
import { User } from './entities';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto ) {
    return this.authService.createUser( createUserDto );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto );
  }

  @Post('refresh')
  async refreshUserToken(
    @Body() { token }: CheckStatusTokenDto
  ) {
    return this.authService.renewUserToken( token );
  }

  @Post('check-status')
  async checkStatusToken(@Body() tokenDto: CheckStatusTokenDto) {
    return this.authService.checkStatusToken( tokenDto );
  }

  @Auth()
  @Post('logout')
  async logout(@GetUser() user: User) {
    return this.authService.logout( user.id );
  }

  @Auth()
  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }
}
