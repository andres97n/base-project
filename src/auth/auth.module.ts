import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { AuthService, JwtService } from './services';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './entities';
import { JwtStrategy } from './strategies';
import { JwtHelper } from './helpers';
import { UserRepository } from './repositories/user.repository';
import { CONFIG_FIELD_JWT_SECRET, CONFIG_FIELD_JWT_TIME } from 'src/common/constants';


@Module({
  controllers: [AuthController],
  providers: [
    AuthService, JwtService,
    JwtStrategy, JwtHelper,
    UserRepository,
  ],
  imports: [
    ConfigModule,

    //Config your DB ORM
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      }
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ ConfigModule ],
      inject: [ ConfigService ],
      useFactory: ( configService: ConfigService ) => {
        return {
          secret: configService.get<string>(CONFIG_FIELD_JWT_SECRET),
          signOptions: {
            expiresIn: configService.get<StringValue>(CONFIG_FIELD_JWT_TIME),
          },
        };
      },
    })
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, UserRepository]
})
export class AuthModule {}
