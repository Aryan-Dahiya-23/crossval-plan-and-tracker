import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export interface IPlan {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  monthKey: number;
  amountMinor: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export const planSchema = new Schema<IPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    monthKey: {
      type: Number,
      required: true,
    },
    amountMinor: {
      type: Schema.Types.BigInt,
      required: true,
    },
  },
  {
    collection: 'plans',
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

planSchema.index({ userId: 1, categoryId: 1, monthKey: 1 }, { unique: true });
planSchema.index({ userId: 1, monthKey: 1, categoryId: 1 });

export type PlanDocument = InferSchemaType<typeof planSchema> & { _id: Types.ObjectId };
export const PlanModel: Model<IPlan> = model<IPlan>('Plan', planSchema);
