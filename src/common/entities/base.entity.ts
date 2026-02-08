import { Prop, Schema } from '@nestjs/mongoose';

import { BaseEntityStates } from '../enums';


@Schema({ 
  timestamps: true,
  toJSON: { versionKey: false },
  toObject: { versionKey: false }, 
})
export class BaseSchema {
  @Prop({
    type: String,
    required: false,
    default: BaseEntityStates.ACTIVO, 
    enum: Object.values(BaseEntityStates),
  })
  state: string;

}
