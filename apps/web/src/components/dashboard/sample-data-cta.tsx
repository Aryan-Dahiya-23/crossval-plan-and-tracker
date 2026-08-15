'use client';

import * as React from 'react';
import { RiDatabase2Line, RiFlashlightLine } from '@remixicon/react';

import { useLoadDemoSample } from '../../hooks/use-demo';
import { ApiClientError } from '../../lib/api-client';
import * as Button from '../ui/button';
import { useToast } from '../ui/toast';
import * as WidgetBox from '../ui/widget-box';

export function SampleDataCTA({
  hasData,
  isLoading = false,
}: {
  hasData: boolean;
  isLoading?: boolean;
}) {
  const demoMutation = useLoadDemoSample();
  const toast = useToast();

  const handleLoadSample = () => {
    demoMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(
          `Successfully loaded ${data.plansCreated} budget plans and ${data.actualsCreated} actual expense entries!`,
        );
      },
      onError: (err) => {
        if (err instanceof ApiClientError) {
          toast.error(err.message);
        } else {
          toast.error('Unable to load sample data. Account must have no existing records.');
        }
      },
    });
  };

  // Automatically hide the card while data is loading or if the account already contains records
  if (isLoading || hasData) {
    return null;
  }

  return (
    <WidgetBox.Root className="relative overflow-hidden p-6 border-dashed border-2 border-primary-base/30 bg-primary-lighter/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-lighter text-primary-base">
            <RiFlashlightLine className="size-6" />
          </span>
          <div className="space-y-1">
            <h3 className="text-title-h6 font-semibold text-text-strong">
              Demo Assignment Dataset
            </h3>
            <p className="text-paragraph-sm text-text-sub-600 max-w-xl">
              Populate the 4 budget plans and 10 granular actual expense entries from the assignment
              specification to instantly test calculations, charts, and drill-down reports.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Button.Root size="medium" onClick={handleLoadSample} disabled={demoMutation.isPending}>
            {demoMutation.isPending ? (
              <span>Loading sample...</span>
            ) : (
              <>
                <Button.Icon as={RiDatabase2Line} />
                <span>Load Sample Data</span>
              </>
            )}
          </Button.Root>
        </div>
      </div>
    </WidgetBox.Root>
  );
}

export default SampleDataCTA;
