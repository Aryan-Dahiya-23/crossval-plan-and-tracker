import { RiLock2Line, RiMailLine, RiUserAddLine, RiUserLine } from '@remixicon/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '../ui/button';

type AuthFoundationProps = {
  mode: 'login' | 'signup';
};

function FieldPreview({
  icon,
  label,
  placeholder,
}: {
  icon: ReactNode;
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-label-sm text-text-strong-950">{label}</div>
      <div className="flex h-10 items-center gap-2.5 rounded-10 bg-bg-white-0 px-3 text-text-disabled-300 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <span className="[&>svg]:size-5">{icon}</span>
        <span className="text-paragraph-sm">{placeholder}</span>
      </div>
    </div>
  );
}

export function AuthFoundation({ mode }: AuthFoundationProps) {
  const isLogin = mode === 'login';

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex size-[76px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-bg-soft-200/70 to-transparent p-px lg:size-24">
          <div className="grid size-14 place-items-center rounded-full bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 lg:size-16">
            {isLogin ? (
              <RiUserLine className="size-7" aria-hidden="true" />
            ) : (
              <RiUserAddLine className="size-7" aria-hidden="true" />
            )}
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-title-h6 font-semibold text-text-strong-950">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-paragraph-sm text-text-sub-600 lg:text-paragraph-md">
            {isLogin
              ? 'Enter your details to access your financial workspace.'
              : 'Start planning and tracking your monthly spending.'}
          </p>
        </div>
      </div>

      <div className="space-y-4" aria-label={`${isLogin ? 'Login' : 'Signup'} form preview`}>
        {!isLogin && (
          <FieldPreview icon={<RiUserLine />} label="Name" placeholder="Your full name" />
        )}
        <FieldPreview icon={<RiMailLine />} label="Email address" placeholder="you@example.com" />
        <FieldPreview icon={<RiLock2Line />} label="Password" placeholder="••••••••" />
        <Button fullWidth disabled>
          {isLogin ? 'Log in' : 'Create account'}
        </Button>
        <p className="text-center text-paragraph-xs text-text-soft-400">
          Authentication becomes active in Phase 11.
        </p>
      </div>

      <p className="text-center text-paragraph-sm text-text-sub-600">
        {isLogin ? 'New to the tracker?' : 'Already have an account?'}{' '}
        <Link
          href={isLogin ? '/signup' : '/login'}
          className="font-medium text-primary-base hover:text-primary-darker focus-visible:rounded focus-visible:shadow-button-focus"
        >
          {isLogin ? 'Create an account' : 'Log in'}
        </Link>
      </p>
    </>
  );
}
