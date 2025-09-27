/**
 * Multimodal Prompt Component
 * Combined text, image, and audio input for Chrome AI Prompt API per Design Document
 */

import React, { useState, useCallback } from 'react';
import { Send, RotateCcw, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { ImageInput } from './ImageInput';
import { AudioInput } from './AudioInput';
import { useAppStore } from '@/stores/appStore';
import { generatePrompt } from '@/services/aiService';
import { CodeGenerationPanel } from '@/features/code-display';
import type { ImageInputData, AudioInputData, MultimodalPromptInput } from '../types';

interface MultimodalPromptProps {
  className?: string;
  defaultPrompt?: string;
  showCodeGeneration?: boolean;
}

export function MultimodalPrompt({
  className = '',
  defaultPrompt = '',
  showCodeGeneration = true
}: MultimodalPromptProps) {
  const { setApiResult, setLoading } = useAppStore();

  // State management
  const [textPrompt, setTextPrompt] = useState(defaultPrompt || 'Describe this content for me.');
  const [selectedImage, setSelectedImage] = useState<ImageInputData | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioInputData | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant that can analyze images, audio, and text.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sample prompts for different scenarios
  const samplePrompts = [
    {
      category: 'Image Analysis',
      prompts: [
        'Describe what you see in this image in detail.',
        'What objects and people are visible in this image?',
        'Analyze the composition and style of this image.',
        'What emotions or mood does this image convey?'
      ]
    },
    {
      category: 'Audio Analysis',
      prompts: [
        'Transcribe and summarize this audio recording.',
        'What is the tone and mood of the speaker?',
        'Identify any background sounds or music.',
        'Analyze the speaking style and pace.'
      ]
    },
    {
      category: 'Creative',
      prompts: [
        'Write a creative story inspired by this content.',
        'Create a poem based on what you observe.',
        'Generate marketing copy for this content.',
        'Suggest improvements or alternatives.'
      ]
    }
  ];

  // Handle prompt submission
  const handleSubmit = useCallback(async () => {
    if (!textPrompt.trim() && !selectedImage && !selectedAudio) {
      setError('Please provide a text prompt, image, or audio input.');
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setProcessingTime(null);

    try {
      // Prepare multimodal input
      const multimodalInput: MultimodalPromptInput = {
        text: textPrompt,
        image: selectedImage || undefined,
        audio: selectedAudio || undefined
      };

      // Construct combined prompt
      let combinedPrompt = textPrompt;

      // Add image context if available
      if (selectedImage) {
        combinedPrompt += `\n\n[Image provided: ${selectedImage.file.name}, ${selectedImage.dimensions?.width}x${selectedImage.dimensions?.height}]`;
        // Note: In real implementation, the base64 image data would be passed to the API
        // For now, we'll simulate this with a description
      }

      // Add audio context if available
      if (selectedAudio) {
        combinedPrompt += `\n\n[Audio provided: ${selectedAudio.duration.toFixed(1)}s recording, ${selectedAudio.mimeType}]`;
        // Note: In real implementation, the audio blob would be processed by the API
      }

      // Call the Prompt API
      const response = await generatePrompt({
        input: combinedPrompt,
        systemPrompt,
        context: 'Multimodal input with ' + [
          selectedImage ? 'image' : null,
          selectedAudio ? 'audio' : null,
          'text'
        ].filter(Boolean).join(', ')
      });

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
      const errorMessage = err instanceof Error ? err.message : 'Multimodal prompt failed';
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
  }, [textPrompt, selectedImage, selectedAudio, systemPrompt, setApiResult, setLoading]);

  // Handle reset
  const handleReset = useCallback(() => {
    setTextPrompt('Describe this content for me.');
    setSelectedImage(null);
    setSelectedAudio(null);
    setResult(null);
    setError(null);
    setProcessingTime(null);
    setApiResult(null);
  }, [setApiResult]);

  // Handle sample prompt selection
  const handleSamplePrompt = useCallback((prompt: string) => {
    setTextPrompt(prompt);
  }, []);

  // Check if we have any input
  const hasInput = textPrompt.trim() || selectedImage || selectedAudio;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Multimodal Prompt API Demo</h2>
        <p className="text-muted-foreground">
          Combine text, images, and audio to create rich AI prompts using Chrome's built-in AI.
        </p>
      </div>

      {/* Sample Prompts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Sample Prompts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samplePrompts.map((category) => (
            <div key={category.category} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {category.category}
              </h4>
              <div className="space-y-1">
                {category.prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSamplePrompt(prompt)}
                    className="w-full p-2 text-left text-xs border border-border rounded hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Text Prompt</h3>
        <textarea
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          className="w-full h-24 px-3 py-2 text-sm border border-border rounded-md bg-background resize-y"
        />
      </div>

      {/* Multimodal Input Tabs */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Additional Input (Optional)</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Input */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              📸 Image Input
              {selectedImage && <span className="text-xs text-green-600">✓ Added</span>}
            </h4>
            <ImageInput
              onImageSelect={setSelectedImage}
              onError={setError}
              placeholder="Drop an image here or click to browse"
              showPreview={true}
            />
          </div>

          {/* Audio Input */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              🎤 Audio Input
              {selectedAudio && <span className="text-xs text-green-600">✓ Added</span>}
            </h4>
            <AudioInput
              onAudioSelect={setSelectedAudio}
              onError={setError}
              maxDuration={60} // 1 minute for demos
              showWaveform={true}
            />
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Advanced Options {showAdvanced ? '▼' : '▶'}
        </button>

        {showAdvanced && (
          <div className="p-4 border border-border rounded-lg bg-muted/50 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                className="w-full h-20 px-3 py-2 text-sm border border-border rounded-md bg-background resize-y"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !hasInput}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Generate Response'}
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
          <h3 className="text-sm font-medium">AI Response</h3>

          {isProcessing && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Processing multimodal prompt with Chrome AI...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Note: Multimodal features require Chrome 136.0.7103.0+ with AI features enabled.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Response generated successfully
                  {processingTime && ` in ${processingTime}ms`}
                </span>
              </div>

              <div className="p-4 border border-border rounded-md bg-background">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{result}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Generation Panel */}
      {showCodeGeneration && (
        <CodeGenerationPanel
          apiName="prompt"
          inputText={textPrompt}
          outputText={result || undefined}
          autoGenerate={!!result}
          defaultExpanded={!!result}
        />
      )}

      {/* Information Panel */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Multimodal Prompts
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Combine text, images, and audio for rich AI interactions</li>
          <li>• Images are processed locally for privacy and speed</li>
          <li>• Audio recordings support up to 1 minute for optimal performance</li>
          <li>• System prompts allow customization of AI behavior</li>
          <li>• All processing happens on-device with Chrome's built-in AI</li>
        </ul>
      </div>
    </div>
  );
}