import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Setting, SettingSchema } from 'src/settings/schemas';


@Global()
@Module({
  // providers: [RequestContext, AxiosAdapter],
  // exports: [RequestContext, AxiosAdapter],
  imports: [
    MongooseModule.forFeature([{
      name: Setting.name, 
      schema: SettingSchema 
    }]),
  ]
})
export class CommonModule {}