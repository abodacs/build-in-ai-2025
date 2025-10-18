import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    // Brotli compression (best compression ratio)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/features': path.resolve(__dirname, './src/features'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    target: 'ES2022',
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
      },
      output: {
        manualChunks: (id) => {
          // CHUNK STRATEGY:
          // Order matters! Libraries that depend on React must be in react-vendor
          // or loaded AFTER react-vendor to avoid undefined errors.

          // 1. REACT CORE (highest priority - must load first)
          // All React-dependent libraries that don't work without React loaded
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            // React-dependent UI libraries that need React available immediately
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/@radix-ui/react-slot/') ||
            id.includes('node_modules/class-variance-authority/')
          ) {
            return 'react-vendor';
          }

          // 2. ROUTER (loaded on all routes, depends on react-vendor)
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          // 3. UI COMPONENTS (Radix UI - depends on react-vendor)
          // Safe to separate since react-vendor loads first
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }

          // 4. HEAVY LIBRARIES (lazy-loaded features)
          // Syntax highlighting - separate for code splitting
          if (
            id.includes('react-syntax-highlighter') ||
            id.includes('highlight.js') ||
            id.includes('sugar-high')
          ) {
            return 'syntax-highlighter';
          }

          // Charts - only load when dashboard/analytics is accessed
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }

          // 5. FORM LIBRARIES (commonly used together)
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/') ||
            id.includes('zod')
          ) {
            return 'forms';
          }

          // 6. STATE MANAGEMENT & UTILITIES
          if (
            id.includes('zustand') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')
          ) {
            return 'state-utils';
          }

          // 7. CATCH-ALL for other node_modules
          // Any remaining dependencies go here
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }

          // 8. FEATURE MODULES (application code)
          // Lazy-load heavy feature modules
          if (
            id.includes('features/unified-playground/api-modules/summarizer')
          ) {
            return 'summarizer';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
});
