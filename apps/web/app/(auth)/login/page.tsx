import { RiUserLine } from '@remixicon/react';

import { LoginForm } from '@/src/components/auth/login-form';

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative flex size-[76px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-bg-soft-200/70 to-transparent p-px lg:size-24">
          <div className="grid size-14 place-items-center rounded-full bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 lg:size-16">
            <RiUserLine className="size-7" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-title-h6 font-semibold text-text-strong-950">Welcome back</h1>
          <p className="text-paragraph-sm text-text-sub-600 lg:text-paragraph-md">
            Enter your credentials to access your financial workspace.
          </p>
        </div>
      </div>

      <LoginForm />
    </>
  );
}
