# Translator API Module

**Chrome AI DevBench - Translator API Playground**

On-device language translation using Chrome's Built-in AI Translator API.

## Overview

The Translator API module provides a comprehensive playground for testing and exploring Chrome's on-device translation capabilities. All translations happen locally in your browser - no data is sent to external servers.

## Features

### Core Features ✅

- **13+ Language Support** - Translate between 13 major languages
- **Real-time Translation** - Fast, on-device translation (< 2s)
- **Streaming Support** - Progressive translation for long texts
- **Language Detection** - Auto-detect source language
- **Batch Translation** - Translate multiple texts simultaneously
- **Context Support** - Improve accuracy with optional context
- **Performance Metrics** - Track latency, throughput, and quality
- **Download Management** - Monitor model downloads with progress
- **Code Generation** - Export TypeScript/JavaScript implementation

### Supported Languages

- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt)
- 🇷🇺 Russian (ru)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇨🇳 Chinese Simplified (zh)
- 🇹🇼 Chinese Traditional (zh-Hant)
- 🇸🇦 Arabic (ar)
- 🇮🇳 Hindi (hi)

## Usage

### Basic Translation

```typescript
import { useTranslator } from './hooks';

function TranslatorExample() {
  const { translate, isLoading, result } = useTranslator({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });

  const handleTranslate = async () => {
    const translation = await translate('Hello, world!');
    console.log(translation); // "Hola, mundo!"
  };

  return (
    <button onClick={handleTranslate} disabled={isLoading}>
      {isLoading ? 'Translating...' : 'Translate'}
    </button>
  );
}
```

### Streaming Translation

```typescript
const { translateStreaming } = useTranslator({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

const handleStreamingTranslate = async () => {
  await translateStreaming('Long text...', (chunk) => {
    console.log('Received chunk:', chunk);
    // Update UI progressively
  });
};
```

### Check Availability

```typescript
import { useTranslatorAvailability } from './hooks';

function AvailabilityCheck() {
  const { availability, isChecking } = useTranslatorAvailability('en', 'es');

  if (availability === 'readily') {
    return <span>✅ Ready to translate</span>;
  } else if (availability === 'after-download') {
    return <span>📥 Download required</span>;
  } else {
    return <span>❌ Not available</span>;
  }
}
```

## Components

### TranslatorConfig

Language pair configuration with availability checking.

```typescript
<TranslatorConfig
  sourceLanguage="en"
  targetLanguage="es"
  context=""
  onSourceLanguageChange={setSourceLanguage}
  onTargetLanguageChange={setTargetLanguage}
  onContextChange={setContext}
  onSwapLanguages={handleSwap}
  availability="readily"
/>
```

### TranslatorInput

Text input with character counting and validation.

```typescript
<TranslatorInput
  value={inputText}
  onChange={setInputText}
  placeholder="Enter text to translate..."
  maxLength={50000}
/>
```

### TranslatorResults

Side-by-side display of original and translated text.

```typescript
<TranslatorResults
  originalText="Hello"
  translatedText="Hola"
  isStreaming={false}
  sourceLanguage="en"
  targetLanguage="es"
  performance={metrics}
  onCopy={handleCopy}
  onDownload={handleDownload}
  onRetry={handleRetry}
/>
```

## Architecture

### Directory Structure

```
translator/
├── components/          # React components
│   ├── TranslatorConfig.tsx
│   ├── TranslatorInput.tsx
│   ├── TranslatorResults.tsx
│   └── tabs/
│       └── PlaygroundTab.tsx
├── hooks/              # React hooks
│   ├── useTranslator.ts
│   └── useTranslatorAvailability.ts
├── services/           # Business logic
│   ├── TranslatorManager.ts
│   ├── LanguagePairCache.ts
│   ├── StreamingHandler.ts
│   └── BatchProcessor.ts
├── types/              # TypeScript types
│   └── translator.types.ts
└── utils/              # Utility functions
```

### Services

#### TranslatorManager

Manages translator instance lifecycle.

```typescript
import { TranslatorManager } from './services';

const manager = new TranslatorManager();

// Create translator
const translator = await manager.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Check availability
const availability = await manager.checkAvailability('en', 'es');

// Cleanup
manager.destroy('en', 'es');
```

