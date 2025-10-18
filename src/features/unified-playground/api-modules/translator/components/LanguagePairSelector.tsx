/**
 * LanguagePairSelector Component
 * Visual quick-select for popular language pairs
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import {
  type LanguageCode,
  POPULAR_LANGUAGE_PAIRS,
  SUPPORTED_LANGUAGES,
} from '../types';

interface LanguagePairSelectorProps {
  onSelectPair: (source: LanguageCode, target: LanguageCode) => void;
  currentSource?: LanguageCode;
  currentTarget?: LanguageCode;
}

/**
 * LanguagePairSelector Component
 *
 * Quick selection for popular language pairs
 */
export function LanguagePairSelector({
  onSelectPair,
  currentSource,
  currentTarget,
}: LanguagePairSelectorProps) {
  const isCurrentPair = (source: LanguageCode, target: LanguageCode) => {
    return currentSource === source && currentTarget === target;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          ⭐ Popular Language Pairs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 touch-gap sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_LANGUAGE_PAIRS.map((pair) => {
            const sourceInfo = SUPPORTED_LANGUAGES[pair.source];
            const targetInfo = SUPPORTED_LANGUAGES[pair.target];
            const isCurrent = isCurrentPair(pair.source, pair.target);

            return (
              <Button
                key={`${pair.source}-${pair.target}`}
                variant={isCurrent ? 'default' : 'outline'}
                className="h-auto justify-start gap-2 p-3 touch-target tap-fast"
                onClick={() => onSelectPair(pair.source, pair.target)}
                data-testid={`pair-${pair.source}-${pair.target}`}
              >
                <span className="text-lg">{sourceInfo.flag}</span>
                <span className="text-sm">{sourceInfo.code.toUpperCase()}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="text-lg">{targetInfo.flag}</span>
                <span className="text-sm">{targetInfo.code.toUpperCase()}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
