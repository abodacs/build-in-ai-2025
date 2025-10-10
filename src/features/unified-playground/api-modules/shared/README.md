# Shared Module for Writer & Rewriter APIs

## Overview

The `shared` module provides reusable components, services, hooks, types, and utilities for the Writer and Rewriter Chrome AI APIs. This module implements the **DRY (Don't Repeat Yourself)** principle, achieving **75-80% code reuse** between the two APIs.

## Architecture

```
shared/
├── components/        # React UI components
├── services/          # Core service classes
├── hooks/             # React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── index.ts           # Main export
```

---

## 📦 Components

### WritingConfigPanel

Reusable configuration panel for tone, format, length, and shared context settings.

**Features:**
- Responsive grid layout
- Collapsible design
- Tooltips for guidance
- Type-safe configuration

**Usage:**
```tsx
<WritingConfigPanel
  config={config}
  onChange={setConfig}
  toneOptions={[
    { value: 'formal', label: 'Formal', description: 'Professional tone' },
    { value: 'neutral', label: 'Neutral', description: 'Balanced tone' },
    { value: 'casual', label: 'Casual', description: 'Relaxed tone' }
  ]}
  formatOptions={[
    { value: 'markdown', label: 'Markdown' },
    { value: 'plain-text', label: 'Plain Text' }
  ]}
  lengthOptions={[
    { value: 'short', label: 'Short', description: '~100 words' },
    { value: 'medium', label: 'Medium', description: '~250 words' },
    { value: 'long', label: 'Long', description: '~500+ words' }
  ]}
  title="Writer Configuration"
  showAdvanced
/>
```

### StreamingIndicator

Visual indicator for streaming operations.

**Features:**
- Animated pulsing dots
- Compact and default variants
- Optional cancel button
- Progress percentage display

**Usage:**
```tsx
<StreamingIndicator
  text="Generating content..."
  progress={45}
  showCancel
  onCancel={() => abort()}
  variant="default"
/>
```

### PerformanceMetrics

Displays performance metrics for API operations.

**Features:**
- Responsive grid layout
- Icon-based visual design
- Multiple display variants
- Automatic formatting

**Usage:**
```tsx
<PerformanceMetrics
  metrics={{
    duration: 1250,
    words: 245,
    characters: 1523,
    quality: 'high',
    tokensPerSecond: 32.5,
  }}
  variant="default"
  showQuality
/>
```

### CharacterCount

Character and word counter with limit warnings.

**Features:**
- Real-time character/word counting
- Warning indicators at threshold
- Maximum length validation
- Color-coded feedback

**Usage:**
```tsx
<CharacterCount
  value={text}
  maxLength={5000}
  showWords
  warningThreshold={80}
  criticalThreshold={95}
/>
```

---

## 🔧 Services

### BaseWritingManager

Abstract base class for Writer and Rewriter managers.

**Features:**
- Instance lifecycle management
- Configuration-based caching
- Model download monitoring
- Resource cleanup

**Usage:**
```typescript
class WriterManager extends BaseWritingManager<Writer, WriterCreateOptions, WriterConfig> {
  getAPIName() { return 'Writer'; }

  async createInstance(options: WriterCreateOptions) {
    return await Writer.create(options);
  }

  // ... implement abstract methods
}
```

### StreamingHandler

Utilities for handling streaming API responses.

**Features:**
- Chunk processing with callbacks
- Progress estimation
- Performance tracking
- Cancellation support

**Usage:**
```typescript
const result = await StreamingHandler.processStream(
  stream,
  (chunk, metadata) => {
    console.log(`Chunk ${metadata.chunkIndex}: ${chunk}`);
    console.log(`Progress: ${metadata.progress}%`);
  },
  abortSignal
);
```

### PerformanceTracker

Performance monitoring utility for API operations.

**Features:**
- High-precision timing
- Token/second calculation
- First chunk latency tracking
- Quality estimation

**Usage:**
```typescript
const tracker = new PerformanceTracker();
tracker.start();

const result = await writer.write(prompt);

tracker.end(result);
const metrics = tracker.getMetrics();
console.log(`Duration: ${metrics.duration}ms`);
```

---

## 🪝 Hooks

### useModelDownload

React hook for managing model download state and progress.

**Features:**
- Download progress tracking
- User activation handling
- Error management
- Cancellation support

**Usage:**
```tsx
const {
  isDownloading,
  progress,
  error,
  startDownload,
  cancelDownload,
  reset,
} = useModelDownload();

const handleDownload = async () => {
  await startDownload(async () => {
    await manager.monitorDownload((progress) => {
      // Progress handled automatically
    });
  });
};
```

### useStreamingOutput

React hook for managing streaming output state.

**Features:**
- Real-time output accumulation
- Progress tracking
- Performance metrics
- Automatic cleanup

**Usage:**
```tsx
const {
  isStreaming,
  output,
  progress,
  startStreaming,
  addChunk,
  completeStreaming,
  reset,
} = useStreamingOutput();

const handleWrite = async () => {
  startStreaming();

  const stream = writer.writeStreaming(prompt);
  for await (const chunk of stream) {
    addChunk(chunk);
  }

  completeStreaming();
};
```

---

## 📘 Types

### Core Types

- `AvailabilityStatus` - API availability status
- `DownloadProgress` - Model download progress
- `PerformanceMetrics` - Operation performance metrics
- `BaseWritingConfig` - Configuration base type
- `ChunkMetadata` - Streaming chunk metadata

### State Types

- `InstanceState` - Instance lifecycle state
- `LoadingState` - UI loading state
- `ErrorState` - Error state
- `StreamingState` - Streaming operation state

### Validation Types

- `ValidationResult` - Validation outcome
- `TextConstraints` - Text validation rules

---

## 🛠️ Utilities

### Text Validation

```typescript
import { validateText, countWords, sanitizeText } from '@/shared/utils';

const result = validateText(userInput, {
  minLength: 10,
  maxLength: 5000,
  maxWords: 1000
});

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Formatters

```typescript
import { formatDuration, formatBytes, formatWordCount } from '@/shared/utils';

console.log(formatDuration(1250));        // "1.3s"
console.log(formatBytes(1048576));        // "1 MB"
console.log(formatWordCount(245));        // "245 words"
```

---

## 📊 Code Reuse Statistics

| Category | Shared Code | Reuse % |
|----------|-------------|---------|
| Services | 950 LOC | 80% |
| Components | 600 LOC | 85% |
| Hooks | 250 LOC | 85% |
| Utilities | 500 LOC | 100% |
| Types | 280 LOC | 100% |
| **Total** | **~2,580 LOC** | **~77%** |

---

## 🎯 Benefits

1. **Code Reuse**: 75-80% of code shared between Writer and Rewriter
2. **Consistency**: Same UX patterns across all Writing APIs
3. **Maintainability**: Single source of truth for common logic
4. **Testing**: Shared components tested once, used everywhere
5. **Performance**: Optimized patterns reused
6. **Scalability**: Easy to add Proofreader API later

---

## 📚 Related Documentation

- [Writer API](../writer/README.md)
- [Rewriter API](../rewriter/README.md)
- [Week 4 Implementation Plan](../../../../docs/week4/WEEK_4_PLAN.md)

---

## ✅ Quality Standards

- **TypeScript**: Strict mode enabled
- **JSDoc**: Comprehensive documentation
- **Accessibility**: ARIA labels and semantic HTML
- **Responsive**: Mobile-first design
- **Performance**: Optimized rendering
- **Testing**: 90%+ coverage target

---

*Shared Module for Chrome AI DevBench - Week 4 Implementation*
