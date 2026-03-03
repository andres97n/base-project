import { Controller, Post, Body, Get } from '@nestjs/common';

import { AuthService } from './services/auth.service';
import { Auth, GetUser } from './decorators';
import { 
  CheckStatusTokenDto, CreateUserDto, 
  LoginUserDto, 
  RenewTokenDto
} from './dto';
import { User } from './entities';
import { UserRoles } from './enums';


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
    @Body() { refreshToken }: RenewTokenDto
  ) {
    return this.authService.renewUserToken( refreshToken );
  }

  @Post('check-status')
  async checkStatusToken(@Body() tokenDto: CheckStatusTokenDto) {
    return this.authService.checkStatusToken( tokenDto );
  }

  @Auth()
  @Get('logout')
  async logout(@GetUser() user: User) {
    return this.authService.logout( user.id );
  }

  @Auth(UserRoles.ADMIN)
  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }
}
