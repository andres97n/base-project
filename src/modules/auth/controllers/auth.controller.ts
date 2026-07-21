import { Controller, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services';
import {
  AuthResponseDto,
  CheckStatusTokenDto,
  CreateUserDto,
  LoginUserDto,
  RenewTokenDto,
  TokenPairDto,
  TokenStatusDto,
} from '../dto';
import { Auth, GetUser } from '../decorators';
import { User } from '../entities';
import {
  ApiErrorResponses,
  ApiOkResponseWrapped,
  Public,
} from 'src/common/decorators';
import { SWAGGER_BEARER_AUTH_NAME } from 'src/common/constants';

@ApiTags('Auth')
@ApiErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponseWrapped(AuthResponseDto)
  @Public()
  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'Authenticate and receive tokens' })
  @ApiOkResponseWrapped(AuthResponseDto)
  @Public()
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiOkResponseWrapped(TokenPairDto)
  @Public()
  @Post('refresh')
  async refreshUserToken(@Body() { refreshToken }: RenewTokenDto) {
    return this.authService.renewUserToken(refreshToken);
  }

  @ApiOperation({ summary: 'Check whether a token is still valid' })
  @ApiOkResponseWrapped(TokenStatusDto)
  @Public()
  @Post('check-status')
  async checkStatusToken(@Body() tokenDto: CheckStatusTokenDto) {
    return this.authService.checkStatusToken(tokenDto);
  }

  @ApiOperation({ summary: 'Invalidate the current refresh token' })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH_NAME)
  @Auth()
  @Post('logout')
  async logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }
}
