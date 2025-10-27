/**
 * Documentation Generator Utility
 *
 * Generates comprehensive README documentation for Chrome AI APIs
 * Includes setup, usage, configuration, examples, and troubleshooting
 *
 * @module utils/codeGeneration/docsGenerator
 */

import type { PromptConfig } from '@/features/unified-playground/api-modules/prompt/types';

// ============================================================================
// Types
// ============================================================================

interface DocsGeneratorOptions {
  apiName: string;
  config: any;
  includeExamples?: boolean;
  includeTroubleshooting?: boolean;
}

// ============================================================================
// Prompt API Documentation Generator
// ============================================================================

/**
 * Generate comprehensive README for Prompt API
 */
export function generatePromptAPIDocumentation(config: PromptConfig): string {
  const configTable = generateConfigTable(config);

  return `# Chrome AI Prompt API - Quick Start Guide

> Generate AI-powered responses using Chrome's built-in Gemini Nano model

## 🚀 Quick Start

\`\`\`typescript
// Check if API is available
const availability = await window.LanguageModel.availability();

if (availability === 'unavailable') {
  console.error('Prompt API not available on this device');
  return;
}

// Create a session
const session = await window.LanguageModel.create({
  systemPrompt: '${config.systemPrompt || 'You are a helpful assistant.'}',
  temperature: ${config.temperature ?? 1},
  topK: ${config.topK ?? 3},
  maxTokens: ${config.maxTokens || 2048},
});

// Send a prompt
const response = await session.prompt('What is quantum computing?');
console.log(response);

// Clean up
session.destroy();
\`\`\`

## 📋 Requirements

- **Browser**: Chrome 138+ (Dev/Canary channel)
- **GPU**: 4GB+ VRAM (integrated GPUs not supported)
- **RAM**: 16GB+ system memory
- **CPU**: 4+ cores recommended
- **Disk Space**: 22GB+ free space (for model download)
- **Internet**: Required for initial model download only

## ⚙️ Configuration Options

${configTable}

## 💡 Usage Examples

### Basic Request-Response

\`\`\`typescript
const session = await window.LanguageModel.create({
  temperature: ${config.temperature ?? 1},
  topK: ${config.topK ?? 3},
});

try {
  const response = await session.prompt('Explain async/await in JavaScript');
  console.log(response);
} finally {
  session.destroy();
}
\`\`\`

### Streaming Responses

For better UX with long responses:

\`\`\`typescript
const session = await window.LanguageModel.create();

const stream = session.promptStreaming('Write a short story');
const reader = stream.getReader();

let fullResponse = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  fullResponse = value;
  console.log('Streaming:', value); // Display progressive updates
}

console.log('Final:', fullResponse);
session.destroy();
\`\`\`

### Conversational Pattern

Maintain context across multiple prompts:

\`\`\`typescript
const session = await window.LanguageModel.create({
  systemPrompt: 'You are a helpful coding tutor.',
});

try {
  // First question
  const answer1 = await session.prompt('What is a closure in JavaScript?');
  console.log('AI:', answer1);

  // Follow-up (context maintained)
  const answer2 = await session.prompt('Can you show me an example?');
  console.log('AI:', answer2);

  // Another follow-up
  const answer3 = await session.prompt('What are common use cases?');
  console.log('AI:', answer3);
} finally {
  session.destroy();
}
\`\`\`

### Error Handling

\`\`\`typescript
async function safePrompt(text: string) {
  // Check availability first
  const availability = await window.LanguageModel.availability();

  if (availability === 'unavailable') {
    throw new Error(
      'Prompt API not available on this device. ' +
      'Requires: GPU with 4GB+ VRAM, 16GB+ RAM, 4+ CPU cores, 22GB+ free disk space'
    );
  }

  if (availability === 'downloadable') {
    console.log('Model download required (22GB, 10-30 minutes on first use)...');
    // Model will download automatically on create()
  }

  if (availability === 'downloading') {
    console.log('Model is currently downloading... Please wait.');
    // Can proceed - create() will wait for download to complete
  }

  let session;
  try {
    session = await window.LanguageModel.create();
    return await session.prompt(text);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not available')) {
        throw new Error('API initialization failed');
      } else if (error.message.includes('quota')) {
        throw new Error('Rate limit exceeded. Please wait.');
      }
    }
    throw error;
  } finally {
    session?.destroy();
  }
}
\`\`\`

### React Hook Example

\`\`\`typescript
import { useState, useEffect } from 'react';

function usePromptAPI() {
  const [session, setSession] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const availability = await window.LanguageModel.availability();

      if (availability !== 'unavailable' && mounted) {
        const s = await window.LanguageModel.create({
          temperature: ${config.temperature ?? 1},
        });
        setSession(s);
        setIsReady(true);
      }
    }

    init();

    return () => {
      mounted = false;
      session?.destroy();
    };
  }, []);

  const prompt = async (text: string) => {
    if (!session) throw new Error('Session not ready');
    return await session.prompt(text);
  };

  return { prompt, isReady };
}

// Usage in component
function AIChat() {
  const { prompt, isReady } = usePromptAPI();
  const [response, setResponse] = useState('');

  const handleSubmit = async (text: string) => {
    if (!isReady) return;
    const result = await prompt(text);
    setResponse(result);
  };

  return (
    <div>
      {isReady ? 'AI Ready!' : 'Loading...'}
      {/* Your UI here */}
    </div>
  );
}
\`\`\`

## 🎯 Best Practices

### 1. Always Clean Up Sessions

\`\`\`typescript
// ✅ Good - Always destroy
const session = await window.LanguageModel.create();
try {
  const response = await session.prompt('...');
  return response;
} finally {
  session.destroy();
}

// ❌ Bad - Memory leak
const session = await window.LanguageModel.create();
return await session.prompt('...');
// session never destroyed!
\`\`\`

### 2. Check Availability First

\`\`\`typescript
// ✅ Good
const availability = await window.LanguageModel.availability();
if (availability === 'unavailable') {
  // Show fallback UI
  return;
}

// ❌ Bad
const session = await window.LanguageModel.create();
// Might fail if API not available
\`\`\`

### 3. Handle Model Download

\`\`\`typescript
const availability = await window.LanguageModel.availability();

if (availability === 'downloadable') {
  // Show loading UI
  showToast('Downloading AI model... This may take 10-30 minutes and requires 22GB free space.');
}

if (availability === 'downloading') {
  // Model is already downloading
  showToast('Model download in progress... Please wait.');
}

// First create() call will trigger download or wait for completion
const session = await window.LanguageModel.create();
\`\`\`

### 4. Use Streaming for Long Responses

\`\`\`typescript
// ✅ Good for long content
const stream = session.promptStreaming('Write a detailed essay...');
// User sees progressive updates

// ⚠️ Okay for short content
const response = await session.prompt('What is 2+2?');
// User waits for complete response
\`\`\`

### 5. Optimize Temperature Settings

\`\`\`typescript
// Factual/Code: Low temperature
const codeSession = await window.LanguageModel.create({
  temperature: 0.2,  // More deterministic
  systemPrompt: 'You are a coding assistant.'
});

// Creative: High temperature
const creativeSession = await window.LanguageModel.create({
  temperature: 0.9,  // More creative
  systemPrompt: 'You are a creative writer.'
});
\`\`\`

## 🐛 Troubleshooting

### API Not Available

**Problem**: \`LanguageModel is not defined\`

**Solutions**:
1. Check Chrome version: Must be 138+
2. Enable flag: \`chrome://flags#prompt-api-for-gemini-nano-multimodal-input\`
3. Restart Chrome completely
4. Check in DevTools: \`'LanguageModel' in window\`

### Model Download Issues

**Problem**: \`availability === 'after-download'\` but model doesn't download

**Solutions**:
1. Ensure 22+ GB free disk space
2. Check internet connection
3. Wait 5-15 minutes for download
4. Restart Chrome and try again

### Session Creation Fails

**Problem**: \`Failed to create language model session\`

**Solutions**:
1. Check if another session is already active
2. Destroy previous sessions: \`session.destroy()\`
3. Check RAM: Model requires 4+ GB available
4. Try restarting Chrome

### Slow Responses

**Problem**: Responses take too long

**Solutions**:
1. Reduce \`maxTokens\` setting
2. Use shorter prompts
3. Check CPU/RAM usage
4. Close other Chrome tabs

### Rate Limiting

**Problem**: \`Quota exceeded\` errors

**Solutions**:
1. Wait a few minutes between requests
2. Avoid rapid consecutive calls
3. Implement exponential backoff
4. Cache common responses

## 📊 Performance Tips

1. **Reuse Sessions**: Create once, use multiple times for conversations
2. **Optimize Prompts**: Be specific and concise
3. **Use Streaming**: Better perceived performance for long responses
4. **Control Token Limits**: Lower \`maxTokens\` for faster responses
5. **Batch Operations**: Group related prompts when possible

## 🔒 Privacy & Security

- **100% Local**: All processing happens on-device
- **No Network Calls**: After model download, works offline
- **Private**: Your prompts never leave your machine
- **Secure**: No data sent to external servers

## 📚 API Reference

### \`window.LanguageModel.availability()\`

Returns: \`Promise<'available' | 'after-download' | 'no'>\`

Check if API is ready to use.

### \`window.LanguageModel.create(options?)\`

Returns: \`Promise<LanguageModelSession>\`

Creates a new AI session.

**Options**:
- \`systemPrompt?: string\` - Guide AI behavior
- \`temperature?: number\` - 0-1, controls randomness
- \`topK?: number\` - 1-50, controls diversity
- \`maxTokens?: number\` - Max response length

### \`session.prompt(text)\`

Returns: \`Promise<string>\`

Send a prompt and wait for complete response.

### \`session.promptStreaming(text)\`

Returns: \`ReadableStream<string>\`

Send a prompt and receive streaming response.

### \`session.destroy()\`

Returns: \`void\`

Clean up session and free resources.

## 🔗 Related Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Model Info](https://blog.google/technology/ai/google-gemini-ai/)
- [Example Applications](https://github.com/chrome-ai-demos)

## 📝 Your Configuration

\`\`\`json
${JSON.stringify(
  {
    systemPrompt: config.systemPrompt || 'You are a helpful assistant.',
    temperature: config.temperature ?? 1,
    topK: config.topK ?? 3,
    maxTokens: config.maxTokens || 2048,
  },
  null,
  2,
)}
\`\`\`

---

**Generated with Chrome AI DevBench** | [Report Issues](https://github.com/your-repo/issues)
`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate configuration table
 */
function generateConfigTable(config: PromptConfig): string {
  return `| Option | Value | Description |
|--------|-------|-------------|
| **systemPrompt** | \`"${config.systemPrompt || 'You are a helpful assistant.'}"\` | Defines AI's role and behavior |
| **temperature** | \`${config.temperature ?? 1}\` | Controls randomness (0-2, default: 1, higher = more creative) |
| **topK** | \`${config.topK ?? 3}\` | Number of token candidates (1-128, default: 3) |
| **maxTokens** | \`${config.maxTokens || 2048}\` | Maximum response length |`;
}

// ============================================================================
// Generic Documentation Generator
// ============================================================================

/**
 * Generate documentation for any Chrome AI API
 */
export function generateAPIDocumentation(
  options: DocsGeneratorOptions,
): string {
  const { apiName } = options;

  if (apiName.toLowerCase().includes('prompt')) {
    return generatePromptAPIDocumentation(options.config as PromptConfig);
  }

  // Fallback generic template
  return generateGenericAPIDocumentation(options);
}

/**
 * Generate generic API documentation
 */
function generateGenericAPIDocumentation(
  options: DocsGeneratorOptions,
): string {
  const { apiName, config } = options;

  return `# Chrome AI ${apiName} - Documentation

## Installation

\`\`\`bash
# Ensure you have Chrome 138+ with required flags enabled
\`\`\`

## Configuration

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

## Usage

\`\`\`typescript
// Add usage examples for ${apiName}
\`\`\`

## API Reference

See Chrome AI documentation for ${apiName} details.

---

**Generated with Chrome AI DevBench**
`;
}

// ============================================================================
// Export
// ============================================================================

export default {
  generatePromptAPIDocumentation,
  generateAPIDocumentation,
};
