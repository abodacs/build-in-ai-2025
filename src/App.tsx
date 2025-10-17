import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';

import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/common/loading-spinner/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/error-boundary/ErrorBoundary';

import {
  UnifiedPlayground,
  PlaygroundContainer,
} from '@/features/unified-playground';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Root - Unified Playground (default) */}
            <Route
              path="/"
              element={
                <PlaygroundContainer>
                  <UnifiedPlayground />
                </PlaygroundContainer>
              }
            />

            {/* Redirect /playground to root */}
            <Route path="/playground" element={<Navigate to="/" replace />} />

            {/* Redirect /unified to root */}
            <Route path="/unified" element={<Navigate to="/" replace />} />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <Layout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                    <p className="text-muted-foreground mt-2">
                      The page you&apos;re looking for doesn&apos;t exist.
                    </p>
                  </div>
                </Layout>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
