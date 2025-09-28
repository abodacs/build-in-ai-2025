'use client';

import type React from 'react';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
  Suspense,
} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Chrome,
  Code,
  Shield,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Upload,
  ImageIcon,
  Music,
  FileText,
  X,
  Info,
  Scissors,
  TrendingUp,
} from 'lucide-react';
// ViewTransition is not available in React, removing this import

import {
  SummarizerResult,
  SummarizerResultSkeleton,
  TranslatorResult,
  TranslatorResultSkeleton,
  WriterResult,
  WriterResultSkeleton,
  RewriterResult,
  RewriterResultSkeleton,
  ProofreaderResult,
  ProofreaderResultSkeleton,
  PromptResult,
  PromptResultSkeleton,
  LanguageDetectionResult,
  LanguageDetectionResultSkeleton,
} from './api-result-components';

interface APIStatus {
  available: boolean;
  loading: boolean;
}

interface MultimediaFile {
  id: string;
  file: File;
  type: 'image' | 'audio';
  preview?: string;
  size: number;
}

interface SummarizerConfig {
  type: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format: 'markdown' | 'plain-text';
  length: 'short' | 'medium' | 'long';
  sharedContext: string;
}

interface WriterConfig {
  tone: 'formal' | 'neutral' | 'casual';
  format: 'markdown' | 'plain-text';
  length: 'short' | 'medium' | 'long';
  sharedContext: string;
}

interface RewriterConfig {
  tone: 'more-formal' | 'as-is' | 'more-casual';
  format: 'as-is' | 'markdown' | 'plain-text';
  length: 'shorter' | 'as-is' | 'longer';
  sharedContext: string;
}

interface TranslatorConfig {
  sourceLanguage: string;
  targetLanguage: string;
}

interface ProofreaderConfig {
  expectedInputLanguages: string[];
}

interface PromptConfig {
  temperature: number;
  topK: number;
  systemPrompt: string;
}

type LanguageDetectionConfig = object;

type APIConfigs = {
  summarizer: SummarizerConfig;
  writer: WriterConfig;
  rewriter: RewriterConfig;
  translator: TranslatorConfig;
  proofreader: ProofreaderConfig;
  prompt: PromptConfig;
  'language-detection': LanguageDetectionConfig;
};

interface APIConfig {
  id: keyof APIConfigs;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'text' | 'language' | 'multimodal';
  status: APIStatus;
  supportsMultimedia?: boolean;
  contextLimits?: {
    maxChars: number;
    recommendedChars: number;
    chunkingSupported: boolean;
  };
}

