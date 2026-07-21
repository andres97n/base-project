import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { BaseSchema } from 'src/common/entities';
import { UserRoles } from '../enums';
import {
  USER_EMAIL_ERROR_REQUIRED,
  USER_EMAIL_ERROR_VALIDATION,
  USER_FULLNAME_ERROR_LENGTH,
  USER_PASSWORD_ERROR_LENGTH,
  USER_PASSWORD_ERROR_REQUIRED,
  USER_PASSWORD_ERROR_VALIDATION,
} from '../constants';
import { hashPassword, isEmail, isPasswordValid } from 'src/common/utils';
import { compareUserPassword } from '../helpers';

@Schema({})
export class User extends BaseSchema {
  @Prop({
    type: String,
    required: [true, USER_EMAIL_ERROR_REQUIRED],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: isEmail,
      message: USER_EMAIL_ERROR_VALIDATION,
    },
    index: true,
  })
  email: string;

  @Prop({
    type: String,
    required: [true, USER_PASSWORD_ERROR_REQUIRED],
    minlength: [8, USER_PASSWORD_ERROR_LENGTH],
    validate: {
      validator: isPasswordValid,
      message: USER_PASSWORD_ERROR_VALIDATION,
    },
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: [3, USER_FULLNAME_ERROR_LENGTH],
  })
  fullName: string;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: Array,
    required: true,
    default: [UserRoles.USER],
    enum: Object.values(UserRoles),
  })
  roles: UserRoles[];

  @Prop({
    type: String,
    required: false,
    select: false,
  })
  refreshToken?: string;

  @Prop({
    type: Date,
    required: false,
    select: false,
  })
  refreshTokenExpiresAt?: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await hashPassword(this.password);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return compareUserPassword(candidatePassword, this.password);
};

export { UserSchema };
