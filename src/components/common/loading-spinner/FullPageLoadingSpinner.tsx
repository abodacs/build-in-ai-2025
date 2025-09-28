import { LoadingSpinner } from './LoadingSpinner';

export function FullPageLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-muted-foreground">
          {text || 'Loading Chrome AI DevBench...'}
        </p>
      </div>
    </div>
  );
}
