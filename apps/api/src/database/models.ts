import type { Model } from 'mongoose';

import { ActualModel } from '../modules/actuals/actual.model.js';
import { SessionModel } from '../modules/auth/session.model.js';
import { CategoryModel } from '../modules/categories/category.model.js';
import { FinancialPeriodModel } from '../modules/periods/financial-period.model.js';
import { PlanModel } from '../modules/plans/plan.model.js';
import { UserModel } from '../modules/users/user.model.js';
import { SchemaMigrationModel } from './migrations/schema-migration.model.js';

export {
  ActualModel,
  CategoryModel,
  FinancialPeriodModel,
  PlanModel,
  SchemaMigrationModel,
  SessionModel,
  UserModel,
};

export const allDomainModels: readonly Model<unknown>[] = [
  UserModel as unknown as Model<unknown>,
  SessionModel as unknown as Model<unknown>,
  CategoryModel as unknown as Model<unknown>,
  PlanModel as unknown as Model<unknown>,
  ActualModel as unknown as Model<unknown>,
  FinancialPeriodModel as unknown as Model<unknown>,
  SchemaMigrationModel as unknown as Model<unknown>,
];
