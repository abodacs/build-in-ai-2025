import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { testAiAvailability } from '@/services/aiService'

export function HomePage() {
  const { activeApi, aiCapabilities, setAiCapabilities } = useAppStore()

  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await testAiAvailability()
      setAiCapabilities(capabilities as any)
    }

    checkCapabilities()
  }, [setAiCapabilities])

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to Chrome AI DevBench
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive learning playground for Chrome's built-in AI APIs.
            Test, experiment, and learn with on-device AI models.
          </p>
        </div>

        {/* API Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiCapabilities && Object.entries(aiCapabilities).map(([api, status]) => (
            <div
              key={api}
              className="p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status === 'available' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <h3 className="font-medium capitalize">
                  {api.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {status === 'available' ? 'Ready to use' : 'Not available'}
              </p>
            </div>
          ))}
        </div>

        {/* Current API Playground */}
        <div className="border border-border rounded-lg bg-card p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {activeApi.charAt(0).toUpperCase() + activeApi.slice(1)} API Playground
          </h2>
          <p className="text-muted-foreground">
            Select an API from the sidebar to start experimenting with Chrome's built-in AI capabilities.
          </p>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Getting Started</h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Choose an AI API from the sidebar</li>
              <li>2. Try the interactive demo</li>
              <li>3. Copy the generated code for your project</li>
              <li>4. Learn about security best practices</li>
            </ol>
          </div>
        </div>

        {/* Browser Support Notice */}
        {!aiCapabilities && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Chrome AI APIs Required
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This application requires Chrome 136.0.7103.0+ (Canary) with AI features enabled.
              Please ensure you're using a compatible browser to access the full functionality.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}