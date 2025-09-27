/**
 * Code Generation Hook
 * React hook for managing code generation state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { codeGenerator } from '../services/codeGenerator';
import type {
  GeneratedCode,
  CodeGenerationOptions,
  CodeLanguage
} from '../types';

interface UseCodeGenerationReturn {
  generatedCode: GeneratedCode | null;
  generatedCodes: GeneratedCode[];
  isGenerating: boolean;
  error: string | null;
  generateCode: (options: Partial<CodeGenerationOptions>) => Promise<void>;
  copyToClipboard: (codeId: string) => Promise<boolean>;
  downloadCode: (codeId: string, filename?: string) => boolean;
  clearCodes: () => void;
  refreshCodes: () => void;
}

export function useCodeGeneration(): UseCodeGenerationReturn {
  const { activeApi, codeLanguage, apiResult } = useAppStore();
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh codes list from service
  const refreshCodes = useCallback(() => {
    const codes = codeGenerator.getAllGeneratedCodes();
    setGeneratedCodes(codes);
  }, []);

  // Load initial codes
  useEffect(() => {
    refreshCodes();
  }, [refreshCodes]);

  // Generate code with options
  const generateCode = useCallback(async (options: Partial<CodeGenerationOptions>) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Prepare generation options with defaults
      const generationOptions: CodeGenerationOptions = {
        apiName: options.apiName || activeApi,
        language: options.language || (codeLanguage === 'js' ? 'javascript' : 'typescript'),
        format: options.format || 'snippet',
        inputText: options.inputText || 'Your input text here...',
        includeErrorHandling: options.includeErrorHandling ?? true,
        includeComments: options.includeComments ?? true,
        ...options
      };

      // Generate code using service
      const generated = codeGenerator.generateCode(generationOptions);

      setGeneratedCode(generated);
      refreshCodes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code generation failed';
      setError(errorMessage);
      console.error('Code generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [activeApi, codeLanguage, refreshCodes]);

  // Auto-generate code when API result changes
  useEffect(() => {
    if (apiResult && apiResult.data) {
      generateCode({
        outputText: apiResult.data as string
      });
    }
  }, [apiResult, generateCode]);

  // Copy code to clipboard
  const copyToClipboard = useCallback(async (codeId: string): Promise<boolean> => {
    try {
      const success = await codeGenerator.copyToClipboard(codeId);
      if (!success) {
        setError('Failed to copy code to clipboard');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Copy failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Download code as file
  const downloadCode = useCallback((codeId: string, filename?: string): boolean => {
    try {
      const success = codeGenerator.downloadCode(codeId, filename);
      if (!success) {
        setError('Failed to download code');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Clear all generated codes
  const clearCodes = useCallback(() => {
    codeGenerator.clearGeneratedCodes();
    setGeneratedCode(null);
    setGeneratedCodes([]);
    setError(null);
  }, []);

  return {
    generatedCode,
    generatedCodes,
    isGenerating,
    error,
    generateCode,
    copyToClipboard,
    downloadCode,
    clearCodes,
    refreshCodes
  };
}

// Hook for getting available templates
export function useCodeTemplates() {
  const [availableApis] = useState(() => codeGenerator.getAvailableApis());

  const getTemplatesForLanguage = useCallback((language: CodeLanguage) => {
    return codeGenerator.getTemplatesForLanguage(language);
  }, []);

  return {
    availableApis,
    getTemplatesForLanguage
  };
}