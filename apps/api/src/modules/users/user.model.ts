import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  emailCanonical: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    emailCanonical: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'users',
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

userSchema.index({ emailCanonical: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const UserModel: Model<IUser> = model<IUser>('User', userSchema);
