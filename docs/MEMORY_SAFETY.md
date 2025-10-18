# Memory Safety Guidelines

This document outlines the memory-safe configuration settings implemented in the Chrome AI DevBench project and provides guidelines for developers to maintain memory efficiency.

## Table of Contents

- [Overview](#overview)
- [Configuration Files](#configuration-files)
  - [Vitest Configuration](#vitest-configuration)
  - [Vite Configuration](#vite-configuration)
  - [Playwright Configuration](#playwright-configuration)
- [Testing Memory Safety](#testing-memory-safety)
- [Best Practices](#best-practices)
- [Common Memory Leaks](#common-memory-leaks)
- [Monitoring and Debugging](#monitoring-and-debugging)

## Overview

Memory safety is critical for ensuring the stability and performance of both the development environment and the production application. This project implements comprehensive memory-safe configurations across all build and test tools.

### Goals

1. **Prevent Memory Leaks**: Ensure proper cleanup of resources, event listeners, and API sessions
2. **Limit Resource Usage**: Configure reasonable limits on workers, threads, and parallel operations
3. **Enable Monitoring**: Track memory usage during development and testing
4. **Enforce Best Practices**: Provide automated tests to catch memory issues early

## Configuration Files

### Vitest Configuration

Location: `vitest.config.ts`

#### Worker Limits

```typescript
maxWorkers: 1,
minWorkers: 1,
```

**Why**: Single worker configuration prevents excessive memory consumption and ensures tests run sequentially for maximum stability.

#### Fork Pool Configuration

```typescript
pool: 'forks',
poolOptions: {
  forks: {
    maxForks: 1,
    minForks: 1,
  }
}
```

**Why**: Using forks instead of threads provides better memory isolation. Single fork ensures tests don't compete for memory resources.

#### Memory Monitoring

```typescript
logHeapUsage: true,
```

**Why**: Enables heap usage logging to monitor memory consumption during test runs.

#### Test Isolation

```typescript
isolate: true,
```

**Why**: Ensures each test file runs in isolation, preventing memory leaks and state pollution between tests.

#### Deterministic Test Order

```typescript
sequence: {
  shuffle: false,
}
```

**Why**: Deterministic test order makes it easier to debug memory issues and identify problematic tests.

### Vite Configuration

Location: `vite.config.ts`

#### Asset Inline Limit

```typescript
assetsInlineLimit: 4096, // 4KB
```

**Why**: Prevents large files from being inlined as base64, which would increase bundle size and memory usage.

#### Max Parallel File Operations

```typescript
rollupOptions: {
  maxParallelFileOps: 20,
}
```

**Why**: Limits concurrent file operations during build to prevent I/O bottlenecks and memory spikes.

### Playwright Configuration

Location: `playwright.config.ts`

#### Worker Limits

```typescript
workers: process.env.CI ? 1 : 2,
```

**Why**: Limits parallel browser instances to conserve memory. Single worker in CI for stability.

#### Browser Launch Options

```typescript
launchOptions: {
  args: ['--disable-dev-shm-usage', '--disable-gpu'];
}
```

**Why**:

- `--disable-dev-shm-usage`: Prevents shared memory issues in containers/CI
- `--disable-gpu`: Reduces GPU memory usage in headless mode

## Testing Memory Safety

### Running Configuration Tests

Test that all configurations have memory-safe settings:

```bash
pnpm test tests/config/__tests__/memory-safe-config.test.ts
```

### Running Memory Leak Detection Tests

Test for potential memory leaks:

```bash
pnpm test tests/config/__tests__/memory-leak-detection.test.tsx
```

### Running All Tests with Coverage

```bash
pnpm test:coverage
```

## Best Practices

### React Components

#### DO: Cleanup Event Listeners

```typescript
useEffect(() => {
  const handler = () => console.log('resize');
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);
```

#### DO: Cleanup Timers

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### Chrome AI API

#### DO: Cleanup Sessions

```typescript
useEffect(() => {
  let session: AISession | null = null;

  const initSession = async () => {
    session = await ai.createSession();
  };

  initSession();

  return () => {
    session?.destroy();
  };
}, []);
```

## Common Memory Leaks

1. **Forgotten Event Listeners**: Event listeners not removed on component unmount
2. **Timers and Intervals**: Timers continue running after component unmount
3. **Unclosed AI Sessions**: Chrome AI sessions not destroyed
4. **Large Cached Data**: Unlimited cache growth
5. **Global Variables**: Variables attached to window/global scope

## Monitoring and Debugging

### Chrome DevTools Memory Profiler

1. Open Chrome DevTools
2. Go to Memory tab
3. Take heap snapshot
4. Perform actions
5. Take another snapshot
6. Compare snapshots to find leaks

---

**Last Updated**: 2025-10-18
**Maintained By**: Chrome AI DevBench Team
