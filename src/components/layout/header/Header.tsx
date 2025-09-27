import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { testAiAvailability } from '@/services/aiService'
import { cn } from '@/lib/utils'

export function Header() {
  const { codeLanguage, setCodeLanguage, aiCapabilities, setAiCapabilities } = useAppStore()
  const [isCheckingAi, setIsCheckingAi] = useState(false)

  useEffect(() => {
    const checkAi = async () => {
      setIsCheckingAi(true)
      try {
        const capabilities = await testAiAvailability()
        setAiCapabilities(capabilities as any)
      } catch (error) {
        console.error('Failed to check AI capabilities:', error)
      } finally {
        setIsCheckingAi(false)
      }
    }

    checkAi()
  }, [setAiCapabilities])

  const aiStatus = aiCapabilities
    ? Object.values(aiCapabilities).some(status => status === 'available')
      ? 'available'
      : 'unavailable'
    : 'loading'

  return (
    <div className="flex items-center justify-between h-16 px-6">
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-ai flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chrome AI DevBench
          </h1>
          <p className="text-xs text-gray-500">
            Interactive AI API Playground
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* AI Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              aiStatus === 'available' && 'bg-green-500',
              aiStatus === 'unavailable' && 'bg-red-500',
              (aiStatus === 'loading' || isCheckingAi) && 'bg-yellow-500 animate-pulse'
            )}
          />
          <span className="text-xs text-gray-500">
            AI APIs {aiStatus === 'loading' || isCheckingAi ? 'Checking...' : aiStatus}
          </span>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setCodeLanguage('js')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              codeLanguage === 'js'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-100'
            )}
          >
            JavaScript
          </button>
          <button
            onClick={() => setCodeLanguage('ts')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              codeLanguage === 'ts'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-100'
            )}
          >
            TypeScript
          </button>
        </div>

        {/* Version indicator */}
        <div className="text-xs text-gray-500 border border-border rounded px-2 py-1">
          v1.2.0
        </div>
      </div>
    </div>
  )
}