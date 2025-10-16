/**
 * Language Detection Playground Tab
 *
 * @module language-detection/components/tabs/PlaygroundTab
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, XCircle, AlertCircle } from 'lucide-react';
import { useLanguageDetection } from '../../hooks';
import {
  DEFAULT_DETECTION_CONFIG,
  getLanguageName,
  getConfidenceColor,
} from '../../types';
import { FieldError } from '../../../shared/components';
import { validateTextInput } from '../../../shared/utils/validation';
import { cn } from '@/lib/utils';

export function LanguageDetectionMain() {
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState<{
    message: string;
    helpText?: string;
  } | null>(null);

  const { isDetecting, results, error, actions } = useLanguageDetection(
    DEFAULT_DETECTION_CONFIG,
  );

  /**
   * Validate input text
   */
  useEffect(() => {
    if (inputText.length === 0) {
      setInputError(null); // No error for empty input
      return;
    }

    const validation = validateTextInput(inputText, {
      minLength: 10,
      maxLength: 10000,
      required: false,
    });

    if (!validation.valid && validation.error) {
      setInputError({
        message: validation.error.message,
        helpText: validation.error.helpText,
      });
    } else {
      setInputError(null);
    }
  }, [inputText]);

  const handleDetect = async () => {
    if (!inputText.trim()) return;
    await actions.detect(inputText);
  };

  const handleClear = () => {
    setInputText('');
    actions.reset();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Text to Analyze</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to detect language..."
              className={cn(
                'min-h-[150px]',
                inputError && 'border-red-400 dark:border-red-500',
              )}
              disabled={isDetecting}
              aria-invalid={!!inputError}
              aria-describedby={
                inputError ? 'language-detection-error' : undefined
              }
            />
            {inputError && (
              <FieldError
                id="language-detection-error"
                message={inputError.message}
                helpText={inputError.helpText}
                severity="error"
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDetect}
              disabled={!inputText.trim() || isDetecting}
              className="flex-1"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Detect Language
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              disabled={!inputText || isDetecting}
              variant="outline"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detection Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {getLanguageName(result.detectedLanguage)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Code: {result.detectedLanguage}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-4`}
                  style={{
                    backgroundColor: `${getConfidenceColor(result.confidence)}20`,
                    borderColor: getConfidenceColor(result.confidence),
                  }}
                >
                  {(result.confidence * 100).toFixed(1)}% confidence
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LanguageDetectionMain;
