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
    // Memory-safe: Limit asset inline to prevent memory bloat
    assetsInlineLimit: 4096, // 4KB - smaller files are inlined
    rollupOptions: {
      // Memory-safe: Limit concurrent file operations during build
      maxParallelFileOps: 20,
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
      },
      // Let Vite handle automatic code splitting
      // Manual chunking was causing TDZ errors with minification
      output: {
        // Memory-safe: Limit chunk size to prevent large bundles
        manualChunks: undefined, // Let Vite handle chunking automatically
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
      // Memory-safe: Target modern browsers for smaller bundles
      target: 'es2022',
    },
    // Memory-safe: Exclude large dependencies from pre-bundling
    exclude: ['@testing-library/react', '@testing-library/jest-dom'],
  },
});
