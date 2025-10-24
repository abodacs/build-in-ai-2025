# Chrome AI Language Detection Module

A production-ready implementation of the Chrome AI Language Detection API with comprehensive React hooks, TypeScript support, and enterprise-grade error handling.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Browser Compatibility](#browser-compatibility)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### Core Features

- ✅ **Complete Chrome AI Integration** - Full support for Language Detection API
- ✅ **Multi-Language Detection** - Detect multiple language candidates with confidence scores
- ✅ **React Hooks** - Modern hooks-based API for easy integration
- ✅ **TypeScript Support** - Fully typed interfaces and helpers
- ✅ **Confidence Filtering** - Configure threshold and candidate limits
- ✅ **Model Download Management** - Progress tracking and error handling
- ✅ **System Requirements Check** - Browser and storage validation

### Advanced Features

- 🎯 **Confidence-Based Filtering** - Filter results by confidence threshold
- 🔢 **Candidate Limiting** - Control maximum number of results
- 📊 **Performance Metrics** - Track detection duration
- 💻 **Code Generation** - Export TypeScript/JavaScript implementations
- 🌐 **BCP 47 Support** - Standard language code format
- 🎨 **Helper Functions** - Language names, confidence levels, colors

### UI Components

- 📝 **Smart Input** - Text validation with character limits
- 🎯 **Results Display** - Confidence badges with color coding
- ⚙️ **Configuration Panel** - Threshold, max candidates, show all toggle
- 📈 **Model Manager** - Download progress and availability status
- 💾 **Code Export** - Generate implementation code

## 📦 Installation

```bash
# The module is already integrated into the unified-playground
# Import components and hooks as needed

import {
  useLanguageDetection,
  useLanguageDetectionAvailability,
  ChromeAILanguageDetectionService,
} from '@/features/unified-playground/api-modules/language-detection';
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { DEFAULT_DETECTION_CONFIG } from './types';

function MyComponent() {
  const { actions, results, isDetecting, error } = useLanguageDetection(
    DEFAULT_DETECTION_CONFIG,
  );

  const handleDetect = async () => {
    const text = 'Hello, how are you today?';
    await actions.detect(text);
  };

  return (
    <div>
      <button onClick={handleDetect} disabled={isDetecting}>
        {isDetecting ? 'Detecting...' : 'Detect Language'}
      </button>

      {error && <p>Error: {error.message}</p>}

      {results.map((result, idx) => (
        <div key={idx}>
          {result.detectedLanguage}: {(result.confidence * 100).toFixed(1)}%
        </div>
      ))}
    </div>
  );
}
```

### With Availability Check

```tsx
import { useLanguageDetectionAvailability } from './hooks/useLanguageDetectionAvailability';

function MyApp() {
  const { isReady, availability, isDownloading, error } =
    useLanguageDetectionAvailability();

  if (!isReady) {
    return <div>Language Detection not available</div>;
  }

  return <LanguageDetectionUI />;
}
```

### Get Top Language Only

```tsx
import { useLanguageDetection } from './hooks/useLanguageDetection';

function QuickDetection() {
  const { primaryResult, actions, isDetecting } = useLanguageDetection({
    confidenceThreshold: 0.7,
    maxCandidates: 1,
    showAllCandidates: false,
  });

  const detectLanguage = async (text: string) => {
    await actions.detect(text);
  };

  return (
    <div>
      {primaryResult && (
        <span>
          Detected: {primaryResult.detectedLanguage}(
          {(primaryResult.confidence * 100).toFixed(0)}%)
        </span>
      )}
    </div>
  );
}
```

### Using the Service Directly

```typescript
import { ChromeAILanguageDetectionService } from './services';

async function detectLanguageDirectly() {
  // Check availability
  const availability =
    await ChromeAILanguageDetectionService.checkAvailability();

  if (availability !== 'available') {
    console.log('Language Detection not ready');
    return;
  }

  // Create detector instance
  const detector = await ChromeAILanguageDetectionService.createInstance();

  try {
    // Detect language
    const results = await ChromeAILanguageDetectionService.detect(
      detector,
      'Bonjour, comment allez-vous?',
    );

    console.log('Results:', results);
    // [{ detectedLanguage: 'fr', confidence: 0.98 }, ...]
  } finally {
    // Always cleanup
    ChromeAILanguageDetectionService.destroy(detector);
  }
}
```

## 🏗️ Architecture

### Module Structure

```
language-detection/
├── services/
│   ├── ChromeAIService.ts      # Core Chrome AI integration
│   └── index.ts                # Service exports
├── hooks/
│   ├── useLanguageDetection.ts # Main detection hook
│   ├── useLanguageDetectionAvailability.ts
│   └── index.ts                # Hook exports
├── types/
│   ├── detection.types.ts      # Type definitions
│   └── index.ts                # Type exports
├── components/
│   ├── CodeModal.tsx           # Code generation UI
│   ├── tabs/
│   │   └── PlaygroundTab.tsx   # Main playground UI
│   └── index.ts                # Component exports
├── utils/                      # Utility functions
├── __tests__/                  # Test files
└── index.ts                    # Main exports
```

### Component Hierarchy

```
LanguageDetectionMain (PlaygroundTab)
├── TextInput (with validation)
├── APIActionButton (Detect)
├── ResultsDisplay (with confidence badges)
├── UnifiedModelManager
└── CodeModal (generated code)
```

## 📖 API Reference

### Hooks

#### `useLanguageDetection`

Main hook for language detection functionality.

```typescript
function useLanguageDetection(
  initialConfig: DetectionConfig,
): UseLanguageDetectionReturn;

interface UseLanguageDetectionReturn {
  isDetecting: boolean;
  results: DetectionResult[];
  primaryResult: DetectionResult | null;
  error: Error | null;
  config: DetectionConfig;
  isLoading: boolean;
  metrics?: { duration: number };
  actions: {
    detect: (input: string) => Promise<DetectionResult[] | null>;
    reset: () => void;
    updateConfig: (config: Partial<DetectionConfig>) => void;
    cancel: () => void;
  };
}
```

**Parameters:**

- `initialConfig`: Detection configuration (threshold, maxCandidates, etc.)

**Returns:**

- `isDetecting`: Whether detection is in progress
- `results`: Array of detection results sorted by confidence
- `primaryResult`: Top detection result (highest confidence)
- `error`: Error if detection failed
- `config`: Current configuration
- `metrics`: Performance metrics (duration)
- `actions`: Methods to interact with the detection

**Example:**

```tsx
const { actions, results, isDetecting, primaryResult } = useLanguageDetection({
  confidenceThreshold: 0.6,
  maxCandidates: 3,
  showAllCandidates: false,
});

// Detect language
await actions.detect('Hello world');

// Update config
actions.updateConfig({ confidenceThreshold: 0.8 });

// Reset results
actions.reset();

// Cancel ongoing detection
actions.cancel();
```

#### `useLanguageDetectionAvailability`

Hook for checking API availability and model status.

```typescript
function useLanguageDetectionAvailability(): {
  availability: AvailabilityStatus | null;
  isReady: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  actions: {
    checkAvailability: () => Promise<void>;
    downloadModel: () => Promise<void>;
  };
};
```

**Returns:**

- `availability`: Current API status ('available', 'after-download', 'no')
- `isReady`: Whether API is ready to use
- `isDownloading`: Model download in progress
- `downloadProgress`: Download progress percentage
- `error`: Error message if any
- `actions`: Methods to check and download

**Example:**

```tsx
const { isReady, availability, actions } = useLanguageDetectionAvailability();

if (availability === 'after-download') {
  await actions.downloadModel();
}
```

### Services

#### `ChromeAILanguageDetectionService`

Static service class for Chrome AI Language Detection API.

**Methods:**

##### `isSupported(): boolean`

Check if Language Detection API is supported in the browser.

```typescript
if (ChromeAILanguageDetectionService.isSupported()) {
  console.log('Language Detection is supported!');
}
```

##### `checkAvailability(): Promise<AvailabilityStatus>`

Check current API availability status.

```typescript
const status = await ChromeAILanguageDetectionService.checkAvailability();
// 'available' | 'after-download' | 'no'
```

##### `createInstance(options?): Promise<LanguageDetector>`

Create a new language detector instance.

```typescript
const detector = await ChromeAILanguageDetectionService.createInstance({
  signal: abortController.signal, // Optional abort signal
  monitor: (m) => {
    // Optional download progress monitor
    m.addEventListener('downloadprogress', (e) => {
      console.log('Progress:', e.loaded, '/', e.total);
    });
  },
});
```

##### `detect(instance, input): Promise<DetectionResult[]>`

Detect language from text.

```typescript
const results = await ChromeAILanguageDetectionService.detect(
  detector,
  'Bonjour le monde',
);
// [{ detectedLanguage: 'fr', confidence: 0.99 }]
```

##### `destroy(instance): void`

Clean up detector instance.

```typescript
ChromeAILanguageDetectionService.destroy(detector);
```

##### `downloadModel(onProgress): Promise<void>`

Download language detection model with progress tracking.

```typescript
await ChromeAILanguageDetectionService.downloadModel((progress) => {
  console.log(`${progress.percentage.toFixed(1)}% complete`);
  console.log(`${progress.timeRemaining}s remaining`);
});
```

##### `checkSystemRequirements(): Promise<SystemRequirements>`

Check if system meets requirements.

```typescript
const reqs = await ChromeAILanguageDetectionService.checkSystemRequirements();
console.log('Browser supported:', reqs.browser.supported);
console.log('Chrome version:', reqs.browser.version);
console.log('Storage available:', reqs.storage?.available);
console.log('Online:', reqs.online);
```

### Types

#### `DetectionResult`

```typescript
interface DetectionResult {
  detectedLanguage: string; // BCP 47 language code
  confidence: number; // 0.0 - 1.0
}
```

#### `DetectionConfig`

```typescript
interface DetectionConfig {
  confidenceThreshold: number; // Minimum confidence (0.0-1.0)
  maxCandidates: number; // Max results to return
  showAllCandidates: boolean; // Show all or filter by threshold
}
```

#### `LanguageDetectorCreateOptions`

```typescript
interface LanguageDetectorCreateOptions {
  signal?: AbortSignal; // Cancellation signal
  monitor?: (monitor: EventTarget) => void; // Download progress
}
```

### Helper Functions

#### `getLanguageName(code: string): string`

Get human-readable language name from code.

```typescript
import { getLanguageName } from './types';

const name = getLanguageName('fr'); // "French"
const name2 = getLanguageName('ja'); // "Japanese"
```

#### `getConfidenceLevel(confidence: number): string`

Get confidence level label.

```typescript
import { getConfidenceLevel } from './types';

const level = getConfidenceLevel(0.95); // "very-high"
const level2 = getConfidenceLevel(0.6); // "medium"
```

#### `getConfidenceColor(confidence: number): string`

Get color for confidence visualization.

```typescript
import { getConfidenceColor } from './types';

const color = getConfidenceColor(0.9); // "green"
const color2 = getConfidenceColor(0.5); // "yellow"
```

## ⚙️ Configuration

### Default Configuration

```typescript
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  confidenceThreshold: 0.5,
  maxCandidates: 5,
  showAllCandidates: false,
};
```

### Custom Configuration

```typescript
const customConfig: DetectionConfig = {
  confidenceThreshold: 0.7, // Only show results above 70%
  maxCandidates: 3, // Limit to top 3 results
  showAllCandidates: false, // Filter by threshold
};

const { actions, results } = useLanguageDetection(customConfig);
```

### Runtime Configuration Updates

```typescript
const { actions, config } = useLanguageDetection(DEFAULT_DETECTION_CONFIG);

// Update threshold
actions.updateConfig({ confidenceThreshold: 0.8 });

// Update max candidates
actions.updateConfig({ maxCandidates: 10 });

// Show all candidates regardless of threshold
actions.updateConfig({ showAllCandidates: true });
```

## 💡 Examples

### Example 1: Form Input Language Detection

Detect language as user types in a form.

```tsx
import { useState, useEffect } from 'react';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { getLanguageName } from './types';

function MultilingualForm() {
  const [text, setText] = useState('');
  const { primaryResult, actions } = useLanguageDetection({
    confidenceThreshold: 0.6,
    maxCandidates: 1,
    showAllCandidates: false,
  });

  // Detect language when text changes (debounced)
  useEffect(() => {
    if (text.length < 10) return;

    const timer = setTimeout(() => {
      actions.detect(text);
    }, 500);

    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
      />

      {primaryResult && (
        <div>
          Detected language: {getLanguageName(primaryResult.detectedLanguage)} (
          {(primaryResult.confidence * 100).toFixed(0)}% confidence)
        </div>
      )}
    </div>
  );
}
```

### Example 2: Multi-Language Content Analyzer

Show all possible languages with confidence levels.

```tsx
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { getLanguageName, getConfidenceColor } from './types';

function LanguageAnalyzer() {
  const { results, actions, isDetecting } = useLanguageDetection({
    confidenceThreshold: 0.3,
    maxCandidates: 5,
    showAllCandidates: true,
  });

  const analyzeText = async (text: string) => {
    await actions.detect(text);
  };

  return (
    <div>
      <button onClick={() => analyzeText('Mixed language text here')}>
        Analyze
      </button>

      {results.map((result, idx) => (
        <div
          key={idx}
          style={{
            padding: '10px',
            margin: '5px 0',
            borderLeft: `4px solid ${getConfidenceColor(result.confidence)}`,
          }}
        >
          <strong>{getLanguageName(result.detectedLanguage)}</strong>
          <span> - {(result.confidence * 100).toFixed(1)}% confidence</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Language-Aware Routing

Route content based on detected language.

```tsx
import { useLanguageDetection } from './hooks/useLanguageDetection';

function ContentRouter() {
  const { primaryResult, actions } = useLanguageDetection({
    confidenceThreshold: 0.8,
    maxCandidates: 1,
    showAllCandidates: false,
  });

  const handleSubmit = async (content: string) => {
    const results = await actions.detect(content);

    if (!results || results.length === 0) {
      console.log('Could not detect language');
      return;
    }

    const language = results[0].detectedLanguage;
    const confidence = results[0].confidence;

    if (confidence < 0.8) {
      console.log('Low confidence, manual review needed');
      return;
    }

    // Route to appropriate handler
    switch (language) {
      case 'en':
        await processEnglishContent(content);
        break;
      case 'es':
        await processSpanishContent(content);
        break;
      case 'fr':
        await processFrenchContent(content);
        break;
      default:
        await processDefaultContent(content, language);
    }
  };

  return <SubmitForm onSubmit={handleSubmit} />;
}
```

### Example 4: Batch Language Detection

Process multiple texts in sequence.

```typescript
import { ChromeAILanguageDetectionService } from './services';

async function batchDetection(texts: string[]) {
  const detector = await ChromeAILanguageDetectionService.createInstance();
  const results = [];

  try {
    for (const text of texts) {
      const detected = await ChromeAILanguageDetectionService.detect(
        detector,
        text,
      );
      results.push({
        text: text.substring(0, 50) + '...',
        language: detected[0]?.detectedLanguage || 'unknown',
        confidence: detected[0]?.confidence || 0,
      });
    }
  } finally {
    ChromeAILanguageDetectionService.destroy(detector);
  }

  return results;
}

// Usage
const texts = [
  'Hello, how are you?',
  'Bonjour, comment allez-vous?',
  'Hola, ¿cómo estás?',
  'こんにちは、お元気ですか？',
];

const results = await batchDetection(texts);
console.log(results);
```

### Example 5: Model Download with Progress

Handle model download with user feedback.

```tsx
import { useState } from 'react';
import { ChromeAILanguageDetectionService } from './services';

function ModelDownloader() {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      await ChromeAILanguageDetectionService.downloadModel((p) => {
        setProgress(p.percentage);
      });
      console.log('Model ready!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={isDownloading}>
        Download Model
      </button>

      {isDownloading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress.toFixed(1)}%</span>
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
```

### Example 6: Plain JavaScript (No Framework)

Using the API without React.

```javascript
// Check browser support
if (ChromeAILanguageDetectionService.isSupported()) {
  console.log('Language Detection is supported!');
}

// Detect language from text input
async function detectFromInput() {
  const input = document.getElementById('text-input');
  const output = document.getElementById('results');

  try {
    // Check availability
    const availability =
      await ChromeAILanguageDetectionService.checkAvailability();

    if (availability !== 'available') {
      output.textContent = 'Language Detection not available';
      return;
    }

    // Create detector
    const detector = await ChromeAILanguageDetectionService.createInstance();

    try {
      // Detect
      const results = await ChromeAILanguageDetectionService.detect(
        detector,
        input.value,
      );

      // Display results
      output.innerHTML = results
        .map(
          (r) => `
          <div>
            ${r.detectedLanguage}: ${(r.confidence * 100).toFixed(1)}%
          </div>
        `,
        )
        .join('');
    } finally {
      // Cleanup
      ChromeAILanguageDetectionService.destroy(detector);
    }
  } catch (error) {
    output.textContent = `Error: ${error.message}`;
  }
}

// Attach to button
document
  .getElementById('detect-btn')
  .addEventListener('click', detectFromInput);
```

## 🌐 Browser Compatibility

### Requirements

| Feature      | Requirement                                      |
| ------------ | ------------------------------------------------ |
| **Browser**  | Chrome 138+ or Edge 138+                         |
| **Flag**     | `chrome://flags#language-detection-api` (Enable) |
| **Storage**  | 22MB free space                                  |
| **VRAM**     | 4GB+ recommended                                 |
| **Internet** | Required for initial model download              |

### Checking Compatibility

```typescript
const reqs = await ChromeAILanguageDetectionService.checkSystemRequirements();

if (!reqs.browser.supported) {
  console.log(`Requires Chrome ${reqs.browser.requiredVersion}+`);
  console.log(`Current version: ${reqs.browser.version}`);
}

if (reqs.storage && !reqs.storage.sufficient) {
  console.log(`Need ${reqs.storage.required} bytes`);
  console.log(`Available: ${reqs.storage.available} bytes`);
}

if (!reqs.online) {
  console.log('Internet connection required for model download');
}
```

### Feature Detection

```typescript
// Basic support check
const isSupported = ChromeAILanguageDetectionService.isSupported();

// Detailed availability
const availability = await ChromeAILanguageDetectionService.checkAvailability();

switch (availability) {
  case 'available':
    // Ready to use
    break;
  case 'after-download':
    // Need to download model
    break;
  case 'no':
    // Not available
    break;
}
```

## ⚡ Performance

### Performance Characteristics

- **Detection Speed**: 50-200ms per detection
- **Model Size**: ~22MB (one-time download)
- **Memory Usage**: ~100MB RAM during detection
- **Batch Processing**: Reuse detector instance for multiple detections

### Optimization Tips

#### 1. Reuse Detector Instances

**Bad:**

```typescript
// Creates new instance each time
async function detect(text: string) {
  const detector = await ChromeAILanguageDetectionService.createInstance();
  const results = await ChromeAILanguageDetectionService.detect(detector, text);
  ChromeAILanguageDetectionService.destroy(detector);
  return results;
}
```

**Good:**

```typescript
// Reuse instance for multiple detections
let detector: LanguageDetector | null = null;

async function detect(text: string) {
  if (!detector) {
    detector = await ChromeAILanguageDetectionService.createInstance();
  }
  return await ChromeAILanguageDetectionService.detect(detector, text);
}

// Cleanup when done
function cleanup() {
  if (detector) {
    ChromeAILanguageDetectionService.destroy(detector);
    detector = null;
  }
}
```

#### 2. Use the React Hook

The `useLanguageDetection` hook automatically manages instance lifecycle:

```typescript
// Hook handles instance reuse and cleanup
const { actions } = useLanguageDetection(config);

// Efficient: reuses same instance
await actions.detect(text1);
await actions.detect(text2);
await actions.detect(text3);
```

#### 3. Debounce User Input

```typescript
import { useState, useEffect } from 'react';
import { useLanguageDetection } from './hooks/useLanguageDetection';

function DebouncedDetection() {
  const [text, setText] = useState('');
  const { actions } = useLanguageDetection(config);

  useEffect(() => {
    if (text.length < 10) return;

    // Debounce detection by 500ms
    const timer = setTimeout(() => {
      actions.detect(text);
    }, 500);

    return () => clearTimeout(timer);
  }, [text]);

  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}
```

#### 4. Limit Candidates

```typescript
// More candidates = slightly slower
const config = {
  confidenceThreshold: 0.7,
  maxCandidates: 1, // Only get top result
  showAllCandidates: false,
};
```

#### 5. Filter Early

```typescript
// Filter by confidence to reduce processing
const config = {
  confidenceThreshold: 0.8, // High threshold
  maxCandidates: 3,
  showAllCandidates: false, // Enable filtering
};
```

### Performance Metrics

Track detection performance using the hook:

```typescript
const { metrics, actions } = useLanguageDetection(config);

await actions.detect(text);

console.log(`Detection took ${metrics?.duration.toFixed(2)}ms`);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "LanguageDetector API not supported"

**Cause:** Browser doesn't support Language Detection API.

**Solution:**

```typescript
// Check browser compatibility
const reqs = await ChromeAILanguageDetectionService.checkSystemRequirements();

if (!reqs.browser.supported) {
  console.log(`Update to Chrome ${reqs.browser.requiredVersion}+`);
  console.log(`Current version: ${reqs.browser.version}`);
}
```

#### 2. "Language Detection not available on this device"

**Cause:** API is disabled or device doesn't meet requirements.

**Solution:**

1. Enable flag: `chrome://flags#language-detection-api`
2. Restart browser
3. Check system requirements (VRAM, storage)

#### 3. "Model download requires user interaction"

**Cause:** Model download must be triggered by user action (e.g., button click).

**Solution:**

```tsx
// Call from button click handler
<button
  onClick={async () => {
    await ChromeAILanguageDetectionService.downloadModel((p) => {
      console.log(`${p.percentage}% complete`);
    });
  }}
>
  Download Model
</button>
```

#### 4. Empty Results

**Cause:** Text is too short or confidence threshold is too high.

**Solution:**

```typescript
// Lower threshold or check text length
const config = {
  confidenceThreshold: 0.3, // Lower threshold
  maxCandidates: 5,
  showAllCandidates: true, // Show all results
};

// Ensure text is meaningful (10+ characters)
if (text.length < 10) {
  console.log('Text too short for reliable detection');
}
```

#### 5. "Input must be a non-empty string"

**Cause:** Empty or invalid input.

**Solution:**

```typescript
// Validate input before detection
if (!text || text.trim().length === 0) {
  console.log('Please enter text to detect');
  return;
}

await actions.detect(text.trim());
```

#### 6. Memory Leaks

**Cause:** Not destroying detector instances.

**Solution:**

```typescript
// Always cleanup
const detector = await ChromeAILanguageDetectionService.createInstance();

try {
  const results = await ChromeAILanguageDetectionService.detect(detector, text);
  // ... use results
} finally {
  // IMPORTANT: Always destroy
  ChromeAILanguageDetectionService.destroy(detector);
}

// Or use the React hook (handles cleanup automatically)
const { actions } = useLanguageDetection(config);
```

### Debug Mode

Enable detailed logging:

```typescript
// The service logs errors to console
// Check browser console for detailed error messages

try {
  const results = await actions.detect(text);
} catch (error) {
  console.error('Detection failed:', error);

  // Check availability
  const availability =
    await ChromeAILanguageDetectionService.checkAvailability();
  console.log('API availability:', availability);

  // Check requirements
  const reqs = await ChromeAILanguageDetectionService.checkSystemRequirements();
  console.log('System requirements:', reqs);
}
```

### Getting Help

If issues persist:

1. **Check Browser Console** - Look for error messages
2. **Verify Requirements** - Run `checkSystemRequirements()`
3. **Check API Status** - Run `checkAvailability()`
4. **Enable Flag** - Ensure `chrome://flags#language-detection-api` is enabled
5. **Restart Browser** - Close and reopen Chrome/Edge
6. **Report Issues** - Include browser version, error messages, and code snippets

## 🤝 Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test file
npm test language-detection

# Build
npm run build
```

### Running Tests

```bash
# Unit tests
npm test -- ChromeAIService.test.ts

# Hook tests
npm test -- useLanguageDetection.test.tsx

# Integration tests
npm test -- integration.test.tsx
```

### Code Style

Follow the existing code style:

- TypeScript strict mode
- ESLint rules
- Comprehensive JSDoc comments
- Meaningful variable names
- Error handling for all async operations

### Adding Features

1. **Add Types** - Define types in `types/detection.types.ts`
2. **Implement Service** - Add to `services/ChromeAIService.ts`
3. **Create Hook** - Add React hook in `hooks/`
4. **Add Tests** - Write comprehensive tests in `__tests__/`
5. **Update Docs** - Update this README

## 📄 License

Part of the Chrome AI DevBench project.

## 🔗 Related Modules

- [Translator](../translator/) - Text translation API
- [Summarizer](../summarizer/) - Text summarization API
- [Rewriter](../rewriter/) - Text rewriting API
- [Writer](../writer/) - AI writing assistant
- [Prompt](../prompt/) - Prompt API integration

## 📚 Resources

- [Chrome AI Language Detection API Docs](https://developer.chrome.com/docs/ai/language-detection)
- [Chrome AI Overview](https://developer.chrome.com/docs/ai)
- [BCP 47 Language Codes](https://en.wikipedia.org/wiki/IETF_language_tag)
- [Origin Trial Information](https://developer.chrome.com/origintrials/)

---

**Built with Chrome AI** 🚀
