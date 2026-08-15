'use client';

import {
  RiCheckLine,
  RiDatabase2Line,
  RiErrorWarningLine,
  RiFlashlightLine,
} from '@remixicon/react';
import { useState } from 'react';

import { useLoadDemoSample } from '@/src/hooks/use-demo';
import { ApiClientError } from '@/src/lib/api-client';

import { Button } from '../ui/button';
import { WidgetBox } from '../ui/widget-box';

export function SampleDataCTA({ hasData }: { hasData: boolean }) {
  const [successResult, setSuccessResult] = useState<{
    plansCreated: number;
    actualsCreated: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoMutation = useLoadDemoSample();

  const handleLoadSample = () => {
    setErrorMessage(null);
    setSuccessResult(null);

    demoMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSuccessResult({
          plansCreated: data.plansCreated,
          actualsCreated: data.actualsCreated,
        });
      },
      onError: (err) => {
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Unable to load sample data. Account must have no existing records.');
        }
      },
    });
  };

  if (hasData && !successResult) {
    return null;
  }

  return (
    <WidgetBox className="relative overflow-hidden p-6 border-dashed border-2 border-primary-base/30 bg-primary-lighter/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-12 bg-primary-lighter text-primary-base">
            <RiFlashlightLine className="size-6" />
          </span>
          <div className="space-y-1">
            <h3 className="text-title-h6 font-semibold text-text-strong-950">
              Demo Assignment Dataset
            </h3>
            <p className="text-paragraph-sm text-text-sub-600 max-w-xl">
              Populate the 4 budget plans and 5 actual expense entries from the assignment
              specification to instantly test calculations, charts, and drill-down reports.
            </p>

            {successResult && (
              <div className="flex items-center gap-2 pt-2 text-paragraph-xs font-medium text-success-dark">
                <RiCheckLine className="size-4 text-success-base" />
                <span>
                  Successfully loaded {successResult.plansCreated} plans and{' '}
                  {successResult.actualsCreated} actuals!
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 pt-2 text-paragraph-xs font-medium text-error-dark">
                <RiErrorWarningLine className="size-4 text-error-base" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            size="medium"
            onClick={handleLoadSample}
            disabled={demoMutation.isPending || Boolean(successResult)}
          >
            {demoMutation.isPending ? (
              'Loading sample...'
            ) : successResult ? (
              'Sample Loaded'
            ) : (
              <>
                <RiDatabase2Line className="size-4" /> Load Sample Data
              </>
            )}
          </Button>
        </div>
      </div>
    </WidgetBox>
  );
}
