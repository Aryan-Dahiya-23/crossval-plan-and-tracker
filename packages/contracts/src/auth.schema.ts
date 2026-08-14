import { z } from 'zod';

export const signupRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .max(255, 'Email address must not exceed 255 characters.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must not exceed 128 characters.'),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .max(255, 'Email address must not exceed 255 characters.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserDto = z.infer<typeof userDtoSchema>;

export const authResponseSchema = z.object({
  data: userDtoSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
