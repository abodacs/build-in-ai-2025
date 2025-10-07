/**
 * BatchTranslationCard Component
 * Batch translation interface with progress tracking
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, X, Play, Download } from 'lucide-react';
import { type LanguageCode, type BatchItem } from '../types';

interface BatchTranslationCardProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onTranslate: (items: BatchItem[]) => Promise<void>;
  isTranslating?: boolean;
  progress?: number;
}

/**
 * BatchTranslationCard Component
 *
 * Interface for batch translation with:
 * - Dynamic item management
 * - Progress tracking
 * - Export capabilities
 */
export function BatchTranslationCard({
  sourceLanguage,
  targetLanguage,
  onTranslate,
  isTranslating = false,
  progress = 0,
}: BatchTranslationCardProps) {
  const [items, setItems] = useState<Array<{ id: string; text: string }>>([
    { id: '1', text: '' },
  ]);

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, text: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, text: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const handleTranslate = async () => {
    const batchItems: BatchItem[] = items
      .filter((item) => item.text.trim())
      .map((item) => ({
        id: item.id,
        text: item.text.trim(),
      }));

    if (batchItems.length > 0) {
      await onTranslate(batchItems);
    }
  };

  const validItemsCount = items.filter((item) => item.text.trim()).length;
  const canTranslate = validItemsCount > 0 && !isTranslating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📦 Batch Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Items */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-12">
                #{index + 1}
              </span>
              <Input
                placeholder="Enter text to translate..."
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                disabled={isTranslating}
                className="flex-1"
                data-testid={`batch-item-${item.id}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1 || isTranslating}
                data-testid={`remove-item-${item.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={addItem}
          disabled={isTranslating || items.length >= 50}
          data-testid="add-batch-item"
        >
          <Plus className="h-4 w-4" />
          Add Item {items.length >= 50 && '(Max 50)'}
        </Button>

        {/* Progress */}
        {isTranslating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Translating...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleTranslate}
            disabled={!canTranslate}
            className="flex-1 gap-2"
            data-testid="start-batch-translation"
          >
            <Play className="h-4 w-4" />
            {isTranslating
              ? 'Translating...'
              : `Translate ${validItemsCount} Items`}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled
            data-testid="export-batch-results"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()} • Max
          50 items
        </p>
      </CardContent>
    </Card>
  );
}
