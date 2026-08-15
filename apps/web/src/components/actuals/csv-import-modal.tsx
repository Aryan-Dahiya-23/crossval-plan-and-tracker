'use client';

import * as React from 'react';
import { type PositiveMoneyMinorString } from '@crossval/contracts';
import {
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiUpload2Line,
} from '@remixicon/react';
import { useMemo, useState } from 'react';

import { useImportActuals } from '../../hooks/use-actuals';
import { useCategories } from '../../hooks/use-categories';
import { ApiClientError } from '../../lib/api-client';
import { formatCentsToDollars, parseDollarsToCents } from '../../lib/money-format';
import { cn } from '../../utils/cn';
import * as Button from '../ui/button';
import * as Modal from '../ui/modal';
import * as Table from '../ui/table';
import { useToast } from '../ui/toast';

type ParsedRow = {
  rawMonth: string;
  rawCategory: string;
  rawAmount: string;
  rawNote?: string | undefined;
  isValid: boolean;
  error?: string | undefined;
  month?: string | undefined;
  categoryName?: string | undefined;
  amountMinor?: PositiveMoneyMinorString | undefined;
  note?: string | undefined;
};

type CsvImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SAMPLE_CSV = `month,category,amount,note
2026-01,Marketing,4800,Q1 Ad Campaign
2026-01,Payroll,20500,January Salaries
2026-02,Payroll,19800,February Salaries`;

