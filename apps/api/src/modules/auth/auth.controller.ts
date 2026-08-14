import type { LoginRequest, SignupRequest } from '@crossval/contracts';
import type { Request, Response } from 'express';

import { clearSessionCookie, getSessionCookieName, setSessionCookie } from '../../http/cookie.js';
import { AuthenticationRequiredError } from '../../http/errors.js';
import { UserModel } from '../users/user.model.js';
import { login, logout, signup, toUserDto } from './auth.service.js';

export async function handleSignup(req: Request, res: Response): Promise<void> {
  const body = req.body as SignupRequest;
  const result = await signup(body);

  setSessionCookie(res, result.token, result.expiresAt);
  res.status(201).json({ data: result.user });
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginRequest;
  const result = await login(body);

  setSessionCookie(res, result.token, result.expiresAt);
  res.status(200).json({ data: result.user });
}

export async function handleLogout(req: Request, res: Response): Promise<void> {
  const cookieName = getSessionCookieName();
  let token: string | undefined = req.cookies?.[cookieName];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (token) {
    await logout(token);
  }

  clearSessionCookie(res);
  res.status(204).end();
}

export async function handleMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AuthenticationRequiredError();
  }

  const user = await UserModel.findById(req.user.userId).exec();
  if (!user) {
    throw new AuthenticationRequiredError();
  }

  res.status(200).json({ data: toUserDto(user) });
}
