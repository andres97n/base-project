import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { BaseSchema } from "src/common/entities";
import { UserRoles } from "../enums";
import { USER_EMAIL_ERROR_VALIDATION, USER_FULLNAME_ERROR_LENGTH, USER_PASSWORD_ERROR_LENGTH, USER_PASSWORD_ERROR_VALIDATION } from "../constants";


@Schema({})
export class User extends BaseSchema{
  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: USER_EMAIL_ERROR_VALIDATION
    },
    index: true
  })
  email: string;
  
  @Prop({
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, USER_PASSWORD_ERROR_LENGTH],
    validate: {
      validator: function(v: string) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
      },
      message: USER_PASSWORD_ERROR_VALIDATION
    },
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
    minlength: [3, USER_FULLNAME_ERROR_LENGTH],
  })
  fullName: string;

  @Prop({
    type: Boolean,
    required: true,
    default: true
  })
  isActive: boolean;

  @Prop({
    type: Array,
    required: true,
    default: UserRoles.USER, 
    enum: Object.values(UserRoles),
  })
  roles: string[];
}


const UserSchema = SchemaFactory.createForClass(User);
export { UserSchema };