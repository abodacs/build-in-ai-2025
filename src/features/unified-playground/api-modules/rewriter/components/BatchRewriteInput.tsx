/**
 * BatchRewriteInput Component
 *
 * Input component for batch text rewriting operations.
 * Supports manual entry, file import, and bulk paste.
 *
 * @module rewriter/components/BatchRewriteInput
 */

import { useState, useRef, useCallback } from 'react';
import {
  FileText,
  Upload,
  Plus,
  X,
  List,
  FileUp,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { BatchRewriteItem, BatchInputFormat } from '../types/batch.types';

// ============================================================================
// Types
// ============================================================================

export interface BatchRewriteInputProps {
  /** Current batch items */
  items: BatchRewriteItem[];

  /** Add items callback */
  onAddItems: (texts: string[], contexts?: string[]) => void;

  /** Remove item callback */
  onRemoveItem: (itemId: string) => void;

  /** Clear all items callback */
  onClearAll: () => void;

  /** Import from file callback */
  onImportFile?: (file: File, format: BatchInputFormat) => Promise<void>;

  /** Disabled state */
  disabled?: boolean;

  /** Maximum items allowed */
  maxItems?: number;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Batch rewrite input component
 *
 * Allows users to add multiple texts for batch rewriting.
 *
 * @example
 * ```tsx
 * <BatchRewriteInput
 *   items={batch.items}
 *   onAddItems={batch.actions.addItems}
 *   onRemoveItem={batch.actions.removeItem}
 *   onClearAll={batch.actions.clearItems}
 * />
 * ```
 */
export function BatchRewriteInput({
  items,
  onAddItems,
  onRemoveItem,
  onClearAll,
  onImportFile,
  disabled = false,
  maxItems = 100,
  className,
}: BatchRewriteInputProps) {
  // State
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [importFormat, setImportFormat] = useState<BatchInputFormat>('csv');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats
  const totalChars = items.reduce(
    (sum, item) => sum + item.originalText.length,
    0,
  );
  const avgChars = items.length > 0 ? Math.round(totalChars / items.length) : 0;
  const canAddMore = items.length < maxItems;

  // ========================================================================
  // Handlers
  // ========================================================================

  /**
   * Handle adding text(s)
   */
  const handleAdd = useCallback(() => {
    if (!inputText.trim()) return;

    if (inputMode === 'single') {
      // Add single item
      onAddItems([inputText.trim()]);
      setInputText('');
    } else {
      // Bulk mode: split by newlines
      const texts = inputText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (texts.length === 0) return;

      // Check if would exceed max items
      if (items.length + texts.length > maxItems) {
        setImportError(
          `Cannot add ${texts.length} items. Maximum ${maxItems} items allowed (currently have ${items.length}).`,
        );
        return;
      }

      onAddItems(texts);
      setInputText('');
      setImportError(null);
    }
  }, [inputText, inputMode, onAddItems, items.length, maxItems]);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImportFile) return;

      setIsImporting(true);
      setImportError(null);

      try {
        await onImportFile(file, importFormat);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        setImportError(
          error instanceof Error ? error.message : 'Failed to import file',
        );
      } finally {
        setIsImporting(false);
      }
    },
    [onImportFile, importFormat],
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <List className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          Batch Input
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Add multiple texts to rewrite in batch
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Mode Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={inputMode === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('single')}
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-1" />
            Single Item
          </Button>
          <Button
            variant={inputMode === 'bulk' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('bulk')}
            disabled={disabled}
          >
            <FileText className="w-4 h-4 mr-1" />
            Bulk Paste
          </Button>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <Label htmlFor="batch-input-text">
            {inputMode === 'single' ? 'Text to Add' : 'Texts (one per line)'}
          </Label>
          <Textarea
            id="batch-input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || !canAddMore}
            placeholder={
              inputMode === 'single'
                ? 'Enter text to add...'
                : 'Paste multiple texts, one per line...'
            }
            rows={inputMode === 'single' ? 3 : 6}
            className="resize-y font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {inputText.length} characters
              {inputMode === 'bulk' &&
                inputText.split('\n').filter((l) => l.trim()).length > 0 &&
                ` • ${inputText.split('\n').filter((l) => l.trim()).length} lines`}
            </span>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={disabled || !inputText.trim() || !canAddMore}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* File Import */}
        {onImportFile && (
          <div className="space-y-2 pt-2 border-t">
            <Label>Import from File</Label>
            <div className="flex flex-wrap gap-2">
              <Select
                value={importFormat}
                onValueChange={(value) =>
                  setImportFormat(value as BatchInputFormat)
                }
                disabled={disabled || isImporting}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || !canAddMore || isImporting}
              >
                {isImporting ? (
                  <>
                    <Upload className="w-4 h-4 mr-1 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4 mr-1" />
                    Choose File
                  </>
                )}
              </Button>

              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              CSV: First column = text, second column = context (optional)
              <br />
              TXT: One text per line
              <br />
              JSON: Array of strings or objects with &quot;text&quot; property
            </p>
          </div>
        )}

        {/* Import Error */}
        {importError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}

        {/* Items Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {items.length} / {maxItems} items
            </Badge>
            <Badge variant="outline">{totalChars.toLocaleString()} chars</Badge>
            {items.length > 0 && (
              <Badge variant="outline">{avgChars} avg chars/item</Badge>
            )}
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-2 pt-2 border-t max-h-[300px] overflow-y-auto">
            <Label>Items to Rewrite</Label>
            <div className="space-y-1">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-md border bg-muted/30',
                    'hover:bg-muted/50 transition-colors group',
                  )}
                >
                  <span className="text-xs text-muted-foreground mt-0.5 min-w-[2rem]">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.originalText}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.originalText.length} chars
                      </Badge>
                      {item.status !== 'pending' && (
                        <Badge
                          variant={
                            item.status === 'completed'
                              ? 'default'
                              : item.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={disabled}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No items added yet</p>
            <p className="text-xs mt-1">
              Add texts manually or import from a file
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export
// ============================================================================

export default BatchRewriteInput;
