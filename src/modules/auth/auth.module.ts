import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { AuthController } from './controllers';
import { AuthService, JwtService } from './services';
import { User, UserSchema } from './entities';
import { JwtStrategy } from './strategies';
import { UserRepository } from './repositories';
import {
  CONFIG_FIELD_JWT_SECRET,
  CONFIG_FIELD_JWT_TIME,
} from 'src/common/constants';
import { JwtHelper } from './helpers';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtStrategy, JwtHelper, UserRepository],
  imports: [
    ConfigModule,

    //Config your DB ORM
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>(CONFIG_FIELD_JWT_SECRET),
          signOptions: {
            expiresIn: configService.get<StringValue>(CONFIG_FIELD_JWT_TIME),
          },
        };
      },
    }),
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, UserRepository],
})
export class AuthModule {}
