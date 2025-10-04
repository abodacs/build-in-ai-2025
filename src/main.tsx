import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import { ThemeProvider } from './providers/ThemeProvider.tsx';
import { CodeThemeProvider } from './providers/CodeThemeProvider.tsx';
import './styles/globals.css';

// Check for Chrome AI API availability
// Note: Chrome AI APIs are now available directly on self.* (not self.ai.*)
// API change: self.Summarizer, self.LanguageModel, etc.
const checkAISupport = () => {
  if (typeof window !== 'undefined') {
    const hasAPI = 'Summarizer' in window || 'LanguageModel' in window;

    if (!hasAPI) {
      console.warn(
        '🚨 Chrome AI APIs not detected. Please use Chrome 138+ with AI features enabled.',
      );
    } else {
      console.log(
        '✅ Chrome AI APIs detected (Summarizer, LanguageModel, etc.)',
      );
    }
  }
};

checkAISupport();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <CodeThemeProvider defaultCodeTheme="auto" storageKey="code-theme">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CodeThemeProvider>
    </ThemeProvider>
  </StrictMode>,
);
