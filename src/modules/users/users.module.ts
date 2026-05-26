import { Module } from '@nestjs/common';

import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersController } from './controllers';
import { UsersService } from './services';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
