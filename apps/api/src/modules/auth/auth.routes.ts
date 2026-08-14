import { loginRequestSchema, signupRequestSchema } from '@crossval/contracts';
import { Router } from 'express';

import { createRateLimiter, requireAuth, validate } from '../../http/middleware/index.js';
import { handleLogin, handleLogout, handleMe, handleSignup } from './auth.controller.js';

export function createAuthRouter(): Router {
  const router = Router();

  // Rate limiting for auth mutations (10 attempts per 15 minutes in production)
  const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  });

  router.post('/signup', authLimiter, validate({ body: signupRequestSchema }), (req, res, next) => {
    void handleSignup(req, res).catch(next);
  });

  router.post('/login', authLimiter, validate({ body: loginRequestSchema }), (req, res, next) => {
    void handleLogin(req, res).catch(next);
  });

  router.post('/logout', (req, res, next) => {
    void handleLogout(req, res).catch(next);
  });

  router.get('/me', requireAuth, (req, res, next) => {
    void handleMe(req, res).catch(next);
  });

  return router;
}