export function ChromeAIPlayground() {
  const [selectedAPI, setSelectedAPI] =
    useState<keyof APIConfigs>('summarizer');
  const [activeTab, setActiveTab] = useState('demo');
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    | {
        duration: number;
        tokens?: number;
      }
    | undefined
  >(undefined);
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'typescript'>(
    'javascript',
  );
  const [hasRunDemo, setHasRunDemo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const [multimediaFiles, setMultimediaFiles] = useState<MultimediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showContextTips, setShowContextTips] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiConfigs, setApiConfigs] = useState<APIConfigs>({
    summarizer: {
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
      sharedContext: '',
    },
    writer: {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
      sharedContext: '',
    },
    rewriter: {
      tone: 'as-is',
      format: 'as-is',
      length: 'as-is',
      sharedContext: '',
    },
    translator: {
      sourceLanguage: 'en',
      targetLanguage: 'es',
    },
    proofreader: {
      expectedInputLanguages: ['en'],
    },
    prompt: {
      temperature: 0.7,
      topK: 20,
      systemPrompt: 'You are a helpful assistant.',
    },
    'language-detection': {},
  });

  const apis: APIConfig[] = useMemo(
    () => [
      {
        id: 'summarizer',
        name: 'Summarizer API',
        description: 'Content summarization and condensation',
        icon: <Zap className="h-5 w-5" />,
        category: 'text',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 50000,
          recommendedChars: 10000,
          chunkingSupported: true,
        },
      },
      {
        id: 'translator',
        name: 'Translator API',
        description: 'Real-time language translation',
        icon: <Chrome className="h-5 w-5" />,
        category: 'language',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 20000,
          recommendedChars: 5000,
          chunkingSupported: true,
        },
      },
      {
        id: 'writer',
        name: 'Writer API',
        description: 'Content generation and creative writing',
        icon: <Code className="h-5 w-5" />,
        category: 'text',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 30000,
          recommendedChars: 8000,
          chunkingSupported: false,
        },
      },
      {
        id: 'rewriter',
        name: 'Rewriter API',
        description: 'Content restructuring and style adaptation',
        icon: <Zap className="h-5 w-5" />,
        category: 'text',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 25000,
          recommendedChars: 7000,
          chunkingSupported: true,
        },
      },
      {
        id: 'proofreader',
        name: 'Proofreader API',
        description: 'Grammar and writing improvement',
        icon: <CheckCircle className="h-5 w-5" />,
        category: 'text',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 15000,
          recommendedChars: 5000,
          chunkingSupported: true,
        },
      },
      {
        id: 'prompt',
        name: 'Prompt API',
        description: 'Flexible AI prompting with multimodal support',
        icon: <Shield className="h-5 w-5" />,
        category: 'multimodal',
        status: { available: false, loading: false },
        supportsMultimedia: true,
        contextLimits: {
          maxChars: 100000,
          recommendedChars: 20000,
          chunkingSupported: false,
        },
      },
      {
        id: 'language-detection',
        name: 'Language Detection',
        description: 'Automatic language identification',
        icon: <Chrome className="h-5 w-5" />,
        category: 'language',
        status: { available: false, loading: false },
        contextLimits: {
          maxChars: 10000,
          recommendedChars: 2000,
          chunkingSupported: false,
        },
      },
    ],
    [],
  );

  const currentAPI = useMemo(
    () => apis.find((api) => api.id === selectedAPI),
    [apis, selectedAPI],
  );
  const currentConfig = apiConfigs[selectedAPI];

  const contextAnalysis = useMemo(() => {
    const charCount = inputText.length;
    const limits = currentAPI?.contextLimits;

    if (!limits) return null;

    const isOverRecommended = charCount > limits.recommendedChars;
    const isOverMax = charCount > limits.maxChars;
    const efficiency = Math.min(
      100,
      (charCount / limits.recommendedChars) * 100,
    );

    return {
      charCount,
      isOverRecommended,
      isOverMax,
      efficiency,
      canChunk: limits.chunkingSupported && isOverRecommended,
      estimatedProcessingTime: Math.ceil(charCount / 1000) * 0.5, // rough estimate
    };
  }, [inputText, currentAPI?.contextLimits]);

  const updateAPIConfig = useCallback(
    <T extends keyof APIConfigs>(apiId: T, updates: Partial<APIConfigs[T]>) => {
      setApiConfigs((prev) => ({
        ...prev,
        [apiId]: { ...prev[apiId], ...updates },
      }));
    },
    [],
  );

  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: MultimediaFile[] = [];

    fileArray.forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
        const multimediaFile: MultimediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: file.type.startsWith('image/') ? 'image' : 'audio',
          size: file.size,
        };

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setMultimediaFiles((prev) =>
              prev.map((f) =>
                f.id === multimediaFile.id
                  ? { ...f, preview: e.target?.result as string }
                  : f,
              ),
            );
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(multimediaFile);
      }
    });

    setMultimediaFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const removeMultimediaFile = useCallback((id: string) => {
    setMultimediaFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (currentAPI?.supportsMultimedia) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [currentAPI?.supportsMultimedia, handleFileUpload],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileUpload(e.target.files);
      }
    },
    [handleFileUpload],
  );

  const chunkingSuggestions = useMemo(() => {
    if (!contextAnalysis?.canChunk) return [];

    const chunkSize = currentAPI?.contextLimits?.recommendedChars || 5000;
    const chunks = [];

    for (let i = 0; i < inputText.length; i += chunkSize) {
      chunks.push({
        index: chunks.length + 1,
        text: inputText.slice(i, i + chunkSize),
        charCount: Math.min(chunkSize, inputText.length - i),
      });
    }

    return chunks;
  }, [
    inputText,
    contextAnalysis?.canChunk,
    currentAPI?.contextLimits?.recommendedChars,
  ]);

  const languageOptions = useMemo(
    () => [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' },
      { value: 'de', label: 'German' },
      { value: 'it', label: 'Italian' },
      { value: 'pt', label: 'Portuguese' },
      { value: 'ru', label: 'Russian' },
      { value: 'ja', label: 'Japanese' },
      { value: 'ko', label: 'Korean' },
      { value: 'zh', label: 'Chinese (Simplified)' },
      { value: 'zh-Hant', label: 'Chinese (Traditional)' },
      { value: 'ar', label: 'Arabic' },
      { value: 'hi', label: 'Hindi' },
    ],
    [],
  );

  useEffect(() => {
    // Check Chrome AI API availability
    const checkAPIAvailability = async () => {
      // This would check for actual Chrome AI APIs when available
      // For now, we'll simulate the check
      console.warn('[v0] Checking Chrome AI API availability...');
    };

    checkAPIAvailability();
  }, []);

  useEffect(() => {
    if (!currentAPI?.supportsMultimedia) {
      setMultimediaFiles([]);
    }
  }, [currentAPI?.supportsMultimedia]);

  const handleAPICall = useCallback(async () => {
    if (!inputText.trim() && multimediaFiles.length === 0) return;

    startTransition(() => {
      setIsProcessing(true);
    });

    const startTime = performance.now();

    try {
      // Simulate API call - replace with actual Chrome AI API calls
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Mock responses based on API type and configuration
      let mockOutput = '';
      switch (selectedAPI) {
        case 'summarizer': {
          const summarizerConfig = currentConfig as SummarizerConfig;
          mockOutput = `${summarizerConfig.type.toUpperCase()} Summary (${summarizerConfig.length}, ${summarizerConfig.format}):\n${inputText.slice(0, 100)}...`;
          break;
        }
        case 'translator': {
          const translatorConfig = currentConfig as TranslatorConfig;
          mockOutput = `Translated from ${translatorConfig.sourceLanguage} to ${translatorConfig.targetLanguage}:\n${inputText}`;
          break;
        }
        case 'writer': {
          const writerConfig = currentConfig as WriterConfig;
          mockOutput = `Generated content (${writerConfig.tone} tone, ${writerConfig.length} length):\nBased on "${inputText}", here's the generated content...`;
          break;
        }
        case 'rewriter': {
          const rewriterConfig = currentConfig as RewriterConfig;
          mockOutput = `Rewritten (${rewriterConfig.tone} tone, ${rewriterConfig.length} length):\n${inputText.split(' ').reverse().join(' ')}`;
          break;
        }
        case 'proofreader': {
          mockOutput = `Proofread version:\n${inputText}\n\nSuggestions: No errors found.`;
          break;
        }
        case 'prompt': {
          const promptConfig = currentConfig as PromptConfig;
          const multimediaInfo =
            multimediaFiles.length > 0
              ? `\n\nMultimodal input detected: ${multimediaFiles.length} file(s) (${multimediaFiles.map((f) => f.type).join(', ')})`
              : '';
          mockOutput = `AI Response (temp: ${promptConfig.temperature}, topK: ${promptConfig.topK}):\nThis is a response to your prompt: "${inputText}"${multimediaInfo}`;
          break;
        }
        case 'language-detection': {
          mockOutput = `Detected language: English (confidence: 95%)\nAlternatives: Spanish (12%), French (8%)`;
          break;
        }
        default:
          mockOutput = 'API response would appear here';
      }

      startTransition(() => {
        setOutput(mockOutput);
        setPerformanceMetrics({
          duration,
          tokens: Math.floor(inputText.length / 4),
        });
        setHasRunDemo(true);
      });
    } catch (error) {
      startTransition(() => {
        setOutput('Error: API call failed. Please try again.');
      });
      console.error('[v0] API call error:', error);
    } finally {
      startTransition(() => {
        setIsProcessing(false);
      });
    }
  }, [inputText, multimediaFiles, selectedAPI, currentConfig]);

  const renderAPIResult = () => {
    if (!output) return null;

    const resultProps = {
      output,
      performanceMetrics,
      config: currentConfig,
    };

    switch (selectedAPI) {
      case 'summarizer':
        return (
          <Suspense fallback={<SummarizerResultSkeleton />}>
            <SummarizerResult {...resultProps} />
          </Suspense>
        );
      case 'translator':
        return (
          <Suspense fallback={<TranslatorResultSkeleton />}>
            <TranslatorResult {...resultProps} />
          </Suspense>
        );
      case 'writer':
        return (
          <Suspense fallback={<WriterResultSkeleton />}>
            <WriterResult {...resultProps} />
          </Suspense>
        );
      case 'rewriter':
        return (
          <Suspense fallback={<RewriterResultSkeleton />}>
            <RewriterResult {...resultProps} />
          </Suspense>
        );
      case 'proofreader':
        return (
          <Suspense fallback={<ProofreaderResultSkeleton />}>
            <ProofreaderResult {...resultProps} />
          </Suspense>
        );
      case 'prompt':
        return (
          <Suspense fallback={<PromptResultSkeleton />}>
            <PromptResult {...resultProps} />
          </Suspense>
        );
      case 'language-detection':
        return (
          <Suspense fallback={<LanguageDetectionResultSkeleton />}>
            <LanguageDetectionResult {...resultProps} />
          </Suspense>
        );
      default:
        return (
          <div className="code-block p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{output}</pre>
          </div>
        );
    }
  };

  const generatedCode = useMemo(() => {
    const isTS = codeLanguage === 'typescript';
    const hasInput = inputText.trim().length > 0;
    const hasMultimedia = multimediaFiles.length > 0;
    const sampleInput = hasInput ? inputText : 'Your input text here';
    const config = currentConfig;

    let configCode = '';
    let createCall = '';
    let methodCall = '';
    let multimediaCode = '';

    if (selectedAPI === 'prompt' && hasMultimedia) {
      multimediaCode = `
    // Multimodal input with ${multimediaFiles.length} file(s)
    const multimediaInput = [
      {
        role: 'user',
        content: [
          { type: 'text', value: '${sampleInput.replace(/'/g, "\\'")}' },${multimediaFiles
            .map(
              (file) => `
          { type: '${file.type}', value: ${file.type}Blob } // ${file.file.name}`,
            )
            .join(',')}
        ]
      }
    ];`;
    }

    switch (selectedAPI) {
      case 'summarizer': {
        const summarizerConfig = config as SummarizerConfig;
        configCode = `const options = {
  type: '${summarizerConfig.type}',
  format: '${summarizerConfig.format}',
  length: '${summarizerConfig.length}'${summarizerConfig.sharedContext ? `,\n  sharedContext: '${summarizerConfig.sharedContext}'` : ''}
};`;
        createCall = 'await Summarizer.create(options)';
        methodCall = 'summarize';
        break;
      }
      case 'writer': {
        const writerConfig = config as WriterConfig;
        configCode = `const options = {
  tone: '${writerConfig.tone}',
  format: '${writerConfig.format}',
  length: '${writerConfig.length}'${writerConfig.sharedContext ? `,\n  sharedContext: '${writerConfig.sharedContext}'` : ''}
};`;
        createCall = 'await Writer.create(options)';
        methodCall = 'write';
        break;
      }
      case 'rewriter': {
        const rewriterConfig = config as RewriterConfig;
        configCode = `const options = {
  tone: '${rewriterConfig.tone}',
  format: '${rewriterConfig.format}',
  length: '${rewriterConfig.length}'${rewriterConfig.sharedContext ? `,\n  sharedContext: '${rewriterConfig.sharedContext}'` : ''}
};`;
        createCall = 'await Rewriter.create(options)';
        methodCall = 'rewrite';
        break;
      }
      case 'translator': {
        const translatorConfig = config as TranslatorConfig;
        configCode = `const options = {
  sourceLanguage: '${translatorConfig.sourceLanguage}',
  targetLanguage: '${translatorConfig.targetLanguage}'
};`;
        createCall = 'await Translator.create(options)';
        methodCall = 'translate';
        break;
      }
      case 'proofreader': {
        const proofreaderConfig = config as ProofreaderConfig;
        configCode = `const options = {
  expectedInputLanguages: [${proofreaderConfig.expectedInputLanguages.map((lang) => `'${lang}'`).join(', ')}]
};`;
        createCall = 'await Proofreader.create(options)';
        methodCall = 'proofread';
        break;
      }
      case 'prompt': {
        const promptConfig = config as PromptConfig;
        configCode = `const options = {
  temperature: ${promptConfig.temperature},
  topK: ${promptConfig.topK}${promptConfig.systemPrompt ? `,\n  systemPrompt: '${promptConfig.systemPrompt}'` : ''}
};`;
        createCall = 'await LanguageModel.create(options)';
        methodCall = 'prompt';
        break;
      }
      case 'language-detection': {
        configCode = '// Language Detection has minimal configuration';
        createCall = 'await LanguageDetector.create()';
        methodCall = 'detect';
        break;
      }
    }

    const inputParam =
      selectedAPI === 'prompt' && hasMultimedia
        ? 'multimediaInput'
        : `'${sampleInput.replace(/'/g, "\\'")}'`;

    const apiCall = `${isTS ? '// TypeScript example' : '// JavaScript example'}
${isTS ? 'async function ' : 'async function '}${selectedAPI}Example()${isTS ? ': Promise<string>' : ''} {
  try {
    // Check if ${currentAPI?.name} is available
    if (!('${selectedAPI === 'prompt' ? 'LanguageModel' : selectedAPI === 'language-detection' ? 'LanguageDetector' : selectedAPI.charAt(0).toUpperCase() + selectedAPI.slice(1)}' in self)) {
      throw new Error('${currentAPI?.name} not available');
    }

    // Check availability
    const availability = await ${selectedAPI === 'prompt' ? 'LanguageModel' : selectedAPI === 'language-detection' ? 'LanguageDetector' : selectedAPI.charAt(0).toUpperCase() + selectedAPI.slice(1)}.availability();
    if (availability === 'no') {
      throw new Error('${currentAPI?.name} not available');
    }

    // Configuration${hasInput ? ' (from your demo settings)' : ''}
    ${configCode}
    ${multimediaCode}
    
    // Initialize the ${currentAPI?.name}
    const ${selectedAPI.replace('-', '')} = ${createCall};
    
    // Process the input${hasInput ? ' (from your demo)' : ''}
    const result = await ${selectedAPI.replace('-', '')}.${methodCall}(${inputParam});
    
    // Clean up
    ${selectedAPI.replace('-', '')}.destroy();
    
    return result;
  } catch (error) {
    console.error('${currentAPI?.name} error:', error);
    throw error;
  }
}

// Usage
${selectedAPI}Example()
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));`;

    return apiCall.trim();
  }, [
    codeLanguage,
    inputText,
    multimediaFiles,
    selectedAPI,
    currentConfig,
    currentAPI?.name,
  ]);

  const copyCodeToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
    } catch (error) {
      console.error('[v0] Failed to copy code:', error);
    }
  }, [generatedCode]);

  const renderConfigurationPanel = () => {
    switch (selectedAPI) {
      case 'summarizer': {
        const summarizerConfig = currentConfig as SummarizerConfig;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="summarizer-type">Summary Type</Label>
                <Select
                  value={summarizerConfig.type}
                  onValueChange={(value: SummarizerConfig['type']) =>
                    updateAPIConfig('summarizer', { type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="key-points">Key Points</SelectItem>
                    <SelectItem value="tldr">TL;DR</SelectItem>
                    <SelectItem value="teaser">Teaser</SelectItem>
                    <SelectItem value="headline">Headline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="summarizer-format">Format</Label>
                <Select
                  value={summarizerConfig.format}
                  onValueChange={(value: SummarizerConfig['format']) =>
                    updateAPIConfig('summarizer', { format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="plain-text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="summarizer-length">Length</Label>
              <Select
                value={summarizerConfig.length}
                onValueChange={(value: SummarizerConfig['length']) =>
                  updateAPIConfig('summarizer', { length: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summarizer-context">
                Shared Context (Optional)
              </Label>
              <Input
                id="summarizer-context"
                placeholder="e.g., This is a technical article about web development"
                value={summarizerConfig.sharedContext}
                onChange={(e) =>
                  updateAPIConfig('summarizer', {
                    sharedContext: e.target.value,
                  })
                }
              />
            </div>
          </div>
        );
      }

      case 'writer': {
        const writerConfig = currentConfig as WriterConfig;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="writer-tone">Tone</Label>
                <Select
                  value={writerConfig.tone}
                  onValueChange={(value: WriterConfig['tone']) =>
                    updateAPIConfig('writer', { tone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="writer-format">Format</Label>
                <Select
                  value={writerConfig.format}
                  onValueChange={(value: WriterConfig['format']) =>
                    updateAPIConfig('writer', { format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="plain-text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="writer-length">Length</Label>
              <Select
                value={writerConfig.length}
                onValueChange={(value: WriterConfig['length']) =>
                  updateAPIConfig('writer', { length: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="writer-context">Shared Context (Optional)</Label>
              <Input
                id="writer-context"
                placeholder="e.g., Content for a technology blog targeting developers"
                value={writerConfig.sharedContext}
                onChange={(e) =>
                  updateAPIConfig('writer', { sharedContext: e.target.value })
                }
              />
            </div>
          </div>
        );
      }

      case 'rewriter': {
        const rewriterConfig = currentConfig as RewriterConfig;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rewriter-tone">Tone</Label>
                <Select
                  value={rewriterConfig.tone}
                  onValueChange={(value: RewriterConfig['tone']) =>
                    updateAPIConfig('rewriter', { tone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="more-formal">More Formal</SelectItem>
                    <SelectItem value="as-is">As Is</SelectItem>
                    <SelectItem value="more-casual">More Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rewriter-format">Format</Label>
                <Select
                  value={rewriterConfig.format}
                  onValueChange={(value: RewriterConfig['format']) =>
                    updateAPIConfig('rewriter', { format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="as-is">As Is</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="plain-text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="rewriter-length">Length</Label>
              <Select
                value={rewriterConfig.length}
                onValueChange={(value: RewriterConfig['length']) =>
                  updateAPIConfig('rewriter', { length: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shorter">Shorter</SelectItem>
                  <SelectItem value="as-is">As Is</SelectItem>
                  <SelectItem value="longer">Longer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rewriter-context">
                Shared Context (Optional)
              </Label>
              <Input
                id="rewriter-context"
                placeholder="e.g., Professional email communication"
                value={rewriterConfig.sharedContext}
                onChange={(e) =>
                  updateAPIConfig('rewriter', { sharedContext: e.target.value })
                }
              />
            </div>
          </div>
        );
      }

      case 'translator': {
        const translatorConfig = currentConfig as TranslatorConfig;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="translator-source">Source Language</Label>
                <Select
                  value={translatorConfig.sourceLanguage}
                  onValueChange={(value: string) =>
                    updateAPIConfig('translator', { sourceLanguage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="translator-target">Target Language</Label>
                <Select
                  value={translatorConfig.targetLanguage}
                  onValueChange={(value: string) =>
                    updateAPIConfig('translator', { targetLanguage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      }

      case 'proofreader': {
        const proofreaderConfig = currentConfig as ProofreaderConfig;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="proofreader-languages">
                Expected Input Languages
              </Label>
              <Select
                value={proofreaderConfig.expectedInputLanguages[0] || 'en'}
                onValueChange={(value: string) =>
                  updateAPIConfig('proofreader', {
                    expectedInputLanguages: [value],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }

      case 'prompt': {
        const promptConfig = currentConfig as PromptConfig;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prompt-temperature">
                  Temperature: {promptConfig.temperature}
                </Label>
                <Slider
                  id="prompt-temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[promptConfig.temperature]}
                  onValueChange={([value]) =>
                    updateAPIConfig('prompt', { temperature: value })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controls creativity (0 = focused, 1 = creative)
                </p>
              </div>
              <div>
                <Label htmlFor="prompt-topk">Top K: {promptConfig.topK}</Label>
                <Slider
                  id="prompt-topk"
                  min={1}
                  max={40}
                  step={1}
                  value={[promptConfig.topK]}
                  onValueChange={([value]) =>
                    updateAPIConfig('prompt', { topK: value })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vocabulary diversity (1 = focused, 40 = diverse)
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="prompt-system">System Prompt</Label>
              <Textarea
                id="prompt-system"
                placeholder="You are a helpful assistant that..."
                value={promptConfig.systemPrompt}
                onChange={(e) =>
                  updateAPIConfig('prompt', { systemPrompt: e.target.value })
                }
                className="mt-2"
              />
            </div>
          </div>
        );
      }

      case 'language-detection':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Language Detection API has minimal configuration options. It
              automatically detects the language of input text.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Chrome className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Chrome AI DevBench</h1>
                <p className="text-sm text-muted-foreground">
                  Interactive playground for Chrome&apos;s built-in AI APIs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="api-unavailable">
                <XCircle className="h-3 w-3 mr-1" />
                Chrome AI APIs Required
              </Badge>
              <Button variant="outline" size="sm">
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Browser Compatibility Alert */}
        <Alert className="mb-8 security-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Chrome AI APIs are currently in development. This playground
            demonstrates the upcoming functionality. You&apos;ll need Chrome
            Canary with experimental flags enabled to test the actual APIs.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* API Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available APIs</CardTitle>
                <CardDescription>
                  Select an API to explore its capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {apis.map((api) => (
                  <Button
                    key={api.id}
                    variant={selectedAPI === api.id ? 'default' : 'ghost'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      setSelectedAPI(api.id);
                      setHasRunDemo(false);
                      setOutput('');
                      setInputText('');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {api.icon}
                      <div className="text-left">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {api.name}
                          {api.supportsMultimedia && (
                            <Badge variant="secondary" className="text-xs">
                              Multimodal
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {api.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {currentAPI?.icon}
                      {currentAPI?.name}
                    </CardTitle>
                    <CardDescription>{currentAPI?.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="api-unavailable">
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="demo"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Demo
                    </TabsTrigger>
                    <TabsTrigger
                      value="code"
                      className="flex items-center gap-2"
                    >
                      <Code className="h-4 w-4" />
                      Code
                      {hasRunDemo && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-4 px-1 text-xs"
                        >
                          Ready
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Security
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="demo" className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                      <p className="text-sm text-muted-foreground">
                        <strong>Step 1:</strong> Configure the API settings
                        below, then try it with your input. Check the{' '}
                        <strong>Code</strong> tab to see the implementation with
                        your exact configuration.
                      </p>
                    </div>

                    <Collapsible
                      open={isSettingsOpen}
                      onOpenChange={setIsSettingsOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-transparent"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            API Configuration
                          </div>
                          {isSettingsOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Settings for {currentAPI?.name}
                            </CardTitle>
                            <CardDescription>
                              Configure the API options. Changes will be
                              reflected in the generated code.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {renderConfigurationPanel()}
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="space-y-4">
                      {currentAPI?.supportsMultimedia && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Multimedia Input (Optional)
                            </label>
                            <div
                              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                isDragOver
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                              }`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Drag and drop images or audio files, or{' '}
                                  <button
                                    type="button"
                                    className="text-primary hover:underline"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  >
                                    browse files
                                  </button>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Supports: JPG, PNG, GIF, MP3, WAV, M4A
                                </p>
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,audio/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                              />
                            </div>
                          </div>

                          {multimediaFiles.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Uploaded Files
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {multimediaFiles.map((file) => (
                                  <div key={file.id} className="relative group">
                                    <div className="border rounded-lg p-3 bg-muted/50">
                                      <div className="flex items-center gap-2 mb-2">
                                        {file.type === 'image' ? (
                                          <ImageIcon className="h-4 w-4" />
                                        ) : (
                                          <Music className="h-4 w-4" />
                                        )}
                                        <span className="text-xs font-medium truncate">
                                          {file.file.name}
                                        </span>
                                      </div>
                                      {file.preview && (
                                        <img
                                          src={
                                            file.preview || '/placeholder.svg'
                                          }
                                          alt={file.file.name}
                                          className="w-full h-20 object-cover rounded"
                                        />
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {(file.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() =>
                                        removeMultimediaFile(file.id)
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Input Text
                          </label>
                          {contextAnalysis && (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  contextAnalysis.isOverMax
                                    ? 'destructive'
                                    : contextAnalysis.isOverRecommended
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className="text-xs"
                              >
                                {contextAnalysis.charCount.toLocaleString()}{' '}
                                chars
                              </Badge>
                              {contextAnalysis.canChunk && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setShowContextTips(!showContextTips)
                                  }
                                  className="h-6 px-2 text-xs"
                                >
                                  <Scissors className="h-3 w-3 mr-1" />
                                  Optimize
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <Textarea
                          placeholder={`Enter text to process with ${currentAPI?.name}...`}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="min-h-[120px]"
                        />

                        {contextAnalysis && (
                          <div className="mt-2 space-y-2">
                            {contextAnalysis.efficiency > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>
                                  Context efficiency:{' '}
                                  {Math.round(contextAnalysis.efficiency)}%
                                </span>
                                {contextAnalysis.estimatedProcessingTime >
                                  1 && (
                                  <span>
                                    • Est. processing:{' '}
                                    {contextAnalysis.estimatedProcessingTime}s
                                  </span>
                                )}
                              </div>
                            )}

                            {contextAnalysis.isOverMax && (
                              <Alert className="py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  Input exceeds maximum length (
                                  {currentAPI?.contextLimits?.maxChars.toLocaleString()}{' '}
                                  chars). Consider chunking your content.
                                </AlertDescription>
                              </Alert>
                            )}

                            {contextAnalysis.isOverRecommended &&
                              !contextAnalysis.isOverMax && (
                                <Alert className="py-2">
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Large input detected. Performance may be
                                    slower. Recommended:{' '}
                                    {currentAPI?.contextLimits?.recommendedChars.toLocaleString()}{' '}
                                    chars or less.
                                  </AlertDescription>
                                </Alert>
                              )}
                          </div>
                        )}

                        {showContextTips && contextAnalysis?.canChunk && (
                          <Card className="mt-3">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Scissors className="h-4 w-4" />
                                Content Optimization
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Your input is large. Consider processing it in
                                chunks for better performance.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Suggested chunks: {chunkingSuggestions.length}{' '}
                                  parts
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {chunkingSuggestions
                                    .slice(0, 4)
                                    .map((chunk) => (
                                      <div
                                        key={chunk.index}
                                        className="bg-muted/50 p-2 rounded"
                                      >
                                        <span className="font-medium">
                                          Chunk {chunk.index}
                                        </span>
                                        <br />
                                        <span className="text-muted-foreground">
                                          {chunk.charCount.toLocaleString()}{' '}
                                          chars
                                        </span>
                                      </div>
                                    ))}
                                </div>
                                {chunkingSuggestions.length > 4 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{chunkingSuggestions.length - 4} more
                                    chunks...
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          onClick={handleAPICall}
                          disabled={
                            (!inputText.trim() &&
                              multimediaFiles.length === 0) ||
                            isProcessing ||
                            (contextAnalysis?.isOverMax ?? false)
                          }
                          className="flex items-center gap-2"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              Run {currentAPI?.name}
                            </>
                          )}
                        </Button>

                        {performanceMetrics && (
                          <Badge className="metric-badge">
                            <Clock className="h-3 w-3 mr-1" />
                            {performanceMetrics.duration}ms
                          </Badge>
                        )}

                        {hasRunDemo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('code')}
                            className="flex items-center gap-2"
                          >
                            <Code className="h-4 w-4" />
                            View Code
                          </Button>
                        )}
                      </div>

                      {output && renderAPIResult()}
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="space-y-6">
                    {!hasRunDemo && (
                      <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-muted-foreground">
                        <p className="text-sm text-muted-foreground">
                          <strong>Tip:</strong> Configure the API and run the
                          demo first to see how the code works with your
                          specific configuration and input.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Generated Code</h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={codeLanguage}
                          onValueChange={(value: 'javascript' | 'typescript') =>
                            setCodeLanguage(value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="javascript">
                              JavaScript
                            </SelectItem>
                            <SelectItem value="typescript">
                              TypeScript
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyCodeToClipboard}
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Code className="h-4 w-4" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <div className="code-block p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>

                    {hasRunDemo && (
                      <div className="bg-accent/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 inline mr-2 text-accent" />
                          This code reflects your current settings
                          {multimediaFiles.length > 0
                            ? ', multimedia files,'
                            : ''}{' '}
                          and demo input, and will produce similar results to
                          what you just tested.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6">
                    {selectedAPI === 'prompt' ? (
                      <div className="space-y-4">
                        <Alert className="security-warning">
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Security Warning:</strong> The Prompt API is
                            vulnerable to prompt injection attacks. Always
                            validate and sanitize user inputs.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Prompt Injection Prevention
                          </h3>
                          <p className="text-muted-foreground">
                            Learn how to protect your application from malicious
                            prompts that could manipulate AI behavior.
                          </p>

                          <div className="code-block p-4 rounded-lg">
                            <pre className="text-sm">
                              {`// Example: Using delimiters to separate instructions from user input
const safePrompt = \`
Please summarize the following text, which is delimited by triple quotes:

"""
\${userInput}
"""

Provide only a summary, nothing else.
\`;`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Security Considerations
                        </h3>
                        <p className="text-muted-foreground">
                          Security best practices for {currentAPI?.name} will be
                          documented here.
                        </p>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-accent" />
                              Data Privacy
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              All processing happens on-device. Your data never
                              leaves your browser.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
