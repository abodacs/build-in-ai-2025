import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';
import removeConsole from 'vite-plugin-remove-console';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Remove console statements in production (except error and warn)
    removeConsole({
      external: ['error', 'warn'], // Keep console.error and console.warn for production monitoring
    }),
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
      '@/tests': path.resolve(__dirname, './tests'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    // Target latest browsers only (last 2 versions of Chrome/Edge as per browserslist)
    // This allows using modern JavaScript features for smaller bundles
    target: 'esnext',
    // Memory-safe: Limit asset inline to prevent memory bloat
    assetsInlineLimit: 4096, // 4KB - smaller files are inlined
    rollupOptions: {
      // Memory-safe: Limit concurrent file operations during build
      maxParallelFileOps: 20,
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
      },
      // PERFORMANCE OPTIMIZED: Manual chunking to reduce initial bundle size
      output: {
        // Split vendors and syntax highlighting for optimal loading
        manualChunks: (id) => {
          // React core and ALL React-related dependencies (highest priority)
          // IMPORTANT: Keep all React dependencies together to avoid module initialization issues
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/react-resizable-panels') ||
            id.includes('node_modules/react-day-picker') ||
            id.includes('node_modules/embla-carousel-react')
          ) {
            return 'vendor-react';
          }

          // UI component library - includes ALL @radix-ui packages (both main and internal)
          // This prevents Radix internal dependencies from being split into vendor-other
          if (
            id.includes('node_modules/@radix-ui/') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/cmdk') ||
            id.includes('node_modules/vaul') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes') ||
            id.includes('node_modules/input-otp')
          ) {
            return 'vendor-ui';
          }

          // Syntax highlighting (lazy-loaded)
          if (
            id.includes('react-syntax-highlighter') ||
            id.includes('react-markdown')
          ) {
            return 'vendor-syntax';
          }

          // Utility libraries
          if (
            id.includes('node_modules/dompurify') ||
            id.includes('node_modules/zod') ||
            id.includes('node_modules/zustand')
          ) {
            return 'vendor-utils';
          }

          // Charts library (heavy, lazy-load) - Keep with React
          if (id.includes('node_modules/recharts')) {
            return 'vendor-react';
          }

          // All other node_modules - but exclude common React utility packages
          // These need to stay with React to avoid initialization issues
          if (id.includes('node_modules/')) {
            // Check if this is a common React utility/helper package
            if (
              id.includes('react-remove-scroll') ||
              id.includes('aria-hidden') ||
              id.includes('use-') ||
              id.includes('@floating-ui/react')
            ) {
              return 'vendor-react';
            }
            return 'vendor-other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        // Memory-safe: Limit asset size for better memory management
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    // Memory-safe: Configure HMR to prevent memory leaks in dev mode
    hmr: {
      overlay: true, // Show errors as overlay
    },
    // Memory-safe: Watch options to prevent excessive file watching
    watch: {
      usePolling: false, // Use native file system events (more efficient)
      ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    },
  },
  preview: {
    port: 4173,
    open: true,
  },
  // Memory-safe: Optimize dependency pre-bundling
  optimizeDeps: {
    esbuildOptions: {
      // Memory-safe: Limit log output to prevent memory bloat
      logLimit: 10,
      // Target latest browsers only (last 2 versions) for optimal bundle size
      target: 'esnext',
    },
    // Memory-safe: Exclude large dependencies from pre-bundling
    exclude: ['@testing-library/react', '@testing-library/jest-dom'],
  },
});
