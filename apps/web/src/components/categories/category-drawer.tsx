'use client';

import * as React from 'react';
import {
  RiArchiveLine,
  RiCheckLine,
  RiEditLine,
  RiErrorWarningLine,
  RiPriceTag3Line,
} from '@remixicon/react';
import { useState, type FormEvent } from 'react';

import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../hooks/use-categories';
import { ApiClientError } from '../../lib/api-client';
import { cn } from '../../utils/cn';
import * as Button from '../ui/button';
import { ColorPicker, getCategoryColorStyle } from '../ui/color-picker';
import * as CompactButton from '../ui/compact-button';
import * as Drawer from '../ui/drawer';
import * as Input from '../ui/input';
import { Skeleton } from '../ui/skeleton';

type CategoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryDrawer({ onOpenChange, open }: CategoryDrawerProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('purple');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('purple');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories({
    includeArchived: showArchived,
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const archiveMutation = useArchiveCategory();

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setErrorMessage(null);
    createMutation.mutate(
      { name: newName.trim(), colorKey: newColor },
      {
        onSuccess: () => {
          setNewName('');
          setNewColor('purple');
        },
        onError: (err) => {
          if (err instanceof ApiClientError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Unable to create category.');
          }
        },
      },
    );
  };

  const handleStartEdit = (id: string, currentName: string, currentColor?: string | null) => {
    setEditingId(id);
    setEditingName(currentName);
    setEditingColor(currentColor ?? 'purple');
    setErrorMessage(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;

    setErrorMessage(null);
    updateMutation.mutate(
      {
        id,
        data: { name: editingName.trim(), colorKey: editingColor },
      },
      {
        onSuccess: () => {
          setEditingId(null);
        },
        onError: (err) => {
          if (err instanceof ApiClientError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Unable to update category.');
          }
        },
      },
    );
  };

  const handleArchive = (id: string) => {
    setErrorMessage(null);
    archiveMutation.mutate(id, {
      onError: (err) => {
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Unable to archive category.');
        }
      },
    });
  };

  const activeCategories = categories.filter((c) => c.archivedAt === null);
  const archivedCategories = categories.filter((c) => c.archivedAt !== null);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-[440px]">
        <Drawer.Header>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary-lighter text-primary-base">
              <RiPriceTag3Line className="size-5" aria-hidden="true" />
            </span>
            <div>
              <Drawer.Title>Manage Categories</Drawer.Title>
              <Drawer.Description>Organize plans and expenses by category</Drawer.Description>
            </div>
          </div>
        </Drawer.Header>

        <Drawer.Body className="flex flex-1 flex-col gap-6">
          {/* Create Category Form */}
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-2xl bg-bg-weak-50 p-4 ring-1 ring-inset ring-stroke-soft-200"
          >
            <h3 className="text-label-sm font-semibold text-text-strong">New Category</h3>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-error-lighter p-2.5 text-paragraph-xs font-medium text-error-dark ring-1 ring-inset ring-error-base/20"
              >
                <RiErrorWarningLine
                  className="size-4 shrink-0 text-error-base"
                  aria-hidden="true"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-label-xs font-medium text-text-sub-600">Category Name</label>
              <Input.Root size="medium">
                <Input.Wrapper>
                  <Input.Input
                    id="category-name"
                    placeholder="e.g. Marketing, Cloud Hosting"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </Input.Wrapper>
              </Input.Root>
            </div>

            <ColorPicker value={newColor} onChange={setNewColor} />

            <Button.Root
              type="submit"
              size="small"
              className="w-full"
              disabled={!newName.trim() || createMutation.isPending}
            >
              <span>{createMutation.isPending ? 'Adding...' : 'Add Category'}</span>
            </Button.Root>
          </form>

          {/* List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-sm font-semibold text-text-strong">
                Your Categories ({categories.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="text-paragraph-xs font-medium text-primary-base hover:text-primary-darker cursor-pointer"
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stroke-soft-200 p-6 text-center text-paragraph-sm text-text-sub-600">
                No categories found. Create your first category above.
              </div>
            ) : (
              <div className="divide-y divide-stroke-soft-200 rounded-xl bg-bg-white ring-1 ring-inset ring-stroke-soft-200 overflow-hidden">
                {activeCategories.map((cat) => {
                  const colorStyle = getCategoryColorStyle(cat.colorKey);
                  const isEditing = editingId === cat.id;

                  if (isEditing) {
                    return (
                      <div key={cat.id} className="space-y-3 p-3.5 bg-bg-weak-50">
                        <Input.Root size="small">
                          <Input.Wrapper>
                            <Input.Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="Category name"
                              autoFocus
                            />
                          </Input.Wrapper>
                        </Input.Root>
                        <ColorPicker value={editingColor} onChange={setEditingColor} />
                        <div className="flex items-center gap-2 pt-1">
                          <Button.Root
                            size="xxsmall"
                            onClick={() => handleSaveEdit(cat.id)}
                            disabled={!editingName.trim() || updateMutation.isPending}
                          >
                            <Button.Icon as={RiCheckLine} />
                            <span>Save</span>
                          </Button.Root>
                          <Button.Root
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            onClick={() => setEditingId(null)}
                          >
                            <span>Cancel</span>
                          </Button.Root>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 p-3.5 transition duration-150 hover:bg-bg-weak-50/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-xs ring-1 ring-inset font-medium',
                            colorStyle.badge,
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', colorStyle.bg)} />
                          <span className="truncate">{cat.name}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <CompactButton.Root
                          size="large"
                          variant="ghost"
                          onClick={() => handleStartEdit(cat.id, cat.name, cat.colorKey)}
                          aria-label={`Rename ${cat.name}`}
                        >
                          <CompactButton.Icon
                            as={RiEditLine}
                            className="text-text-sub-600 hover:text-text-strong"
                          />
                        </CompactButton.Root>
                        <CompactButton.Root
                          size="large"
                          variant="ghost"
                          onClick={() => handleArchive(cat.id)}
                          aria-label={`Archive ${cat.name}`}
                          disabled={archiveMutation.isPending}
                        >
                          <CompactButton.Icon
                            as={RiArchiveLine}
                            className="text-text-sub-600 hover:text-error-base"
                          />
                        </CompactButton.Root>
                      </div>
                    </div>
                  );
                })}

                {showArchived &&
                  archivedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 p-3.5 opacity-60 bg-bg-weak-50/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="truncate text-paragraph-sm line-through text-text-sub-600">
                          {cat.name}
                        </span>
                        <span className="rounded-full bg-bg-weak-50 px-2 py-0.5 text-label-xs text-text-disabled-300 ring-1 ring-inset ring-stroke-soft-200">
                          Archived
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
export default CategoryDrawer;
