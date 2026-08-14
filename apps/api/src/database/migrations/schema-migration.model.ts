import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export interface ISchemaMigration {
  _id: string;
  appliedAt: Date;
  checksum?: string;
}

export const schemaMigrationSchema = new Schema<ISchemaMigration>(
  {
    _id: {
      type: String,
      required: true,
    },
    appliedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checksum: {
      type: String,
      required: false,
    },
  },
  {
    collection: 'schemaMigrations',
    timestamps: false,
    versionKey: false,
    strict: true,
  },
);

export type SchemaMigrationDocument = InferSchemaType<typeof schemaMigrationSchema>;
export const SchemaMigrationModel: Model<ISchemaMigration> = model<ISchemaMigration>(
  'SchemaMigration',
  schemaMigrationSchema,
);
