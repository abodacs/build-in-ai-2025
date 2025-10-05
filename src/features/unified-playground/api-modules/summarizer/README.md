# Chrome AI Summarizer Module

A comprehensive, production-ready implementation of the Chrome AI Summarizer API with progressive disclosure, advanced features, and enterprise-grade error handling.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Components](#components)
- [Hooks](#hooks)
- [Services](#services)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Examples](#examples)
- [TypeScript Support](#typescript-support)
- [Browser Compatibility](#browser-compatibility)
- [Performance](#performance)
- [Contributing](#contributing)

## ✨ Features

### Core Features

- ✅ **Complete Chrome AI Integration** - Full support for Summarizer API
- ✅ **Progressive Disclosure** - Simple playground → Advanced features
- ✅ **Streaming Support** - Real-time summarization with streaming
- ✅ **Smart Input Detection** - Automatic URL and code detection
- ✅ **Performance Metrics** - Detailed processing insights
- ✅ **Model Download Management** - Progress tracking and error handling

### Advanced Features

- 🧩 **Chunking Strategies** - Handle long content (>10K chars)
  - Recursive chunking
  - Sliding-window with overlap
  - Semantic boundary-aware splitting
- 🌐 **URL Extraction** - Summarize web content directly
  - Specialized parsers for major sites
  - Support for articles, docs, Q&A, Wikipedia
- 💻 **Code Generation** - Export TypeScript/JavaScript implementations
- 📊 **Performance Tracking** - Operation history and insights

### UI Components

- 🎨 **SparkButton** - Animated gradient button with shimmer effect
- ⚙️ **Configuration Panel** - Type, format, length, shared context
- 📝 **Smart Input** - Validation, word count, content detection
- 📈 **Results Display** - Metrics, compression ratio, export options
- 🎯 **Quick Samples** - 5 pre-configured examples

## 📦 Installation

```bash
# The module is already integrated into the unified-playground
# Import components and hooks as needed

import {
  PlaygroundTab,
  useSummarizer,
  useSummarizerAvailability
} from '@/features/unified-playground/api-modules/summarizer';
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useSummarizer } from './hooks/useSummarizer';

function MyComponent() {
  const { summarize, result, isLoading } = useSummarizer({
    config: { type: 'tldr', length: 'medium' },
  });

  const handleSummarize = async () => {
    await summarize('Your long text here...');
  };

  return (
    <div>
      <button onClick={handleSummarize} disabled={isLoading}>
        Summarize
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

### With Availability Check

```tsx
import { useSummarizerAvailability } from './hooks/useSummarizerAvailability';

function MyApp() {
  const { isReady, isDownloading, downloadProgress, startDownload } =
    useSummarizerAvailability();

  if (!isReady) {
    return (
      <div>
        <button onClick={startDownload}>Download AI Model</button>
        {isDownloading && <progress value={downloadProgress?.percentage} />}
      </div>
    );
  }

  return <Summarizer />;
}
```

### Complete Playground

```tsx
import { PlaygroundTab } from './components/tabs/PlaygroundTab';

function App() {
  return <PlaygroundTab />;
}
```

## 🏗️ Architecture

```
summarizer/
├── components/          # React components
│   ├── tabs/           # Tab components (Playground, Advanced, Code)
│   ├── SparkButton.tsx
│   ├── SummarizerConfig.tsx
│   ├── SummarizerInput.tsx
│   ├── SummarizerResults.tsx
│   ├── QuickSamplesCard.tsx
│   ├── ChunkingStrategySelector.tsx
│   └── URLExtractionCard.tsx
├── hooks/              # React hooks
│   ├── useSummarizer.ts
│   └── useSummarizerAvailability.ts
├── services/           # Business logic
│   ├── ChromeAIService.ts
│   ├── ChromeAICompatibility.ts
│   ├── ErrorHandler.ts
│   ├── SummarizerManager.ts
│   ├── ChunkingEngine.ts
│   └── URLExtractor.ts
├── types/              # TypeScript types
│   ├── summarizer.types.ts
│   ├── chunking.types.ts
│   └── api.types.ts
├── utils/              # Utility functions
│   ├── textPreprocessing.ts
│   ├── performanceTracker.ts
│   └── urlParser.ts
└── index.ts            # Barrel exports
```

## 🧩 Components

### PlaygroundTab

Main playground interface with configuration, input, and results.

```tsx
<PlaygroundTab />
```

### SparkButton

Animated gradient button for actions.

```tsx
<SparkButton
  onClick={handleClick}
  isProcessing={isLoading}
  text="Run Summarizer"
/>
```

### SummarizerConfig

Configuration panel for summarizer options.

```tsx
<SummarizerConfig config={config} onChange={setConfig} showAdvanced />
```

### SummarizerInput

Smart input with validation and detection.

```tsx
<SummarizerInput
  value={text}
  onChange={setText}
  showValidation
  showWordCount
  showSmartDetection
/>
```

### SummarizerResults

Results display with metrics.

```tsx
<SummarizerResults
  result={summary}
  isStreaming={isStreaming}
  metrics={metrics}
  showMetrics
/>
```

## 🎣 Hooks

### useSummarizer

Main hook for summarization operations.

```tsx
const {
  summarize, // (text: string) => Promise<string>
  summarizeStreaming, // (text: string) => Promise<ReadableStream>
  result, // string | null
  isLoading, // boolean
  isStreaming, // boolean
  error, // SummarizerError | null
  metrics, // SummarizerMetrics | null
  updateConfig, // (config) => void
  reset, // () => void
  abort, // () => void
  hasInstance, // boolean
} = useSummarizer(options);
```

**Options:**

- `config`: Initial summarizer configuration
- `trackPerformance`: Enable performance tracking (default: true)
- `autoCleanup`: Auto-cleanup on unmount (default: true)

### useSummarizerAvailability

Check Chrome AI availability and manage model downloads.

```tsx
const {
  availability, // 'no' | 'after-download' | 'readily'
  requirements, // SystemRequirements | null
  capabilities, // BrowserCapabilities | null
  isChecking, // boolean
  isDownloading, // boolean
  downloadProgress, // DownloadProgress | null
  error, // string | null
  refresh, // () => Promise<void>
  startDownload, // () => Promise<void>
  isSupported, // boolean
  isReady, // boolean
} = useSummarizerAvailability();
```

## 🔧 Services

### ChromeAIService

Low-level Chrome AI API wrapper.

```typescript
// Check support
const isSupported = ChromeAIService.isSupported();

// Check availability
const { availability } = await ChromeAIService.checkAvailability();

// Download model
await ChromeAIService.downloadModel((progress) => {
  console.log(`${progress.percentage}% complete`);
});
```

### SummarizerManager

Instance lifecycle management with caching.

```typescript
const manager = new SummarizerManager();

// Get or create instance
const summarizer = await manager.getSummarizer(config);

// Summarize
const summary = await manager.summarize(text, {}, config);

// Get metrics
const metrics = manager.getMetrics();

// Cleanup
manager.cleanup();
```

### ChunkingEngine

Handle long content with multiple strategies.

```typescript
const engine = new ChunkingEngine();

// Chunk text
const { chunks } = engine.chunkText(text, {
  type: 'recursive',
  maxChunkSize: 10000,
});

// Recursive summarization
const { summary, metadata } = await engine.recursiveSummarize(
  text,
  config,
  strategy,
  (current, total) => console.log(`${current}/${total}`),
);
```

### URLExtractor

Extract and summarize web content.

```typescript
const extractor = new URLExtractor();

// Extract content
const content = await extractor.extractFromURL(url);

// Extract and summarize
const { summary } = await extractor.extractAndSummarize(url, config);
```

## 🚀 Advanced Features

### Chunking for Long Content

Automatically applied to content >10,000 characters.

```typescript
const strategy: ChunkingStrategy = {
  type: 'recursive', // or 'sliding-window', 'semantic'
  maxChunkSize: 10000,
  overlapSize: 500, // for sliding-window
  semanticSeparators: ['\n\n', '\n', '. '], // for semantic
};

const result = await engine.recursiveSummarize(longText, config, strategy);
```

### URL Extraction

```typescript
// Check if URL is extractable
const canExtract = extractor.canExtract(url);

// Get extraction preview
const preview = extractor.getExtractionPreview(url);

// Extract and summarize
const result = await extractor.extractAndSummarize(url, config);
```

### Streaming Summarization

```typescript
const stream = await summarizeStreaming(text);
const reader = stream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(value); // Partial summary
}
```

## ⚙️ Configuration

### Summarizer Options

```typescript
interface SummarizerCreateOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
  sharedContext?: string;
}
```

### System Requirements

- **Browser**: Chrome 138+ (Canary/Dev) or Edge Canary
- **Storage**: 22+ GB free disk space
- **VRAM**: 4+ GB (for on-device processing)
- **Network**: Required for initial model download (~1-2 GB)

### Setup Instructions

#### Enable Summarizer API

1. Open `chrome://flags` in Chrome
2. Search for **"Summarization API for Gemini Nano"**
3. Set to **Enabled**
4. Restart Chrome

#### Download the Model

On first use, Chrome will automatically prompt to download the AI model:

- Download size: ~1-2 GB
- Progress tracked in the UI
- Models cached for future use

#### Verify Setup

```typescript
// Check availability
const availability = await Summarizer.availability();
// Returns: 'readily' | 'after-download' | 'no'

if (availability === 'readily') {
  console.log('✅ Summarizer ready to use!');
}
```

#### Troubleshooting

**"API not available" error?**

- Check Chrome version: `chrome://version` (need 138+)
- Verify flag is enabled: `chrome://flags/#summarization-api-for-gemini-nano`
- Restart Chrome completely
- Check disk space (22+ GB required)

**Model download stuck?**

- Check internet connection
- Verify disk space
- Clear cache: `chrome://settings/clearBrowserData`
- Check model status: `chrome://components`

**Performance slow?**

- Ensure 4+ GB VRAM available
- Close GPU-intensive apps
- Check GPU status: `chrome://gpu`

## 📝 Examples

### Example 1: Basic Summarization

```typescript
import { useSummarizer } from './hooks/useSummarizer';

function BasicExample() {
  const { summarize, result, isLoading } = useSummarizer({
    config: { type: 'tldr', length: 'short' }
  });

  return (
    <div>
      <button onClick={() => summarize('Long text...')}>
        Summarize
      </button>
      {isLoading ? 'Loading...' : result}
    </div>
  );
}
```

### Example 2: With Progress Tracking

```typescript
import { ChunkingEngine } from './services/ChunkingEngine';

async function withProgress() {
  const engine = new ChunkingEngine();

  const result = await engine.recursiveSummarize(
    longText,
    { type: 'tldr' },
    { type: 'recursive', maxChunkSize: 10000 },
    (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    },
  );

  console.log(result.summary);
}
```

### Example 3: URL Extraction

```typescript
import { URLExtractor } from './services/URLExtractor';

async function extractURL() {
  const extractor = new URLExtractor();

  const result = await extractor.extractAndSummarize(
    'https://example.com/article',
    { type: 'key-points', length: 'medium' },
  );

  console.log(result.summary);
}
```

## 📘 TypeScript Support

Fully typed with comprehensive TypeScript definitions.

```typescript
import type {
  SummarizerCreateOptions,
  SummarizerMetrics,
  ChunkingStrategy,
  WebSummaryResult,
} from './types';
```

## 🌐 Browser Compatibility

### Supported APIs

- ✅ `self.Summarizer` (Official Chrome AI)
- ✅ `window.Summarizer` (Playground/Polyfill)
- ✅ Automatic detection and normalization

### Browser Support

- Chrome 138+ (Canary with flags)
- Edge (with Chrome AI support)

Enable in `chrome://flags`:

- Summarization API for Gemini Nano
- Prompt API for Gemini Nano

## ⚡ Performance

### Metrics Tracked

- Model initialization time
- Per-summarization processing time
- Cache hit rate
- Streaming latency per chunk
- Compression ratio

### Optimization Features

- Instance caching and reuse
- Automatic chunking for long content
- Progress callbacks for UX
- Abort controllers for cancellation
- Memory cleanup and resource management

## 📊 Bundle Size

**Estimated**: ~450KB (uncompressed)

- Components: ~180KB
- Services: ~150KB
- Types: ~50KB
- Utils: ~70KB

## 🤝 Contributing

This module follows the unified-playground architecture:

1. Components in `components/`
2. Business logic in `services/`
3. React hooks in `hooks/`
4. Types in `types/`
5. Utilities in `utils/`

## 📄 License

Part of Chrome AI DevBench - Built for the Chrome Built-in AI Challenge

## 🔗 Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Summarizer API Spec](https://github.com/explainers-by-googlers/summarization-api)
- [Week 2 Implementation Plan](../../../../../docs/week2.md)

---

**Built with** ❤️ **using Chrome AI Summarizer API**
