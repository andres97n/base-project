import { Controller, Post, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { Auth, GetUser } from './decorators';
import { 
  CheckStatusTokenDto, CreateUserDto, 
  LoginUserDto, RenewTokenDto 
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

  @Auth()
  @Post('refresh')
  async refreshUserToken(
    @GetUser() user: User,
    @Body() tokenDto: RenewTokenDto
  ) {
    return this.authService.renewUserToken( user, tokenDto );
  }

  @Auth()
  @Post('check-status')
  async checkStatusToken(@Body() tokenDto: CheckStatusTokenDto) {
    return this.authService.checkStatusToken( tokenDto );
  }
}
