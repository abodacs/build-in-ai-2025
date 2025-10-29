/**
 * Documentation Generator Utility
 *
 * Generates comprehensive README documentation for Chrome AI APIs
 * Includes setup, usage, configuration, examples, and troubleshooting
 *
 * @module utils/codeGeneration/docsGenerator
 */

import type { PromptConfig } from '@/features/unified-playground/api-modules/prompt/types';
import type { ProofreaderConfig } from '@/features/unified-playground/api-modules/proofreader/types/proofreader.types';
import type { WriterConfig } from '@/features/unified-playground/api-modules/writer/types/writer.types';
import type { RewriterConfig } from '@/features/unified-playground/api-modules/rewriter/types/rewriter.types';

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

/**
 * Generate comprehensive README for Proofreader API
 */
export function generateProofreaderAPIDocumentation(
  config: ProofreaderConfig,
): string {
  return `# Chrome AI Proofreader API - Quick Start Guide

> Detect and correct grammar, spelling, and punctuation errors using Chrome's built-in AI

## 🚀 Quick Start

\`\`\`typescript
// Check if API is available
const availability = await window.Proofreader.availability();

if (availability === 'no') {
  console.error('Proofreader API not available');
  return;
}

// Create a proofreader
const proofreader = await window.Proofreader.create({
  expectedInputLanguages: ['en'],
  includeCorrectionTypes: true,
  includeCorrectionExplanations: true,
});

// Proofread text
const text = 'This is a test with erors.';
const corrections = await proofreader.proofread(text);

corrections.forEach(correction => {
  console.log(\`Error at position \${correction.start}-\${correction.end}\`);
  console.log(\`Type: \${correction.type}\`);
  console.log(\`Suggestion: \${correction.suggestion}\`);
  console.log(\`Explanation: \${correction.explanation}\`);
});
\`\`\`

## 📋 Requirements

- **Browser**: Chrome 138+ (Dev/Canary channel)
- **Flag**: Enable \`chrome://flags/#proofreader-api\`
- **Model**: Downloads automatically on first use (~100MB)

## ⚙️ Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| **expectedInputLanguages** | \`${JSON.stringify(config.expectedInputLanguages || ['en'])}\` | Languages to proofread (currently only 'en' supported) |
| **includeCorrectionTypes** | \`${config.includeCorrectionTypes ?? true}\` | Include error type labels (spelling, grammar, etc.) |
| **includeCorrectionExplanations** | \`${config.includeCorrectionExplanations ?? true}\` | Include plain-language explanations |

## 💡 Usage Examples

### Basic Proofreading

\`\`\`typescript
const proofreader = await window.Proofreader.create();
const corrections = await proofreader.proofread('Their are many erors here.');

// corrections = [
//   { start: 0, end: 5, suggestion: 'There', type: 'spelling' },
//   { start: 17, end: 22, suggestion: 'errors', type: 'spelling' }
// ]
\`\`\`

### Applying Corrections

\`\`\`typescript
function applyCorrections(text: string, corrections: any[]) {
  // Sort by position (descending) to apply from end to start
  const sorted = [...corrections].sort((a, b) => b.start - a.start);

  let result = text;
  for (const correction of sorted) {
    result = result.slice(0, correction.start) +
             correction.suggestion +
             result.slice(correction.end);
  }
  return result;
}

const original = 'Their are many erors here.';
const corrections = await proofreader.proofread(original);
const corrected = applyCorrections(original, corrections);
// corrected = 'There are many errors here.'
\`\`\`

### React Hook Example

\`\`\`typescript
import { useState, useEffect } from 'react';

function useProofreader() {
  const [proofreader, setProofreader] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const availability = await window.Proofreader.availability();

      if (availability !== 'no' && mounted) {
        const p = await window.Proofreader.create({
          includeCorrectionTypes: true,
          includeCorrectionExplanations: true,
        });
        setProofreader(p);
        setIsReady(true);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  const proofread = async (text: string) => {
    if (!proofreader) throw new Error('Proofreader not ready');
    return await proofreader.proofread(text);
  };

  return { proofread, isReady };
}
\`\`\`

## 🎯 Correction Types

- **spelling**: Misspelled words
- **grammar**: Grammatical errors
- **punctuation**: Missing or incorrect punctuation
- **capitalization**: Incorrect capitalization
- **preposition**: Wrong preposition usage
- **missing-words**: Missing words in sentence

## 🔗 Related Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Proofreader API Spec](https://github.com/webmachinelearning/writing-assistance-apis)

## 📝 Your Configuration

\`\`\`json
${JSON.stringify(
  {
    expectedInputLanguages: config.expectedInputLanguages || ['en'],
    includeCorrectionTypes: config.includeCorrectionTypes ?? true,
    includeCorrectionExplanations: config.includeCorrectionExplanations ?? true,
  },
  null,
  2,
)}
\`\`\`

---

**Generated with Chrome AI DevBench**
`;
}

