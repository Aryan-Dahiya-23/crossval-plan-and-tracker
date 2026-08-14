import type { LoginRequest, SignupRequest, UserDto } from '@crossval/contracts';
import type { IUser } from '../users/user.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { runInTransaction } from '../../database/transactions.js';
import { EmailAlreadyExistsError, InvalidCredentialsError } from '../../http/errors.js';
import { UserModel } from '../users/user.model.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { createSession, revokeSession, validateSession } from './session.service.js';

export const DEFAULT_CATEGORIES = [
  { name: 'Marketing', colorKey: 'purple' },
  { name: 'Payroll', colorKey: 'emerald' },
  { name: 'Software', colorKey: 'blue' },
  { name: 'Office', colorKey: 'amber' },
  { name: 'Travel', colorKey: 'rose' },
] as const;

/**
 * Maps an internal Mongoose User document to the public UserDto.
 * Strips passwordHash and transforms ObjectIds and Dates.
 */
export function toUserDto(user: IUser): UserDto {
  return {
    id: user._id.toString(),
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export interface AuthResult {
  user: UserDto;
  token: string;
  expiresAt: Date;
}

/**
 * Registers a new user account atomically:
 * 1. Checks email uniqueness.
 * 2. Hashes password with scrypt.
 * 3. Creates User record.
 * 4. Seeds initial default categories.
 * 5. Issues active session token.
 */
export async function signup(input: SignupRequest): Promise<AuthResult> {
  const emailTrimmed = input.email.trim();
  const emailCanonical = emailTrimmed.toLowerCase();

  const passwordHash = await hashPassword(input.password);

  try {
    return await runInTransaction(async (session) => {
      const existing = await UserModel.findOne({ emailCanonical }).session(session).exec();
      if (existing) {
        throw new EmailAlreadyExistsError();
      }

      const user = new UserModel({
        email: emailTrimmed,
        emailCanonical,
        passwordHash,
      });

      await user.save({ session });

      // Seed default categories sequentially inside transaction (no Promise.all)
      for (const cat of DEFAULT_CATEGORIES) {
        const category = new CategoryModel({
          userId: user._id,
          name: cat.name,
          nameCanonical: cat.name.toLowerCase(),
          colorKey: cat.colorKey,
          archivedAt: null,
        });
        await category.save({ session });
      }

      const { token, expiresAt } = await createSession(user._id, { session });

      return {
        user: toUserDto(user),
        token,
        expiresAt,
      };
    });
  } catch (err) {
    if (
      (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 11000) ||
      err instanceof EmailAlreadyExistsError
    ) {
      throw new EmailAlreadyExistsError();
    }
    throw err;
  }
}

/**
 * Authenticates user credentials and issues a fresh session.
 * Uses generic error for both missing email and bad password to avoid user enumeration.
 */
export async function login(input: LoginRequest): Promise<AuthResult> {
  const emailCanonical = input.email.trim().toLowerCase();

  const user = await UserModel.findOne({ emailCanonical }).exec();
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new InvalidCredentialsError();
  }

  const { token, expiresAt } = await createSession(user._id);

  return {
    user: toUserDto(user),
    token,
    expiresAt,
  };
}

/**
 * Terminates user session. Idempotent.
 */
export async function logout(token: string): Promise<void> {
  await revokeSession(token);
}

/**
 * Retrieves the currently authenticated user by raw session token.
 */
export async function getCurrentUser(token: string): Promise<UserDto | null> {
  const principal = await validateSession(token);
  if (!principal) {
    return null;
  }

  const user = await UserModel.findById(principal.userId).exec();
  return user ? toUserDto(user) : null;
}
