import {
  Zap,
  Globe,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

const availableApis = [
  {
    id: 'summarizer',
    name: 'Summarizer API',
    icon: Zap,
    description: 'Content summarization and condensation',
  },
  {
    id: 'translator',
    name: 'Translator API',
    icon: Globe,
    description: 'Real-time language translation',
  },
  {
    id: 'writer',
    name: 'Writer API',
    icon: ChevronRight,
    description: 'Content generation and creative writing',
  },
  {
    id: 'rewriter',
    name: 'Rewriter API',
    icon: RotateCcw,
    description: 'Content restructuring and style adaptation',
  },
  {
    id: 'proofreader',
    name: 'Proofreader API',
    icon: CheckCircle,
    description: 'Grammar and writing improvement',
  },
  {
    id: 'prompt',
    name: 'Prompt API (Multimodal)',
    icon: Circle,
    description: 'Flexible AI prompting with multimodal support',
  },
  {
    id: 'language-detection',
    name: 'Language Detection',
    icon: Globe,
    description: 'Automatic language identification',
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
              onClick={() => setActiveApi(api.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-50 text-gray-900',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'font-medium text-sm',
                    isActive ? 'text-white' : 'text-gray-900',
                  )}
                >
                  {api.name}
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