#### LanguagePairCache

LRU cache for translator instances.

```typescript
import { LanguagePairCache } from './services';

const cache = new LanguagePairCache(10, 30 * 60 * 1000); // 10 max, 30 min TTL

// Get cached translator
const translator = cache.get('en', 'es');

// Set translator in cache
cache.set('en', 'es', translator);

// Get statistics
const stats = cache.getStats();
console.log('Hit rate:', stats.hitRate);
```

#### StreamingHandler

Handles streaming translations.

```typescript
import { StreamingHandler } from './services';

const handler = new StreamingHandler();

await handler.translateStreaming(translator, 'Long text...', {
  onChunk: (chunk, metadata) => {
    console.log('Chunk:', chunk);
    console.log('Progress:', metadata.progress);
  },
});
```

## Chrome AI API

### API Format (Updated)

The Translator API uses direct global methods (not `self.ai.*`):

```typescript
// Check availability
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Create translator
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Progress: ${((e.loaded / e.total) * 100).toFixed(1)}%`);
    });
  },
});

// Translate
const result = await translator.translate('Hello, world!', {
  context: 'greeting',
});

// Streaming
const stream = translator.translateStreaming('Long text...', {
  context: 'optional',
});

for await (const chunk of stream) {
  console.log(chunk);
}

// Cleanup
translator.destroy();
```

### Availability Check

```typescript
// Check if API exists
if ('Translator' in window) {
  const status = await Translator.availability({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });

  // status = 'no' | 'after-download' | 'readily'
}
```

## Performance

### Targets

- **Short texts** (< 100 words): < 500ms
- **Medium texts** (100-500 words): < 1.5s
- **Long texts** (500+ words): Streaming mode
- **Cache hit**: < 100ms

### Optimization

The module uses several optimization techniques:

1. **Instance Caching** - Reuse translator instances (LRU cache)
2. **Lazy Loading** - Create translators only when needed
3. **Streaming** - Progressive translation for long texts
4. **Batch Processing** - Parallel translation for multiple items

## Browser Support

### Requirements

- **Chrome Dev 129+** or **Chrome Canary 130+**
- **Flags enabled**:
  - `chrome://flags/#optimization-guide-on-device-model`
  - `chrome://flags/#translation-api`

### Feature Detection

```typescript
const isSupported = 'Translator' in window;

if (!isSupported) {
  console.log('Translator API not available');
  console.log('Please use Chrome Dev/Canary with flags enabled');
}
```

## Troubleshooting

### API Not Available

**Problem**: `Translator is not defined`

**Solution**:

1. Use Chrome Dev 129+ or Chrome Canary 130+
2. Enable required flags at `chrome://flags`
3. Restart Chrome

### Language Pair Not Available

**Problem**: `availability === 'no'`

**Solution**:

- Not all language pairs are supported
- Try a different language combination
- Check the supported languages list

### Model Download Fails

**Problem**: Download stuck or fails

**Solution**:

1. Check internet connection
2. Clear browser cache
3. Try downloading again
4. Check available disk space (models are ~150-500 MB)

## Development

### Running Tests

```bash
# Unit tests
pnpm test translator

# Integration tests
pnpm test:integration translator

# E2E tests
pnpm test:e2e translator

# Coverage
pnpm test:coverage translator
```

### Building

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Contributing

1. Follow the ultrathink architecture pattern
2. Write comprehensive tests (90%+ coverage)
3. Use TypeScript with strict mode
4. Follow accessibility guidelines (WCAG 2.1 AA)
5. Document all public APIs with JSDoc

## License

MIT

## Related Documentation

- [Week 3 Plan](../../../../docs/week3/WEEK_3_PLAN.md)
- [Translator Architecture](../../../../docs/week3/TRANSLATOR_ARCHITECTURE.md)
- [Translator Features](../../../../docs/week3/TRANSLATOR_FEATURES.md)
- [Chrome AI Translator API Spec](../../../../docs/ai/translator-api.md)

---

**Status**: ✅ Complete
**Version**: 1.0.0
**Last Updated**: October 6, 2025
