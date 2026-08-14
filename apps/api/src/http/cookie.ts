import type { CookieOptions, Response } from 'express';

export const DEFAULT_SESSION_COOKIE_NAME = 'crossval_session';

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME ?? DEFAULT_SESSION_COOKIE_NAME;
}

export function getCookieOptions(expires?: Date): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    ...(expires ? { expires } : {}),
  };
}

/**
 * Sets the HttpOnly session cookie on the Express response.
 */
export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  const cookieName = getSessionCookieName();
  res.cookie(cookieName, token, getCookieOptions(expiresAt));
}

/**
 * Clears the session cookie by setting its expiration to the Unix epoch.
 */
export function clearSessionCookie(res: Response): void {
  const cookieName = getSessionCookieName();
  res.clearCookie(cookieName, getCookieOptions());
}
