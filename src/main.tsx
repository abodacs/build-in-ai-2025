import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import './styles/globals.css';

// Check for Chrome AI API availability
const checkAISupport = () => {
  if (typeof window !== 'undefined' && !('ai' in window)) {
    console.warn(
      '🚨 Chrome AI APIs not detected. Please use Chrome 118+ with AI features enabled.',
    );
  }
};

checkAISupport();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
