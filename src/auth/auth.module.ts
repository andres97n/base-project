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


@Module({
  controllers: [AuthController],
  providers: [
    AuthService, JwtService,
    JwtStrategy, JwtHelper
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
          secret: configService.get<string>('jwtSecret'),
          signOptions: {
            expiresIn: configService.get<StringValue>('jwtTime'),
          },
        };
      },
    })
  ],
  exports: [JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
