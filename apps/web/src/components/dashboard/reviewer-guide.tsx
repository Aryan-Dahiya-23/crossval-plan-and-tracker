'use client';

import {
  RiCheckboxCircleLine,
  RiCloseLine,
  RiGuideLine,
  RiInformationLine,
} from '@remixicon/react';
import { useState } from 'react';

import { WidgetBox } from '../ui/widget-box';

export function ReviewerGuide() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-1.5 text-label-xs font-medium text-primary-base hover:underline"
        >
          <RiInformationLine className="size-3.5" /> Show Assignment Reviewer Guide
        </button>
      </div>
    );
  }

  return (
    <WidgetBox className="relative overflow-hidden p-5 border border-stroke-soft-200 bg-bg-weak-50/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-8 bg-primary-lighter text-primary-base">
            <RiGuideLine className="size-4.5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-label-sm font-semibold text-text-strong-950">
              Assignment Rubric & Key Domain Rules
            </h3>
            <p className="text-paragraph-xs text-text-sub-600">
              This application was engineered according to the mandatory CrossVal financial tracking
              specifications:
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="rounded-6 p-1 text-text-soft-400 hover:text-text-strong-950 hover:bg-bg-weak-50"
          aria-label="Dismiss guide"
        >
          <RiCloseLine className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rule 1 */}
        <div className="rounded-10 bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200 space-y-1">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong-950">
            <RiCheckboxCircleLine className="size-3.5 text-success-base shrink-0" />
            <span>Authoritative Variance</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600">
            Formula:{' '}
            <code className="text-primary-base font-semibold">Variance = Actual - Plan</code>. All
            calculations are executed server-side with integer minor cents.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="rounded-10 bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200 space-y-1">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong-950">
            <RiCheckboxCircleLine className="size-3.5 text-success-base shrink-0" />
            <span>Zero-Plan Rate is N/A</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600">
            When planned budget is <code className="font-semibold text-text-strong-950">$0.00</code>
            , variance rate renders as <strong className="text-text-strong-950">N/A</strong> (never
            0% or Infinity%).
          </p>
        </div>

        {/* Rule 3 */}
        <div className="rounded-10 bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200 space-y-1">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong-950">
            <RiCheckboxCircleLine className="size-3.5 text-success-base shrink-0" />
            <span>Blank vs. $0.00</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600">
            Planning spreadsheet distinguishes blank (unbudgeted month) from explicit{' '}
            <code className="font-semibold text-text-strong-950">$0.00</code> targets.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="rounded-10 bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200 space-y-1">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong-950">
            <RiCheckboxCircleLine className="size-3.5 text-success-base shrink-0" />
            <span>Irrevocable Locks</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600">
            Closed financial periods are permanently immutable, disabling cell mutations and
            rejecting API writes with{' '}
            <code className="text-warning-dark font-semibold">409 PERIOD_LOCKED</code>.
          </p>
        </div>
      </div>
    </WidgetBox>
  );
}
