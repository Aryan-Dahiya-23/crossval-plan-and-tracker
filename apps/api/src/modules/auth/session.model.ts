import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  lastSeenAt?: Date;
  createdAt: Date;
}

export const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      required: false,
    },
  },
  {
    collection: 'sessions',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    strict: true,
  },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1, expiresAt: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & { _id: Types.ObjectId };
export const SessionModel: Model<ISession> = model<ISession>('Session', sessionSchema);
