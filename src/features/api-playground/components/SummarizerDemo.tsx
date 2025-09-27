/**
 * Summarizer API Demo Component
 * Interactive demo for the Chrome AI Summarizer API with integrated code generation
 */

import React, { useState } from 'react';
import { Play, RotateCcw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { summarizeText } from '@/services/aiService';
import { CodeGenerationPanel } from '@/features/code-display';
import type { SummarizerOptions } from '@/services/aiService';

const sampleTexts = [
  {
    title: "Technology Article",
    content: "Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of 'intelligent agents': any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals. Colloquially, the term 'artificial intelligence' is often used to describe machines that mimic 'cognitive' functions that humans associate with the human mind, such as 'learning' and 'problem solving'."
  },
  {
    title: "News Article",
    content: "Climate change is a long-term change in the average weather patterns that have come to define Earth's local, regional and global climates. These changes have a broad range of observed effects that are synonymous with the term. Changes observed in Earth's climate since the early 20th century are primarily driven by human activities, particularly fossil fuel burning, which increases heat-trapping greenhouse gas levels in Earth's atmosphere."
  },
  {
    title: "Scientific Paper Abstract",
    content: "Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement, to perform calculations. The devices that perform quantum computations are known as quantum computers. Though current quantum computers are too small to outperform usual computers for practical applications, they are believed to be capable of solving certain computational problems exponentially faster than classical computers."
  }
];

export function SummarizerDemo() {
  const { setApiResult, setLoading } = useAppStore();
  const [inputText, setInputText] = useState(sampleTexts[0].content);
  const [summaryType, setSummaryType] = useState<'key-points' | 'tl-dr' | 'teaser' | 'headline'>('tl-dr');
  const [outputFormat, setOutputFormat] = useState<'plain-text' | 'markdown'>('plain-text');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  // Handle sample text selection
  const handleSampleSelect = (sample: typeof sampleTexts[0]) => {
    setInputText(sample.content);
    setResult(null);
    setError(null);
  };

  // Handle summarization
  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setProcessingTime(null);

    try {
      const options: SummarizerOptions = {
        input: inputText,
        type: summaryType,
        format: outputFormat,
        length: summaryLength
      };

      const response = await summarizeText(options);

      if (response.error) {
        setError(response.error);
        setApiResult({
          data: null,
          error: response.error,
          latency: response.latency
        });
      } else {
        setResult(response.data);
        setProcessingTime(response.latency);
        setApiResult({
          data: response.data,
          error: null,
          latency: response.latency
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Summarization failed';
      setError(errorMessage);
      setApiResult({
        data: null,
        error: errorMessage,
        latency: 0
      });
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setInputText(sampleTexts[0].content);
    setResult(null);
    setError(null);
    setProcessingTime(null);
    setApiResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Summarizer API Demo</h2>
        <p className="text-muted-foreground">
          Condense long text into key points, headlines, or brief summaries using Chrome's built-in AI.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium">Summary Type</label>
          <select
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="tl-dr">TL;DR</option>
            <option value="key-points">Key Points</option>
            <option value="teaser">Teaser</option>
            <option value="headline">Headline</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Output Format</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="plain-text">Plain Text</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Summary Length</label>
          <select
            value={summaryLength}
            onChange={(e) => setSummaryLength(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      {/* Sample Texts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Sample Texts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleTexts.map((sample, index) => (
            <button
              key={index}
              onClick={() => handleSampleSelect(sample)}
              className="p-3 text-left border border-border rounded-md hover:bg-muted transition-colors"
            >
              <h4 className="text-sm font-medium">{sample.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {sample.content.substring(0, 100)}...
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Input Text</h3>
          <span className="text-xs text-muted-foreground">
            {inputText.length} characters
          </span>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter the text you want to summarize..."
          className="w-full h-32 px-3 py-2 text-sm border border-border rounded-md bg-background resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSummarize}
          disabled={isProcessing || !inputText.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" />
          {isProcessing ? 'Summarizing...' : 'Summarize Text'}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Results Section */}
      {(result || error || isProcessing) && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Output</h3>

          {isProcessing && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Processing with Chrome AI Summarizer...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Make sure you're using Chrome 136.0.7103.0+ with AI features enabled.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Summary generated successfully
                  {processingTime && ` in ${processingTime}ms`}
                </span>
              </div>

              <div className="p-4 border border-border rounded-md bg-background">
                <div className="prose prose-sm max-w-none">
                  {outputFormat === 'markdown' ? (
                    <div dangerouslySetInnerHTML={{ __html: result }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{result}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Generation Panel */}
      <CodeGenerationPanel
        apiName="summarizer"
        inputText={inputText}
        outputText={result || undefined}
        autoGenerate={!!result}
        defaultExpanded={!!result}
      />

      {/* API Information */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About the Summarizer API
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Processes text locally on your device for privacy</li>
          <li>• Supports multiple summary types: TL;DR, key points, teasers, headlines</li>
          <li>• Output formats: plain text or markdown</li>
          <li>• Configurable summary length: short, medium, or long</li>
          <li>• No internet connection required once the model is loaded</li>
        </ul>
      </div>
    </div>
  );
}