/**
 * Generate comprehensive README for Writer API
 */
export function generateWriterAPIDocumentation(config: WriterConfig): string {
  return `# Chrome AI Writer API - Quick Start Guide

> Generate AI-written content with customizable tone, format, and length

## 🚀 Quick Start

\`\`\`typescript
// Check if API is available
const availability = await window.Writer.availability();

if (availability === 'no') {
  console.error('Writer API not available');
  return;
}

// Create a writer
const writer = await window.Writer.create({
  tone: '${config.tone || 'neutral'}',
  format: '${config.format || 'plain-text'}',
  length: '${config.length || 'medium'}',
  outputLanguage: '${config.outputLanguage || 'en'}',
  ${config.sharedContext ? `sharedContext: '${config.sharedContext}',` : ''}
});

// Write content
const prompt = 'Write about the benefits of AI';
const content = await writer.write(prompt);
console.log(content);
\`\`\`

## 📋 Requirements

- **Browser**: Chrome 138+ (Dev/Canary channel)
- **Flag**: Enable \`chrome://flags/#writer-api\`
- **Model**: Downloads automatically on first use (~2GB)

## ⚙️ Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| **tone** | \`"${config.tone || 'neutral'}"\` | Writing tone (formal, casual, neutral) |
| **format** | \`"${config.format || 'plain-text'}"\` | Output format (plain-text, markdown, email) |
| **length** | \`"${config.length || 'medium'}"\` | Content length (short, medium, long) |
| **outputLanguage** | \`"${config.outputLanguage || 'en'}"\` | Output language code |
| **sharedContext** | \`"${config.sharedContext || ''}"\` | Additional context for generation |

## 💡 Usage Examples

### Basic Writing

\`\`\`typescript
const writer = await window.Writer.create({
  tone: 'professional',
  format: 'markdown',
  length: 'medium',
  outputLanguage: 'en',
});

const content = await writer.write('Explain quantum computing');
// Returns professionally-written markdown content about quantum computing
\`\`\`

### Streaming for Long Content

\`\`\`typescript
const writer = await window.Writer.create({
  tone: 'casual',
  length: 'long',
});

const stream = writer.writeStreaming('Write a story about space exploration');
const reader = stream.getReader();

let fullContent = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  fullContent = value;
  console.log('Progress:', value); // Display incremental updates
}

console.log('Complete:', fullContent);
\`\`\`

### React Hook Example

\`\`\`typescript
import { useState, useEffect } from 'react';

function useWriter(config: any) {
  const [writer, setWriter] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const availability = await window.Writer.availability();

      if (availability !== 'no' && mounted) {
        const w = await window.Writer.create(config);
        setWriter(w);
        setIsReady(true);
      }
    }

    init();
    return () => { mounted = false; };
  }, [config]);

  const write = async (prompt: string) => {
    if (!writer) throw new Error('Writer not ready');
    return await writer.write(prompt);
  };

  return { write, isReady };
}
\`\`\`

## 🎯 Best Practices

1. **Be Specific**: Provide clear, detailed prompts
2. **Use Context**: Leverage sharedContext for better results
3. **Choose Appropriate Tone**: Match tone to your audience
4. **Stream Long Content**: Use streaming for better UX

## 🔗 Related Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Writer API Spec](https://github.com/webmachinelearning/writing-assistance-apis)

## 📝 Your Configuration

\`\`\`json
${JSON.stringify(
  {
    tone: config.tone || 'neutral',
    format: config.format || 'plain-text',
    length: config.length || 'medium',
    outputLanguage: config.outputLanguage || 'en',
    sharedContext: config.sharedContext,
  },
  null,
  2,
)}
\`\`\`

---

**Generated with Chrome AI DevBench**
`;
}