export function CsvImportModal({ onOpenChange, open }: CsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories({ includeArchived: false });
  const toast = useToast();
  const importMutation = useImportActuals();

  const activeCategoryNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.name.toLowerCase().trim(), c.name);
    }
    return map;
  }, [categories]);

  // Parse CSV text into validated rows
  const parsedRows = useMemo<ParsedRow[]>(() => {
    if (!csvText.trim()) return [];

    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    // Check if first line is header
    const firstLine = lines[0]!.toLowerCase();
    const hasHeader =
      firstLine.includes('month') || firstLine.includes('category') || firstLine.includes('amount');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      // Split by comma (handling basic quotes if any)
      const parts = line.split(',').map((p) => p.replace(/^["']|["']$/g, '').trim());
      const rawMonth = parts[0] ?? '';
      const rawCategory = parts[1] ?? '';
      const rawAmount = parts[2] ?? '';
      const rawNote = parts[3] ?? '';

      // 1. Validate month format YYYY-MM
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth)) {
        return {
          rawMonth,
          rawCategory,
          rawAmount,
          rawNote,
          isValid: false,
          error: 'Month must be in YYYY-MM format',
        };
      }

      // 2. Validate category
      const matchedCategoryName = activeCategoryNames.get(rawCategory.toLowerCase().trim());
      if (!matchedCategoryName) {
        return {
          rawMonth,
          rawCategory,
          rawAmount,
          rawNote,
          isValid: false,
          error: `Category "${rawCategory}" not found in active categories`,
        };
      }

      // 3. Validate amount
      const minor = parseDollarsToCents(rawAmount);
      if (!minor || minor === '0') {
        return {
          rawMonth,
          rawCategory,
          rawAmount,
          rawNote,
          isValid: false,
          error: 'Amount must be a positive number',
        };
      }

      return {
        rawMonth,
        rawCategory,
        rawAmount,
        rawNote,
        isValid: true,
        month: rawMonth,
        categoryName: matchedCategoryName,
        amountMinor: minor as PositiveMoneyMinorString,
        note: rawNote || undefined,
      };
    });
  }, [csvText, activeCategoryNames]);

  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const hasErrors = parsedRows.some((r) => !r.isValid);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setServerError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'actuals-sample-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (validRows.length === 0 || hasErrors) return;

    setServerError(null);
    importMutation.mutate(
      {
        rows: validRows.map((r) => ({
          month: r.month!,
          categoryName: r.categoryName!,
          amountMinor: r.amountMinor!,
          note: r.note ?? null,
        })),
      },
      {
        onSuccess: (data) => {
          toast.success(`Successfully imported ${data.importedCount} expense entries.`);
          onOpenChange(false);
          setCsvText('');
          setFileName(null);
        },
        onError: (err) => {
          if (err instanceof ApiClientError) {
            setServerError(err.message);
          } else {
            setServerError('Failed to import CSV entries. One or more periods may be locked.');
          }
        },
      },
    );
  };

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="max-w-2xl max-h-[85vh] flex flex-col">
        <Modal.Header
          icon={RiUpload2Line}
          title="Import Expenses from CSV"
          description="Upload a CSV file or paste formatted rows with month, category, amount, and optional note."
        />

        <Modal.Body className="flex-1 overflow-y-auto space-y-4 pr-1">
          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl bg-error-lighter p-3 text-paragraph-xs font-medium text-error-dark ring-1 ring-inset ring-error-base/20"
            >
              <RiErrorWarningLine className="size-4 shrink-0 text-error-base" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {/* File dropzone / Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-bg-weak-50 p-4 ring-1 ring-inset ring-stroke-soft-200">
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-bg-white px-3 py-2 text-label-xs font-medium text-text-strong shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50">
                <RiFileTextLine className="size-4 text-text-sub-600" />
                <span>{fileName ? `File: ${fileName}` : 'Choose CSV File'}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              {fileName && (
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setCsvText('');
                  }}
                  className="text-text-sub-600 hover:text-error-base"
                >
                  <RiCloseLine className="size-4" />
                </button>
              )}
            </div>

            <Button.Root
              type="button"
              variant="neutral"
              mode="ghost"
              size="xsmall"
              onClick={handleDownloadSample}
            >
              <Button.Icon as={RiDownloadLine} />
              <span>Download Template</span>
            </Button.Root>
          </div>

          {/* CSV Textarea if no file selected or for manual paste */}
          <div className="space-y-1.5">
            <label className="text-label-xs font-medium text-text-sub-600">
              CSV Content (comma-separated:{' '}
              <code className="text-primary-base font-semibold">month,category,amount[,note]</code>)
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`2026-01,Marketing,4800,Ad campaign\n2026-01,Payroll,20500\n2026-02,Payroll,19800`}
              className="w-full rounded-xl bg-bg-white p-3 font-mono text-paragraph-xs text-text-strong ring-1 ring-inset ring-stroke-soft-200 focus:outline-none focus:ring-2 focus:ring-stroke-strong-950"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-label-sm font-semibold text-text-strong">
                  Parsed Rows ({validRows.length} valid of {parsedRows.length})
                </h4>
                {hasErrors && (
                  <span className="text-paragraph-xs text-error-base font-medium">
                    Fix validation errors before importing
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl ring-1 ring-inset ring-stroke-soft-200 bg-bg-white">
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head className="w-16">Status</Table.Head>
                      <Table.Head className="w-24">Month</Table.Head>
                      <Table.Head className="w-32">Category</Table.Head>
                      <Table.Head className="text-right w-24">Amount</Table.Head>
                      <Table.Head>Note / Error</Table.Head>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {parsedRows.map((row, idx) => (
                      <Table.Row
                        key={idx}
                        className={cn(
                          'border-b border-stroke-soft-200/60',
                          !row.isValid && 'bg-error-lighter/20',
                        )}
                      >
                        <Table.Cell>
                          {row.isValid ? (
                            <span className="inline-grid size-5 place-items-center rounded-full bg-success-lighter text-success-base">
                              <RiCheckLine className="size-3.5" />
                            </span>
                          ) : (
                            <span className="inline-grid size-5 place-items-center rounded-full bg-error-lighter text-error-base">
                              <RiErrorWarningLine className="size-3.5" />
                            </span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="font-medium text-text-strong text-paragraph-xs">
                          {row.rawMonth}
                        </Table.Cell>
                        <Table.Cell className="text-paragraph-xs">
                          {row.categoryName || row.rawCategory}
                        </Table.Cell>
                        <Table.Cell className="text-right font-semibold tabular-nums text-text-strong text-paragraph-xs">
                          {row.amountMinor ? formatCentsToDollars(row.amountMinor) : row.rawAmount}
                        </Table.Cell>
                        <Table.Cell className="text-paragraph-xs">
                          {row.isValid ? (
                            row.note || <span className="text-text-soft-400 italic">—</span>
                          ) : (
                            <span className="text-error-base font-medium">{row.error}</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button.Root
            type="button"
            variant="neutral"
            mode="ghost"
            onClick={() => onOpenChange(false)}
            disabled={importMutation.isPending}
          >
            Cancel
          </Button.Root>

          <Button.Root
            type="button"
            variant="primary"
            mode="filled"
            disabled={importMutation.isPending || validRows.length === 0 || hasErrors}
            onClick={handleImport}
          >
            {importMutation.isPending ? 'Importing...' : `Import ${validRows.length} Entries`}
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
export default CsvImportModal;
