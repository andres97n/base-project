import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from 'src/common/entities';

export type SettingDocument = Setting & Document;

@Schema()
export class Setting extends BaseSchema {
  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  key: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed,
  })
  value: any;

  @Prop({
    required: false,
    type: String,
  })
  description?: string;

  @Prop({
    required: false,
    type: Boolean,
    default: false,
  })
  isInitialSetting?: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
