import {
  Zap,
  Languages,
  PenTool,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const availableApis = [
  {
    id: 'summarizer',
    name: 'Summarizer API',
    icon: Zap,
    description: 'Content summarization and condensation',
    status: 'available' as const,
  },
  {
    id: 'translator',
    name: 'Translator API',
    icon: Languages,
    description: 'Real-time language translation',
    status: 'available' as const,
  },
  {
    id: 'writer',
    name: 'Writer API',
    icon: PenTool,
    description: 'Content generation and creative writing',
    status: 'soon' as const,
  },
  {
    id: 'rewriter',
    name: 'Rewriter API',
    icon: RotateCcw,
    description: 'Content restructuring and style adaptation',
    status: 'soon' as const,
  },
  {
    id: 'proofreader',
    name: 'Proofreader API',
    icon: CheckCircle,
    description: 'Grammar and writing improvement',
    status: 'soon' as const,
  },
  {
    id: 'prompt',
    name: 'Prompt API (Multimodal)',
    icon: Sparkles,
    description: 'Flexible AI prompting with multimodal support',
    status: 'soon' as const,
  },
  {
    id: 'language-detection',
    name: 'Language Detection',
    icon: Globe,
    description: 'Automatic language identification',
    status: 'soon' as const,
  },
];

export function Sidebar() {
  const { activeApi, setActiveApi } = useAppStore();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Available APIs
        </h2>
        <p className="text-sm text-gray-500">
          Select an API to explore its capabilities
        </p>
      </div>

      {/* API List */}
      <div className="space-y-1">
        {availableApis.map((api) => {
          const Icon = api.icon;
          const isActive = activeApi === api.id;

          return (
            <button
              key={api.id}
              type="button"
              onClick={() => setActiveApi(api.id)}
              disabled={api.status === 'soon'}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : api.status === 'available'
                    ? 'hover:bg-gray-50 text-gray-900 hover:shadow-sm'
                    : 'opacity-50 cursor-not-allowed text-gray-500',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn(
                      'font-medium text-sm',
                      isActive ? 'text-white' : 'text-gray-900',
                    )}
                  >
                    {api.name}
                  </span>
                  {api.status === 'available' && (
                    <Badge
                      variant={isActive ? 'secondary' : 'default'}
                      className={cn(
                        'text-xs px-1.5 py-0',
                        isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-700',
                      )}
                    >
                      Ready
                    </Badge>
                  )}
                </div>
                <div
                  className={cn(
                    'text-xs truncate',
                    isActive ? 'text-gray-300' : 'text-gray-500',
                  )}
                >
                  {api.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
