import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  nameCanonical: string;
  colorKey: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameCanonical: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    colorKey: {
      type: String,
      required: true,
      trim: true,
      default: 'blue',
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: 'categories',
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

categorySchema.index({ userId: 1, nameCanonical: 1 }, { unique: true });
categorySchema.index({ userId: 1, archivedAt: 1, name: 1 });

export type CategoryDocument = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };
export const CategoryModel: Model<ICategory> = model<ICategory>('Category', categorySchema);