/**
 * Generate comprehensive README for Rewriter API
 */
export function generateRewriterAPIDocumentation(
  config: RewriterConfig,
): string {
  return `# Chrome AI Rewriter API - Quick Start Guide

> Rewrite existing text with different tone, format, or length while preserving meaning

## 🚀 Quick Start

\`\`\`typescript
// Check if API is available
const availability = await window.Rewriter.availability();

if (availability === 'no') {
  console.error('Rewriter API not available');
  return;
}

// Create a rewriter
const rewriter = await window.Rewriter.create({
  tone: '${config.tone || 'as-is'}',
  format: '${config.format || 'as-is'}',
  length: '${config.length || 'as-is'}',
  outputLanguage: '${config.outputLanguage || 'en'}',
});

// Rewrite text
const original = 'Hey! This is really cool.';
const rewritten = await rewriter.rewrite(original);
console.log(rewritten); // 'This is quite impressive.'
\`\`\`

## 📋 Requirements

- **Browser**: Chrome 138+ (Dev/Canary channel)
- **Flag**: Enable \`chrome://flags/#rewriter-api\`
- **Model**: Downloads automatically on first use (~2GB)

## ⚙️ Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| **tone** | \`"${config.tone || 'as-is'}"\` | Target tone (formal, casual, as-is, more-formal, more-casual) |
| **format** | \`"${config.format || 'as-is'}"\` | Target format (as-is, plain-text, markdown) |
| **length** | \`"${config.length || 'as-is'}"\` | Target length (as-is, shorter, longer) |
| **outputLanguage** | \`"${config.outputLanguage || 'en'}"\` | Output language code |

## 💡 Usage Examples

### Make Text More Formal

\`\`\`typescript
const rewriter = await window.Rewriter.create({
  tone: 'more-formal',
  outputLanguage: 'en',
});

const casual = 'Hey, wanna grab coffee later?';
const formal = await rewriter.rewrite(casual);
// formal = 'Would you like to meet for coffee later?'
\`\`\`

### Shorten Text

\`\`\`typescript
const rewriter = await window.Rewriter.create({
  length: 'shorter',
});

const long = 'This is a very long sentence that contains a lot of information and details that might be unnecessary for the main point.';
const short = await rewriter.rewrite(long);
// short = 'This sentence contains excessive details.'
\`\`\`

### Streaming for Long Rewrites

\`\`\`typescript
const rewriter = await window.Rewriter.create({
  tone: 'more-casual',
  length: 'as-is',
});

const stream = rewriter.rewriteStreaming('The aforementioned proposal necessitates comprehensive deliberation.');
const reader = stream.getReader();

let fullRewrite = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  fullRewrite = value;
  console.log('Progress:', value);
}

console.log('Complete:', fullRewrite);
// 'We need to think carefully about this proposal.'
\`\`\`

### React Hook Example

\`\`\`typescript
import { useState, useEffect } from 'react';

function useRewriter(config: any) {
  const [rewriter, setRewriter] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const availability = await window.Rewriter.availability();

      if (availability !== 'no' && mounted) {
        const r = await window.Rewriter.create(config);
        setRewriter(r);
        setIsReady(true);
      }
    }

    init();
    return () => { mounted = false; };
  }, [config]);

  const rewrite = async (text: string) => {
    if (!rewriter) throw new Error('Rewriter not ready');
    return await rewriter.rewrite(text);
  };

  return { rewrite, isReady };
}
\`\`\`

## 🎯 Common Use Cases

- **Email Drafts**: Convert casual notes to professional emails
- **Documentation**: Make technical docs more accessible
- **Social Media**: Adapt content for different platforms
- **Accessibility**: Simplify complex text
- **Summarization**: Condense long passages

## 🔗 Related Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Rewriter API Spec](https://github.com/webmachinelearning/writing-assistance-apis)

## 📝 Your Configuration

\`\`\`json
${JSON.stringify(
  {
    tone: config.tone || 'as-is',
    format: config.format || 'as-is',
    length: config.length || 'as-is',
    outputLanguage: config.outputLanguage || 'en',
  },
  null,
  2,
)}
\`\`\`

---

**Generated with Chrome AI DevBench**
`;
}
