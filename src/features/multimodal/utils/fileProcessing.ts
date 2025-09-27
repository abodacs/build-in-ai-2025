/**
 * File Processing Utilities
 * Utilities for handling image and audio file processing
 */

import type {
  FileConstraints,
  ImageInputData,
  AudioInputData,
  MultimodalError,
  MultimodalErrorType
} from '../types';

/**
 * Validate file against constraints
 */
export function validateFile(file: File, constraints: FileConstraints): MultimodalError | null {
  // Check file size
  if (file.size > constraints.maxSize) {
    return {
      type: MultimodalErrorType.FILE_TOO_LARGE,
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(constraints.maxSize)})`,
      details: { actualSize: file.size, maxSize: constraints.maxSize }
    };
  }

  // Check file format
  if (!constraints.allowedFormats.includes(file.type)) {
    return {
      type: MultimodalErrorType.INVALID_FORMAT,
      message: `File format '${file.type}' is not supported. Allowed formats: ${constraints.allowedFormats.join(', ')}`,
      details: { actualFormat: file.type, allowedFormats: constraints.allowedFormats }
    };
  }

  return null;
}

/**
 * Process image file to base64 with dimensions
 */
export async function processImageFile(file: File, constraints?: FileConstraints): Promise<ImageInputData> {
  if (constraints) {
    const validationError = validateFile(file, constraints);
    if (validationError) {
      throw new Error(validationError.message);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      img.onload = () => {
        // Check dimensions if constraints provided
        if (constraints?.maxDimensions) {
          if (img.width > constraints.maxDimensions.width || img.height > constraints.maxDimensions.height) {
            reject(new Error(`Image dimensions (${img.width}x${img.height}) exceed maximum allowed (${constraints.maxDimensions.width}x${constraints.maxDimensions.height})`));
            return;
          }
        }

        const preview = URL.createObjectURL(file);

        resolve({
          file,
          preview,
          base64,
          dimensions: {
            width: img.width,
            height: img.height
          }
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = base64;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process audio blob with duration calculation
 */
export async function processAudioBlob(blob: Blob, mimeType: string): Promise<AudioInputData> {
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.onloadedmetadata = () => {
      resolve({
        blob,
        url,
        duration: audio.duration,
        mimeType
      });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to process audio'));
    };

    audio.src = url;
  });
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to convert file to base64'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get supported MIME types for file input
 */
export function getSupportedMimeTypes(type: 'image' | 'audio'): string {
  if (type === 'image') {
    return 'image/jpeg,image/png,image/webp,image/gif';
  } else if (type === 'audio') {
    return 'audio/wav,audio/mp3,audio/webm,audio/ogg';
  }
  return '';
}

/**
 * Format file size for human reading
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if browser supports file drag and drop
 */
export function isDragDropSupported(): boolean {
  return (
    'draggable' in document.createElement('div') &&
    'ondrop' in document.createElement('div') &&
    'FileReader' in window
  );
}

/**
 * Check if browser supports MediaRecorder API
 */
export function isMediaRecorderSupported(): boolean {
  return 'MediaRecorder' in window && 'navigator' in window && 'mediaDevices' in navigator;
}

/**
 * Get supported audio formats for recording
 */
export function getSupportedRecordingFormats(): string[] {
  if (!isMediaRecorderSupported()) return [];

  const formats = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  return formats.filter(format => MediaRecorder.isTypeSupported(format));
}

/**
 * Clean up object URLs to prevent memory leaks
 */
export function cleanupObjectUrl(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}