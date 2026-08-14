import type { Types } from 'mongoose';

export interface AuthenticatedPrincipal {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  email: string;
}

declare global {
  namespace Express {
    interface Locals {
      requestId?: string;
    }
    interface Request {
      user?: AuthenticatedPrincipal | undefined;
    }
  }
}

export {};
