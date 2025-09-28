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
  );
}
