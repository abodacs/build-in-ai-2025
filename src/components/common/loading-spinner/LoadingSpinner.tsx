import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  )
}

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
  )
}

export function AiLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6">
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-100/20 pulse-ai" />
      </div>
      <div className="text-sm">
        <div className="font-medium text-foreground">
          {text || 'AI is thinking...'}
        </div>
        <div className="text-muted-foreground">Powered by Chrome AI</div>
      </div>
    </div>
  )
}