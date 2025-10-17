import { usePlaygroundState } from '@/features/unified-playground/shared/hooks/usePlaygroundState';
import type { AICapability } from '@/features/unified-playground/shared/hooks/usePlaygroundState';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// API display names for badges
const API_DISPLAY_NAMES: Record<string, string> = {
  summarizer: 'Summarizer',
  translator: 'Translator',
  writer: 'Writer',
  rewriter: 'Rewriter',
  proofreader: 'Proofreader',
  prompt: 'Prompt',
  languageDetection: 'Lang Detect',
};

// Individual API Badge Component
interface IndividualAPIBadgeProps {
  capability?: AICapability;
  displayName: string;
}

function IndividualAPIBadge({
  capability,
  displayName,
}: IndividualAPIBadgeProps) {
  if (!capability) {
    return null;
  }

  const status = capability.status;
  const isAvailable = status === 'available';
  const isLoading = status === 'loading';
  const isUnavailable = status === 'unavailable' || status === 'error';

  const getTooltip = () => {
    if (isLoading) return 'Checking availability...';
    if (isAvailable) return `${displayName}: Available`;
    return `${displayName}: ${capability.error || 'Unavailable'}`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-200',
        isAvailable &&
          'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
        isUnavailable &&
          'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
        isLoading &&
          'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
      )}
      title={getTooltip()}
    >
      {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
      {isAvailable && <CheckCircle2 className="w-3 h-3" />}
      {isUnavailable && <XCircle className="w-3 h-3" />}
      <span className="whitespace-nowrap">{displayName}</span>
    </div>
  );
}

export function Header() {
  // Use centralized playground state with unified API checking
  const { capabilities, isLoading, availableApiCount, totalApiCount } =
    usePlaygroundState();

  // Calculate API availability metrics
  const availableCount = availableApiCount;
  const totalCount = totalApiCount;

  const aiStatus = isLoading
    ? 'loading'
    : availableCount > 0
      ? 'available'
      : 'unavailable';

  // Generate tooltip text for mobile compact badge
  const getTooltipText = () => {
    if (isLoading) return 'Checking API availability...';
    if (!capabilities || Object.keys(capabilities).length === 0)
      return 'Checking API availability...';

    const available = Object.entries(capabilities)
      .filter(([, cap]) => cap.status === 'available')
      .map(([key]) => API_DISPLAY_NAMES[key] || key)
      .join(', ');

    const unavailable = Object.entries(capabilities)
      .filter(([, cap]) => cap.status === 'unavailable')
      .map(([key]) => API_DISPLAY_NAMES[key] || key)
      .join(', ');

    return `Available: ${available || 'None'}\nUnavailable: ${unavailable || 'None'}`;
  };

  // Get ordered list of APIs
  const apiList = [
    'summarizer',
    'translator',
    'writer',
    'rewriter',
    'proofreader',
    'prompt',
    'languageDetection',
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4">
      {/* Left Group: Branding */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Chrome AI DevBench Logo */}
        <img
          src="/logo.svg"
          alt="Chrome AI DevBench Logo"
          className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
        />

        {/* Title Stack */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
            Chrome AI DevBench
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
            Interactive playground for Chrome&apos;s built-in AI APIs
          </p>
        </div>
      </div>

      {/* Right Group: Status */}
      <div className="flex items-center gap-2">
        {/* Mobile: Compact Badge (visible only on mobile) */}
        <div className="flex sm:hidden items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
            title={getTooltipText()}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                aiStatus === 'available' && 'bg-green-500',
                aiStatus === 'unavailable' && 'bg-red-500',
                aiStatus === 'loading' && 'bg-blue-500 animate-pulse',
              )}
            />
            <span className="text-xs text-gray-700 whitespace-nowrap">
              AI Status ({availableCount}/{totalCount})
            </span>
          </div>
        </div>

        {/* Desktop: Individual API Badges (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
          {apiList.map((apiName) => (
            <IndividualAPIBadge
              key={apiName}
              capability={capabilities[apiName]}
              displayName={API_DISPLAY_NAMES[apiName] || apiName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
