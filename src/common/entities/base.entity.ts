// common/schemas/base.schema.ts
import { Prop, Schema } from '@nestjs/mongoose';
import { BaseEntityStates } from '../enums';


@Schema()
export class BaseSchema {
  @Prop({
    type: String,
    required: false,
    default: BaseEntityStates.ACTIVO, 
    enum: Object.values(BaseEntityStates),
  })
  state: string;

}
