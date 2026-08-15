'use client';

import * as React from 'react';
import { RiErrorWarningLine, RiLock2Line, RiMailLine } from '@remixicon/react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { useLogin } from '../../hooks/use-auth';
import { ApiClientError } from '../../lib/api-client';
import * as Button from '../ui/button';
import * as Input from '../ui/input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    loginMutation.mutate({ email: email.trim(), password });
  };

  const errorMessage = loginMutation.error
    ? loginMutation.error instanceof ApiClientError
      ? loginMutation.error.message
      : 'Unable to log in. Please try again.'
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl bg-error-lighter p-3 text-paragraph-sm font-medium text-error-dark ring-1 ring-inset ring-error-base/20"
        >
          <RiErrorWarningLine className="size-5 shrink-0 text-error-base" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-label-xs font-medium text-text-sub-600">Email address</label>
        <Input.Root size="medium" hasError={Boolean(fieldErrors.email)}>
          <Input.Wrapper>
            <Input.Icon as={RiMailLine} />
            <Input.Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </Input.Wrapper>
        </Input.Root>
        {fieldErrors.email && (
          <p className="text-paragraph-xs text-error-base">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-label-xs font-medium text-text-sub-600">Password</label>
        <Input.Root size="medium" hasError={Boolean(fieldErrors.password)}>
          <Input.Wrapper>
            <Input.Icon as={RiLock2Line} />
            <Input.Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </Input.Wrapper>
        </Input.Root>
        {fieldErrors.password && (
          <p className="text-paragraph-xs text-error-base">{fieldErrors.password}</p>
        )}
      </div>

      <Button.Root
        type="submit"
        size="medium"
        className="w-full mt-2"
        disabled={loginMutation.isPending}
      >
        <span>{loginMutation.isPending ? 'Logging in...' : 'Log in'}</span>
      </Button.Root>

      <p className="pt-2 text-center text-paragraph-sm text-text-sub-600">
        New to the tracker?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary-base hover:text-primary-darker focus-visible:rounded focus-visible:shadow-button-focus"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
export default LoginForm;
