import { AlertTriangle } from 'lucide-react';

export function WarningBanner() {
  return (
    <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
      <p className="text-sm text-red-800">
        Chrome AI APIs are currently in development. This playground
        demonstrates the upcoming functionality. You&apos;ll need Chrome Canary
        with experimental flags enabled to test the actual APIs.
      </p>
    </div>
  );
}
