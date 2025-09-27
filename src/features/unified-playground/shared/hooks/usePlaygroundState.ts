/**
 * Playground State Management Hook
 * Centralized state management for the unified playground with Zustand integration
 */

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { isAiAvailable } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface AICapability {
  name: string
  status: 'available' | 'unavailable' | 'loading' | 'error'
  lastChecked: number
  error?: string
}

export interface PlaygroundState {
  activeApi: string
  isLoading: boolean
  capabilities: Record<string, AICapability>
  theme: 'light' | 'dark' | 'system'
  errors: string[]
}

// ============================================================================
// AI Capability Detection
// ============================================================================

const AI_APIS = [
  'summarizer',
  'translator',
  'writer',
  'rewriter',
  'proofreader',
  'prompt',
  'languageDetection'
] as const

async function checkAICapability(apiName: string): Promise<AICapability> {
  const startTime = Date.now()

  try {
    // Check if Chrome AI APIs are available
    if (!isAiAvailable()) {
      return {
        name: apiName,
        status: 'unavailable',
        lastChecked: startTime,
        error: 'Chrome AI APIs not available. Requires Chrome 139+ with flags enabled.'
      }
    }

    // API-specific capability checks
    switch (apiName) {
      case 'summarizer':
        const summarizerAvailable = typeof (globalThis as any).ai?.summarizer !== 'undefined'
        if (summarizerAvailable) {
          // Try to create a session to verify it works
          const summarizer = await (globalThis as any).ai.summarizer.create()
          await summarizer.destroy()
        }
        return {
          name: apiName,
          status: summarizerAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: summarizerAvailable ? undefined : 'Summarizer API not available'
        }

      case 'translator':
        const translatorAvailable = typeof (globalThis as any).ai?.translator !== 'undefined'
        return {
          name: apiName,
          status: translatorAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: translatorAvailable ? undefined : 'Translator API not available'
        }

      case 'writer':
        const writerAvailable = typeof (globalThis as any).ai?.writer !== 'undefined'
        return {
          name: apiName,
          status: writerAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: writerAvailable ? undefined : 'Writer API not available'
        }

      case 'rewriter':
        const rewriterAvailable = typeof (globalThis as any).ai?.rewriter !== 'undefined'
        return {
          name: apiName,
          status: rewriterAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: rewriterAvailable ? undefined : 'Rewriter API not available'
        }

      case 'proofreader':
        const proofreaderAvailable = typeof (globalThis as any).ai?.proofreader !== 'undefined'
        return {
          name: apiName,
          status: proofreaderAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: proofreaderAvailable ? undefined : 'Proofreader API not available'
        }

      case 'prompt':
        const promptAvailable = typeof (globalThis as any).ai?.languageModel !== 'undefined'
        return {
          name: apiName,
          status: promptAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: promptAvailable ? undefined : 'Prompt API (Language Model) not available'
        }

      case 'languageDetection':
        const languageDetectionAvailable = typeof (globalThis as any).ai?.languageDetector !== 'undefined'
        return {
          name: apiName,
          status: languageDetectionAvailable ? 'available' : 'unavailable',
          lastChecked: Date.now(),
          error: languageDetectionAvailable ? undefined : 'Language Detection API not available'
        }

      default:
        return {
          name: apiName,
          status: 'unavailable',
          lastChecked: Date.now(),
          error: 'Unknown API'
        }
    }
  } catch (error) {
    return {
      name: apiName,
      status: 'error',
      lastChecked: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// ============================================================================
// Main Hook
// ============================================================================

export function usePlaygroundState() {
  // Zustand store integration
  const activeApi = useAppStore(state => state.activeApi)
  const setActiveApi = useAppStore(state => state.setActiveApi)
  const isLoading = useAppStore(state => state.isLoading)
  const setIsLoading = useAppStore(state => state.setIsLoading)

  // Local state for capabilities and errors
  const [capabilities, setCapabilities] = useState<Record<string, AICapability>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // Capability Detection
  // ============================================================================

  const checkAllCapabilities = useCallback(async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const capabilityChecks = AI_APIS.map(apiName => checkAICapability(apiName))
      const results = await Promise.allSettled(capabilityChecks)

      const newCapabilities: Record<string, AICapability> = {}
      const newErrors: string[] = []

      results.forEach((result, index) => {
        const apiName = AI_APIS[index]

        if (result.status === 'fulfilled') {
          newCapabilities[apiName] = result.value
          if (result.value.error) {
            newErrors.push(`${apiName}: ${result.value.error}`)
          }
        } else {
          newCapabilities[apiName] = {
            name: apiName,
            status: 'error',
            lastChecked: Date.now(),
            error: result.reason?.message || 'Failed to check capability'
          }
          newErrors.push(`${apiName}: Failed to check capability`)
        }
      })

      setCapabilities(newCapabilities)
      setErrors(newErrors)
      setIsInitialized(true)
    } catch (error) {
      setErrors(['Failed to initialize AI capabilities'])
    } finally {
      setIsLoading(false)
    }
  }, [setIsLoading])

  // ============================================================================
  // API Management
  // ============================================================================

  const switchToApi = useCallback((apiName: string) => {
    const capability = capabilities[apiName]

    if (!capability) {
      setErrors(prev => [...prev, `API ${apiName} not found`])
      return false
    }

    if (capability.status !== 'available') {
      setErrors(prev => [...prev, `API ${apiName} is not available: ${capability.error || 'Unknown error'}`])
      return false
    }

    setActiveApi(apiName)
    setErrors(prev => prev.filter(e => !e.includes(apiName)))
    return true
  }, [capabilities, setActiveApi])

  const retryCapabilityCheck = useCallback(async (apiName: string) => {
    setCapabilities(prev => ({
      ...prev,
      [apiName]: { ...prev[apiName], status: 'loading' }
    }))

    try {
      const result = await checkAICapability(apiName)
      setCapabilities(prev => ({
        ...prev,
        [apiName]: result
      }))

      if (result.error) {
        setErrors(prev => prev.filter(e => !e.includes(apiName)).concat(`${apiName}: ${result.error}`))
      } else {
        setErrors(prev => prev.filter(e => !e.includes(apiName)))
      }
    } catch (error) {
      setCapabilities(prev => ({
        ...prev,
        [apiName]: {
          ...prev[apiName],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }, [])

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getAvailableApis = useCallback(() => {
    return Object.values(capabilities).filter(cap => cap.status === 'available')
  }, [capabilities])

  const getApiStatus = useCallback((apiName: string) => {
    return capabilities[apiName]?.status || 'unavailable'
  }, [capabilities])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const addError = useCallback((error: string) => {
    setErrors(prev => [...prev, error])
  }, [])

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize capabilities on mount
  useEffect(() => {
    if (!isInitialized) {
      checkAllCapabilities()
    }
  }, [isInitialized, checkAllCapabilities])

  // Periodically refresh capabilities (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllCapabilities()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [checkAllCapabilities])

  // ============================================================================
  // Return State and Actions
  // ============================================================================

  return {
    // State
    activeApi,
    isLoading,
    capabilities,
    errors,
    isInitialized,

    // API Management
    switchToApi,
    retryCapabilityCheck,
    checkAllCapabilities,

    // Utilities
    getAvailableApis,
    getApiStatus,
    clearErrors,
    addError,

    // Computed values
    hasAvailableApis: getAvailableApis().length > 0,
    availableApiCount: getAvailableApis().length,
    totalApiCount: AI_APIS.length,
    hasErrors: errors.length > 0
  }
}

// ============================================================================
// Utility Hook for Theme Management
// ============================================================================

export function usePlaygroundTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('playground-theme') as 'light' | 'dark' | 'system' || 'system'
    setTheme(savedTheme)

    const updateResolvedTheme = () => {
      if (savedTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
      } else {
        setResolvedTheme(savedTheme)
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateResolvedTheme)

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
  }, [])

  const updateTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('playground-theme', newTheme)

    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
    } else {
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
    }
  }, [])

  return {
    theme,
    resolvedTheme,
    updateTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light'
  }
}