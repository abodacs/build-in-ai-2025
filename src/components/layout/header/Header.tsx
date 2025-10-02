import { useState, useEffect } from 'react';
import { useAppStore, AiCapabilities } from '@/stores/appStore';
import { testAiAvailability } from '@/services/aiService';
import { cn } from '@/lib/utils';

export function Header() {
  const { aiCapabilities, setAiCapabilities } = useAppStore();
  const [isCheckingAi, setIsCheckingAi] = useState(false);

  useEffect(() => {
    const checkAi = async () => {
      setIsCheckingAi(true);
      try {
        const capabilities = await testAiAvailability();
        setAiCapabilities(capabilities as AiCapabilities);
      } catch (error) {
        console.error('Failed to check AI capabilities:', error);
      } finally {
        setIsCheckingAi(false);
      }
    };

    checkAi();
  }, [setAiCapabilities]);

  const aiStatus = aiCapabilities
    ? Object.values(aiCapabilities).some((status) => status === 'available')
      ? 'available'
      : 'unavailable'
    : 'loading';

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Left Group: Branding */}
      <div className="flex items-center gap-3">
        {/* Chrome Logo */}
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#4285F4"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="12" cy="12" r="6" fill="#EA4335" />
          <circle cx="12" cy="12" r="3" fill="#FBBC04" />
          <circle cx="12" cy="12" r="1.5" fill="#34A853" />
        </svg>

        {/* Title Stack */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Chrome AI DevBench
          </h1>
          <p className="text-sm text-gray-500">
            Interactive playground for Chrome&apos;s built-in AI APIs
          </p>
        </div>
      </div>

      {/* Right Group: Status & Actions */}
      <div className="flex items-center gap-4">
        {/* API Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              aiStatus === 'available' && 'bg-green-500',
              aiStatus === 'unavailable' && 'bg-red-500',
              (aiStatus === 'loading' || isCheckingAi) &&
                'bg-yellow-500 animate-pulse',
            )}
          />
          <span className="text-sm text-gray-700">Chrome AI APIs Required</span>
        </div>

        {/* Documentation Button */}
        <button
          type="button"
          className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          Documentation
        </button>
      </div>
    </div>
  );
}
