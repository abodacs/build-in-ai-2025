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
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.trace'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
      },
      output: {
        manualChunks: (id) => {
          // Core React libraries - keep together for better caching
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor';
          }

          // Router - separate as it's loaded on every route
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          // Radix UI - large but necessary for UI components
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }

          // Syntax highlighting - heavy library, separate chunk for lazy loading
          if (
            id.includes('react-syntax-highlighter') ||
            id.includes('highlight.js')
          ) {
            return 'syntax-highlighter';
          }

          // Charts library - only loaded when needed
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }

          // Other node_modules - catch-all for remaining dependencies
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }

          // Summarizer feature - lazy load this module
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
