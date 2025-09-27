import { NavLink } from 'react-router-dom'
import {
  Bot,
  Shield,
  Zap,
  Code,
  FileText,
  Languages,
  Edit3,
  CheckCircle,
  RotateCcw
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const apiSections = [
  {
    title: 'Text APIs',
    apis: [
      { id: 'summarizer', name: 'Summarizer', icon: FileText, description: 'Condense content' },
      { id: 'translator', name: 'Translator', icon: Languages, description: 'Real-time translation' },
      { id: 'writer', name: 'Writer', icon: Edit3, description: 'Content generation' },
      { id: 'rewriter', name: 'Rewriter', icon: RotateCcw, description: 'Content restructuring' },
      { id: 'proofreader', name: 'Proofreader', icon: CheckCircle, description: 'Grammar improvement' },
    ]
  },
  {
    title: 'Advanced APIs',
    apis: [
      { id: 'prompt', name: 'Prompt API', icon: Bot, description: 'Flexible AI prompting' },
      { id: 'language-detection', name: 'Language Detection', icon: Languages, description: 'Auto language ID' },
    ]
  }
]

const navigationItems = [
  { id: 'security', name: 'Security Demo', icon: Shield, path: '/security', description: 'Security best practices' },
  { id: 'hybrid', name: 'Hybrid AI', icon: Zap, path: '/hybrid', description: 'Cloud fallback patterns' },
  { id: 'code', name: 'Code Examples', icon: Code, path: '/code', description: 'Production-ready code' },
]

export function Sidebar() {
  const { activeApi, setActiveApi, aiCapabilities } = useAppStore()

  const getApiStatus = (apiId: string) => {
    if (!aiCapabilities) return 'loading'

    const statusMap: Record<string, keyof typeof aiCapabilities> = {
      'summarizer': 'summarizer',
      'translator': 'translator',
      'writer': 'writer',
      'rewriter': 'rewriter',
      'proofreader': 'proofreader',
      'prompt': 'prompt',
      'language-detection': 'languageDetection',
    }

    return aiCapabilities[statusMap[apiId]] || 'unavailable'
  }

  return (
    <div className="flex flex-col h-full">
      {/* API Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {apiSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.apis.map((api) => {
                const status = getApiStatus(api.id)
                const Icon = api.icon

                return (
                  <button
                    key={api.id}
                    onClick={() => setActiveApi(api.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      activeApi === api.id && 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{api.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {api.description}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        status === 'available' && 'bg-green-500',
                        status === 'unavailable' && 'bg-red-500',
                        status === 'loading' && 'bg-yellow-500 animate-pulse'
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Navigation Items */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Features
          </h3>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      isActive && 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Built for Chrome Canary 136+</div>
          <div>Powered by Chrome AI APIs</div>
        </div>
      </div>
    </div>
  )
}