import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { BaseSchema } from "src/common/entities";
import { UserRoles } from "../enums";
import { 
  USER_EMAIL_ERROR_REQUIRED, USER_EMAIL_ERROR_VALIDATION, 
  USER_FULLNAME_ERROR_LENGTH, USER_PASSWORD_ERROR_LENGTH, 
  USER_PASSWORD_ERROR_REQUIRED, USER_PASSWORD_ERROR_VALIDATION 
} from "../constants";
import { isEmail, isPasswordValid } from "src/common/utils";
import { compareUserPassword, validateAndHashPassword } from "../helpers";


@Schema({})
export class User extends BaseSchema{
  @Prop({
    type: String,
    required: [true, USER_EMAIL_ERROR_REQUIRED],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: isEmail,
      message: USER_EMAIL_ERROR_VALIDATION
    },
    index: true
  })
  email: string;
  
  @Prop({
    type: String,
    required: [true, USER_PASSWORD_ERROR_REQUIRED],
    minlength: [8, USER_PASSWORD_ERROR_LENGTH],
    validate: {
      validator: isPasswordValid,
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

UserSchema.pre('save', async function(next: (err?: Error) => void) {
  await validateAndHashPassword(
    this.password, 
    next,
    this.isModified('password')
  );
});

UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return compareUserPassword(candidatePassword, this.password);
};

export { UserSchema };