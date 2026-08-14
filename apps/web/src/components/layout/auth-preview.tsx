import { RiBarChart2Line, RiLock2Line } from '@remixicon/react';

export function AuthPreview() {
  const bars = [38, 62, 46, 78, 56, 86, 68];

  return (
    <div className="relative flex size-full min-h-[720px] flex-col items-center justify-center overflow-hidden rounded-16 bg-[#F6F8FF] px-10 py-12">
      <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary-base/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-information-base/10 blur-3xl" />

      <div className="relative w-full max-w-[580px] rounded-20 bg-bg-white-0 p-5 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
        <div className="flex items-center gap-3 pb-5">
          <span className="grid size-10 place-items-center rounded-full bg-primary-lighter text-primary-base">
            <RiBarChart2Line className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-label-sm text-text-strong-950">Plan vs Actual</p>
            <p className="text-paragraph-xs text-text-sub-600">January – June 2026</p>
          </div>
          <span className="ml-auto inline-flex h-6 items-center gap-1.5 rounded-full bg-success-lighter px-2.5 text-label-xs text-success-dark">
            <span className="size-1.5 rounded-full bg-success-base" />
            Open
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['Planned', 'Actual', 'Variance'].map((label, index) => (
            <div key={label} className="rounded-12 bg-bg-weak-50 p-3.5">
              <p className="text-paragraph-xs text-text-sub-600">{label}</p>
              <div
                className="mt-2 h-5 rounded bg-bg-soft-200"
                style={{ width: `${72 - index * 8}%` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-12 border border-stroke-soft-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-label-sm text-text-strong-950">Monthly performance</p>
            <span className="text-paragraph-xs text-text-soft-400">6 months</span>
          </div>
          <div className="mt-5 flex h-36 items-end gap-3 border-b border-stroke-soft-200 px-2">
            {bars.map((height, index) => (
              <div key={height} className="flex h-full flex-1 items-end justify-center gap-1">
                <span
                  className="w-2.5 rounded-t bg-primary-base"
                  style={{ height: `${height}%` }}
                />
                <span
                  className="w-2.5 rounded-t bg-warning-base/70"
                  style={{ height: `${Math.max(24, height - (index % 2 === 0 ? 12 : -8))}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-5 text-paragraph-xs text-text-sub-600">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary-base" /> Planned
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-warning-base" /> Actual
            </span>
          </div>
        </div>

        <div className="absolute -bottom-7 -right-7 flex items-center gap-3 rounded-12 bg-bg-white-0 p-3.5 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
          <span className="grid size-9 place-items-center rounded-full bg-bg-weak-50 text-text-sub-600">
            <RiLock2Line className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-label-xs text-text-strong-950">Period controls</p>
            <p className="text-paragraph-xs text-text-soft-400">Keep closed months stable</p>
          </div>
        </div>
      </div>

      <div className="relative mt-14 max-w-md text-center">
        <h2 className="text-title-h5 text-text-strong-950">Know where every dollar stands</h2>
        <p className="mt-2 text-paragraph-sm text-text-sub-600">
          Compare targets and actuals, understand variance, and close each month with confidence.
        </p>
      </div>
    </div>
  );
}
