import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export interface IActual {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  monthKey: number;
  amountMinor: bigint;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const actualSchema = new Schema<IActual>(
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
    note: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
  },
  {
    collection: 'actuals',
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

actualSchema.index({ userId: 1, monthKey: 1, categoryId: 1 });
actualSchema.index({ userId: 1, categoryId: 1, monthKey: 1 });
actualSchema.index({ userId: 1, monthKey: -1, createdAt: -1, _id: -1 });

export type ActualDocument = InferSchemaType<typeof actualSchema> & { _id: Types.ObjectId };
export const ActualModel: Model<IActual> = model<IActual>('Actual', actualSchema);
