import { Prop, Schema } from '@nestjs/mongoose';

import { BaseEntityStates } from '../enums';


@Schema({ 
  timestamps: true,
  toJSON: { 
    versionKey: false,
    transform: function(doc, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  },
  toObject: { 
    versionKey: false,
    transform: function(doc, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    }
  }, 
})
export class BaseSchema {
  @Prop({
    type: String,
    required: false,
    default: BaseEntityStates.ACTIVE, 
    enum: Object.values(BaseEntityStates),
  })
  state: string;

}
