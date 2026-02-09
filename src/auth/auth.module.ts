import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './entities';
import { JwtStrategy } from './strategies';


@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    ConfigModule,

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
          secret: configService.getOrThrow<string>('jwtSecret'),
          signOptions: {
            expiresIn: configService.getOrThrow<StringValue>('jwtExpireTime'),
          },
        };
      },
    })
  ],
  exports: [JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
