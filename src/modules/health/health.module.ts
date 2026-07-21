import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { DatabaseEnum } from 'src/common/enums';
import { HealthController, HealthPostgresController } from './controllers';

const isPostgres = () => process.env.DB_TYPE === DatabaseEnum.POSTGRES;

@Module({
  imports: [TerminusModule],
  controllers: [isPostgres() ? HealthPostgresController : HealthController],
})
export class HealthModule {}
