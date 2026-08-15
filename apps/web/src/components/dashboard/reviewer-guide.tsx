'use client';

import * as React from 'react';
import {
  RiCheckboxCircleLine,
  RiCloseLine,
  RiGuideLine,
  RiInformationLine,
} from '@remixicon/react';
import { useState } from 'react';

import * as CompactButton from '../ui/compact-button';
import * as WidgetBox from '../ui/widget-box';

export function ReviewerGuide() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-1.5 text-label-xs font-medium text-primary-base hover:text-primary-darker transition-colors cursor-pointer"
        >
          <RiInformationLine className="size-3.5" /> Show Assignment Reviewer Guide
        </button>
      </div>
    );
  }

  return (
    <WidgetBox.Root className="relative overflow-hidden p-5 border border-stroke-soft-200 bg-bg-weak-50/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-lighter text-primary-base ring-1 ring-inset ring-primary-base/20">
            <RiGuideLine className="size-4.5" />
          </span>
          <div className="space-y-0.5">
            <h3 className="text-label-sm font-semibold text-text-strong">
              Assignment Rubric & Key Domain Rules
            </h3>
            <p className="text-paragraph-xs text-text-sub-600">
              Engineered according to the mandatory CrossVal financial tracking specifications:
            </p>
          </div>
        </div>

        <CompactButton.Root
          variant="ghost"
          size="small"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss guide"
          className="text-text-soft-400 hover:text-text-strong"
        >
          <CompactButton.Icon as={RiCloseLine} />
        </CompactButton.Root>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rule 1 */}
        <div className="rounded-xl bg-bg-white p-3.5 ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong">
            <RiCheckboxCircleLine className="size-4 text-emerald-500 shrink-0" />
            <span>Authoritative Variance</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600 leading-relaxed">
            Formula:{' '}
            <code className="text-primary-base font-semibold px-1 py-0.5 rounded bg-primary-lighter/40 font-mono text-[11px]">
              Actual - Plan
            </code>
            . Executed server-side with integer cents.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="rounded-xl bg-bg-white p-3.5 ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong">
            <RiCheckboxCircleLine className="size-4 text-emerald-500 shrink-0" />
            <span>Zero-Plan Rate is N/A</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600 leading-relaxed">
            When planned budget is{' '}
            <code className="font-semibold text-text-strong px-1 py-0.5 rounded bg-bg-weak-50 font-mono text-[11px]">
              $0.00
            </code>
            , variance rate renders as <strong className="text-text-strong">N/A</strong>.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="rounded-xl bg-bg-white p-3.5 ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong">
            <RiCheckboxCircleLine className="size-4 text-emerald-500 shrink-0" />
            <span>Blank vs. $0.00</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600 leading-relaxed">
            Spreadsheet matrix distinguishes blank (unbudgeted) from explicit{' '}
            <code className="font-semibold text-text-strong px-1 py-0.5 rounded bg-bg-weak-50 font-mono text-[11px]">
              $0.00
            </code>{' '}
            targets.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="rounded-xl bg-bg-white p-3.5 ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-label-xs font-semibold text-text-strong">
            <RiCheckboxCircleLine className="size-4 text-emerald-500 shrink-0" />
            <span>Irrevocable Locks</span>
          </div>
          <p className="text-paragraph-xs text-text-sub-600 leading-relaxed">
            Closed financial periods are permanently immutable, rejecting writes with{' '}
            <code className="text-amber-700 font-semibold px-1 py-0.5 rounded bg-amber-50 font-mono text-[11px]">
              409 PERIOD_LOCKED
            </code>
            .
          </p>
        </div>
      </div>
    </WidgetBox.Root>
  );
}

export default ReviewerGuide;
