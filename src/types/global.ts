/**
 * Chrome Built-in AI API Types
 * Compatible with @types/dom-chromium-ai
 * Supports: Summarizer, Rewriter, Writer, Prompt (LanguageModel), Proofreader, Translator, Language Detection
 */

// Basic Chrome AI interfaces compatible with the built-in APIs
export interface Summarizer {
  summarize(input: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface Rewriter {
  rewrite(input: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface Writer {
  write(input: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface LanguageModel {
  prompt(input: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface Translator {
  translate(input: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

export interface LanguageDetector {
  detect(input: string): Promise<{ detectedLanguage: string; confidence: number }[]>;
  destroy(): void;
}

// Base Types (compatible with @types/dom-chromium-ai)
export type AvailabilityStatus = "readily" | "after-download" | "no";

// Legacy aliases for backward compatibility
export type AICapabilityAvailability = AvailabilityStatus;
export type AITone = "formal" | "neutral" | "casual";
export type AIFormat = "plain-text" | "markdown";
export type AILength = "short" | "medium" | "long";

// Service wrapper types for LearnSphere AI
export interface AICapabilities {
  summarizer: AvailabilityStatus;
  rewriter: AvailabilityStatus;
  writer: AvailabilityStatus;
  languageModel: AvailabilityStatus;
  proofreader: AvailabilityStatus;
  translator: AvailabilityStatus;
  languageDetector: AvailabilityStatus;
  overall: boolean;
}

export interface AIServiceError {
  code: AIErrorCode;
  message: string;
  apiName?: string;
  originalError?: unknown;
}

export enum AIErrorCode {
  API_UNAVAILABLE = "API_UNAVAILABLE",
  MODEL_NOT_READY = "MODEL_NOT_READY",
  RATE_LIMITED = "RATE_LIMITED",
  CONTENT_TOO_LONG = "CONTENT_TOO_LONG",
  PROCESSING_ERROR = "PROCESSING_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Common error handling for all APIs
export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public apiName?: string,
  ) {
    super(message);
    this.name = "AIError";
  }
}

// API Detection Helpers (updated for Canary 136.0.7103.0+ new entry points)
// APIs are now directly on self.* instead of self.ai.*
export function isSummarizerSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { Summarizer?: unknown }).Summarizer !== "undefined";
}

export function isRewriterSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { Rewriter?: unknown }).Rewriter !== "undefined";
}

export function isWriterSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { Writer?: unknown }).Writer !== "undefined";
}

export function isLanguageModelSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { LanguageModel?: unknown }).LanguageModel !== "undefined";
}

export function isProofreaderSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { Proofreader?: unknown }).Proofreader !== "undefined";
}

export function isTranslatorSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { Translator?: unknown }).Translator !== "undefined";
}

export function isLanguageDetectorSupported(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as unknown as { LanguageDetector?: unknown }).LanguageDetector !== "undefined";
}

export function isChromeAISupported(): boolean {
  // Check if any of the new Chrome AI APIs are available
  return (
    isSummarizerSupported() ||
    isRewriterSupported() ||
    isWriterSupported() ||
    isLanguageModelSupported() ||
    isProofreaderSupported() ||
    isTranslatorSupported() ||
    isLanguageDetectorSupported()
  );
}

export function getAllSupportedAPIs(): string[] {
  const supported: string[] = [];
  if (isSummarizerSupported()) supported.push("Summarizer");
  if (isRewriterSupported()) supported.push("Rewriter");
  if (isWriterSupported()) supported.push("Writer");
  if (isLanguageModelSupported()) supported.push("LanguageModel");
  if (isProofreaderSupported()) supported.push("Proofreader");
  if (isTranslatorSupported()) supported.push("Translator");
  if (isLanguageDetectorSupported()) supported.push("LanguageDetector");
  return supported;
}

// Type Guards
export function isAIServiceError(error: unknown): error is AIServiceError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    typeof (error as { message: unknown }).message === "string"
  );
}
