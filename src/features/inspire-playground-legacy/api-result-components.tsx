'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  CheckCircle,
  Languages,
  FileText,
  Edit3,
  Shield,
  Search,
  Zap,
} from 'lucide-react';

import { TODO_TYPE } from '../../types/global';

interface BaseResultProps {
  output: string;
  performanceMetrics?: { duration: number; tokens?: number };
  config: TODO_TYPE;
}

// Skeleton Components
export function SummarizerResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function TranslatorResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

export function WriterResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function RewriterResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProofreaderResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

export function PromptResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function LanguageDetectionResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

// Result Components
export function SummarizerResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  const summaryType = config.type?.replace('-', ' ').toUpperCase() || 'SUMMARY';

  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          {summaryType} Result
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{config.format}</Badge>
            <Badge variant="outline">{config.length} length</Badge>
            {config.type && <Badge variant="outline">{config.type}</Badge>}
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded">
              {output}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TranslatorResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  const [original, translated] = output
    .split('\n')
    .filter((line) => line.trim());

  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Languages className="h-4 w-4 text-green-500" />
          Translation Result
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {config.sourceLanguage?.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">Source</span>
            </div>
            <div className="bg-muted/50 p-3 rounded text-sm">
              {original?.replace('Translated from', '').split(':')[1]?.trim() ||
                'Original text'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {config.targetLanguage?.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">Translation</span>
            </div>
            <div className="bg-accent/10 p-3 rounded text-sm font-medium">
              {translated || output}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WriterResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-500" />
          Generated Content
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{config.tone} tone</Badge>
            <Badge variant="outline">{config.length} length</Badge>
            <Badge variant="outline">{config.format}</Badge>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="bg-muted/50 p-4 rounded">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RewriterResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  const [original, rewritten] = output.split('\n\n');

  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-orange-500" />
          Rewritten Content
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{config.tone}</Badge>
            <Badge variant="outline">{config.length}</Badge>
            <Badge variant="outline">{config.format}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">
                Original
              </span>
              <div className="bg-muted/30 p-3 rounded text-sm">
                {original?.replace('Rewritten', '').split(':')[1]?.trim() ||
                  'Original text'}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">
                Rewritten
              </span>
              <div className="bg-accent/10 p-3 rounded text-sm">
                {rewritten || output}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProofreaderResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  const lines = output.split('\n');
  const proofreadText = lines
    .find((line) => line.includes('Proofread version:'))
    ?.split(':')[1]
    ?.trim();
  const suggestions = lines
    .find((line) => line.includes('Suggestions:'))
    ?.split(':')[1]
    ?.trim();

  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Proofreading Result
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="outline">
              {config.expectedInputLanguages?.[0]?.toUpperCase() || 'EN'}
            </Badge>
            <Badge
              variant={
                suggestions === 'No errors found.' ? 'default' : 'secondary'
              }
            >
              {suggestions === 'No errors found.'
                ? 'Clean'
                : 'Suggestions Available'}
            </Badge>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Corrected Text
              </span>
              <div className="bg-accent/10 p-3 rounded text-sm mt-1">
                {proofreadText || output}
              </div>
            </div>
            {suggestions && (
              <div>
                <span className="text-xs text-muted-foreground font-medium">
                  Suggestions
                </span>
                <div className="bg-muted/50 p-3 rounded text-sm mt-1">
                  {suggestions}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptResult({
  output,
  performanceMetrics,
  config,
}: BaseResultProps) {
  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-500" />
          AI Response
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">temp: {config.temperature}</Badge>
            <Badge variant="outline">topK: {config.topK}</Badge>
            {output.includes('Multimodal') && (
              <Badge variant="outline">Multimodal</Badge>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="bg-muted/50 p-4 rounded">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LanguageDetectionResult({
  output,
  performanceMetrics,
}: BaseResultProps) {
  const lines = output.split('\n');
  const detected = lines[0]?.split(':')[1]?.trim();
  const alternatives = lines[1]?.split(':')[1]?.trim();

  return (
    <Card className="result-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4 text-cyan-500" />
          Language Detection
          {performanceMetrics && (
            <Badge variant="secondary" className="ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              {performanceMetrics.duration}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Detected Language
            </span>
            <div className="mt-1">
              <Badge variant="default" className="text-base px-3 py-1">
                {detected || 'Unknown'}
              </Badge>
            </div>
          </div>
          {alternatives && (
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Alternative Possibilities
              </span>
              <div className="mt-1 text-sm text-muted-foreground">
                {alternatives}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
