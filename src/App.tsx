import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'

import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/common/loading-spinner/LoadingSpinner'
import { ErrorBoundary } from '@/components/common/error-boundary/ErrorBoundary'

// Lazy load feature components for better performance
import { HomePage } from '@/features/api-playground/components/HomePage'
import { PlaygroundContainer } from '@/features/unified-playground'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/playground" element={<HomePage />} />
              <Route path="/unified" element={<PlaygroundContainer />} />
              <Route
                path="/security"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Security Demo</h1>
                    <p className="text-muted-foreground mt-2">Coming soon...</p>
                  </div>
                }
              />
              <Route
                path="/hybrid"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Hybrid AI</h1>
                    <p className="text-muted-foreground mt-2">Coming soon...</p>
                  </div>
                }
              />
              <Route
                path="*"
                element={
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                    <p className="text-muted-foreground mt-2">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </div>
    </ErrorBoundary>
  )
}

export default App