import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export type FinancialPeriodStatus = 'OPEN' | 'LOCKED';

export interface IFinancialPeriod {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  monthKey: number;
  status: FinancialPeriodStatus;
  version: number;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const financialPeriodSchema = new Schema<IFinancialPeriod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthKey: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'LOCKED'],
      required: true,
      default: 'OPEN',
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'financialPeriods',
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

financialPeriodSchema.index({ userId: 1, monthKey: 1 }, { unique: true });
financialPeriodSchema.index({ userId: 1, status: 1, monthKey: 1 });

export type FinancialPeriodDocument = InferSchemaType<typeof financialPeriodSchema> & {
  _id: Types.ObjectId;
};
export const FinancialPeriodModel: Model<IFinancialPeriod> = model<IFinancialPeriod>(
  'FinancialPeriod',
  financialPeriodSchema,
);
