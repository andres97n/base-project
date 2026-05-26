import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';

import { AuditContextService } from 'src/common/services';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: false,
      },
    }),
  ],
  providers: [AuditContextService],
  exports: [AuditContextService],
})
export class AppClsModule {}
