/**
 * Multimodal Types
 * Type definitions for image, audio, and multimodal input handling
 */

export type MediaType = 'image' | 'audio' | 'text';
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';
export type AudioFormat = 'wav' | 'mp3' | 'webm' | 'ogg';

export interface FileUploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error: string | null;
}

export interface AudioRecordingState {
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
  duration: number;
  error: string | null;
  isSupported: boolean;
}

export interface MediaFile {
  id: string;
  type: MediaType;
  name: string;
  size: number;
  mimeType: string;
  data: string | Blob; // base64 string for images, Blob for audio
  preview?: string; // URL for preview
  timestamp: number;
}

export interface ImageInputData {
  file: File;
  preview: string;
  base64: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface AudioInputData {
  blob: Blob;
  url: string;
  duration: number;
  mimeType: string;
}

export interface MultimodalPromptInput {
  text: string;
  image?: ImageInputData;
  audio?: AudioInputData;
  context?: string;
}

export interface DragDropState {
  isDragOver: boolean;
  isDragActive: boolean;
  error: string | null;
}

// File validation constraints
export interface FileConstraints {
  maxSize: number; // in bytes
  allowedFormats: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
  maxDuration?: number; // in seconds for audio
}

// Default constraints
export const DEFAULT_IMAGE_CONSTRAINTS: FileConstraints = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxDimensions: {
    width: 4096,
    height: 4096
  }
};

export const DEFAULT_AUDIO_CONSTRAINTS: FileConstraints = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
  maxDuration: 300 // 5 minutes
};

// Error types
export enum MultimodalErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  RECORDING_FAILED = 'RECORDING_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DEVICE_NOT_SUPPORTED = 'DEVICE_NOT_SUPPORTED',
  INVALID_DIMENSIONS = 'INVALID_DIMENSIONS',
  DURATION_TOO_LONG = 'DURATION_TOO_LONG'
}

export interface MultimodalError {
  type: MultimodalErrorType;
  message: string;
  details?: any;
}