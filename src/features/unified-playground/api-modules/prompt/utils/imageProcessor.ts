/**
 * Image Processor Utilities
 *
 * Utility functions for image processing, optimization, and manipulation
 *
 * @module prompt/utils/imageProcessor
 */

import type {
  ImageFormat,
  ImageDimensionsResult,
  CompressionStatistics,
  FormattedFileSize,
} from '../types';

// ============================================================================
// Image Dimension Utilities
// ============================================================================

/**
 * Get image dimensions from a file
 * @param file - Image file
 * @returns Promise resolving to dimensions
 */
export async function getImageDimensions(
  file: File,
): Promise<ImageDimensionsResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      let orientation: 'portrait' | 'landscape' | 'square';

      if (aspectRatio > 1) {
        orientation = 'landscape';
      } else if (aspectRatio < 1) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }

      URL.revokeObjectURL(url);

      resolve({
        width,
        height,
        aspectRatio,
        orientation,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate aspect ratio
 * @param width - Image width
 * @param height - Image height
 * @returns Aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate dimensions for target aspect ratio
 * @param currentWidth - Current width
 * @param currentHeight - Current height
 * @param targetAspectRatio - Target aspect ratio
 * @returns New dimensions
 */
export function calculateDimensionsForAspectRatio(
  currentWidth: number,
  currentHeight: number,
  targetAspectRatio: number,
): { width: number; height: number } {
  const currentAspectRatio = currentWidth / currentHeight;

  if (currentAspectRatio > targetAspectRatio) {
    // Too wide - adjust width
    return {
      width: Math.round(currentHeight * targetAspectRatio),
      height: currentHeight,
    };
  } else {
    // Too tall - adjust height
    return {
      width: currentWidth,
      height: Math.round(currentWidth / targetAspectRatio),
    };
  }
}

/**
 * Calculate dimensions to fit within max dimensions while maintaining aspect ratio
 * @param width - Current width
 * @param height - Current height
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Fitted dimensions
 */
export function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

// ============================================================================
// Image Compression Utilities
// ============================================================================

/**
 * Compress image
 * @param file - Image file
 * @param quality - Quality (0-1)
 * @param maxDimensions - Optional max dimensions
 * @returns Promise resolving to compressed blob and statistics
 */
export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxDimensions?: { width: number; height: number },
): Promise<{
  blob: Blob;
  statistics: CompressionStatistics;
}> {
  const startTime = Date.now();

  // Load image
  const img = await loadImageFromFile(file);

  // Calculate dimensions
  let width = img.width;
  let height = img.height;
  let resized = false;

  if (maxDimensions) {
    const fitted = fitDimensions(
      width,
      height,
      maxDimensions.width,
      maxDimensions.height,
    );
    // Check if actually resized
    resized = fitted.width !== img.width || fitted.height !== img.height;
    width = fitted.width;
    height = fitted.height;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  const blob = await canvasToBlob(canvas, file.type, quality);

  const compressionTime = Date.now() - startTime;
  const originalSize = file.size;
  const compressedSize = blob.size;
  const bytesSaved = originalSize - compressedSize;
  const ratio = compressedSize / originalSize;
  const percentageSaved = (1 - ratio) * 100;

  return {
    blob,
    statistics: {
      originalSize,
      compressedSize,
      bytesSaved,
      spaceSaved: bytesSaved, // Alias
      ratio,
      compressionRatio: ratio, // Alias
      percentageSaved,
      spaceSavedPercentage: percentageSaved, // Alias
      compressionTime,
      resized,
    },
  };
}

/**
 * Calculate compression statistics
 * @param originalSize - Original file size
 * @param compressedSize - Compressed file size
 * @param compressionTime - Time taken to compress
 * @returns Compression statistics
 */
export function calculateCompressionStatistics(
  originalSize: number,
  compressedSize: number,
  compressionTime: number,
): CompressionStatistics {
  const bytesSaved = originalSize - compressedSize;
  const ratio = compressedSize / originalSize;
  const percentageSaved = (1 - ratio) * 100;

  return {
    originalSize,
    compressedSize,
    bytesSaved,
    spaceSaved: bytesSaved, // Alias
    ratio,
    compressionRatio: ratio, // Alias
    percentageSaved,
    spaceSavedPercentage: percentageSaved, // Alias
    compressionTime,
  };
}

// ============================================================================
// Image Format Conversion
// ============================================================================

/**
 * Convert image to different format
 * @param file - Source image file
 * @param targetFormat - Target format
 * @param quality - Quality (0-1)
 * @returns Promise resolving to converted blob
 */
export async function convertImageFormat(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.9,
): Promise<Blob> {
  const img = await loadImageFromFile(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  ctx.drawImage(img, 0, 0);

  const mimeType = formatToMimeType(targetFormat);
  return await canvasToBlob(canvas, mimeType, quality);
}

/**
 * Get image format from MIME type
 * @param mimeType - MIME type
 * @returns Image format
 */
export function mimeTypeToFormat(mimeType: string): ImageFormat {
  const formatMap: Record<string, ImageFormat> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return formatMap[mimeType] || 'jpeg';
}

/**
 * Get MIME type from image format
 * @param format - Image format
 * @returns MIME type
 */
export function formatToMimeType(format: ImageFormat): string {
  const mimeTypeMap: Record<ImageFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  return mimeTypeMap[format] || 'image/jpeg';
}

// ============================================================================
// File Size Utilities
// ============================================================================

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size
 */
export function formatFileSize(
  bytes: number,
  decimals: number = 2,
): FormattedFileSize {
  // Handle invalid inputs
  if (bytes <= 0 || !isFinite(bytes) || isNaN(bytes)) {
    return {
      value: 0,
      unit: 'bytes',
      formatted: '0 Bytes',
    };
  }

  const k = 1024;
  const sizes: Array<'bytes' | 'KB' | 'MB' | 'GB'> = [
    'bytes',
    'KB',
    'MB',
    'GB',
  ];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // For bytes, round to integer
  if (i === 0) {
    const value = Math.round(bytes);
    return {
      value,
      unit: 'bytes',
      formatted: `${value} bytes`,
    };
  }

  // For larger units, format with decimal places
  const value = bytes / Math.pow(k, i);
  const unit = sizes[i] ?? 'bytes';
  const formattedValue = value.toFixed(decimals);

  return {
    value: parseFloat(formattedValue),
    unit,
    formatted: `${formattedValue} ${unit}`,
  };
}

/**
 * Parse file size string to bytes
 * @param sizeString - Size string (e.g., "10MB", "5.5 GB")
 * @returns Size in bytes
 */
export function parseFileSize(sizeString: string): number {
  const match = sizeString.match(/^([\d.]+)\s*(bytes?|kb|mb|gb)$/i);

  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid file size format');
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    byte: 1,
    bytes: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
}

// ============================================================================
// Canvas Utilities
// ============================================================================

/**
 * Load image from file
 * @param file - Image file
 * @returns Promise resolving to HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to blob
 * @param canvas - Canvas element
 * @param mimeType - MIME type
 * @param quality - Quality (0-1)
 * @returns Promise resolving to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Create data URL from canvas
 * @param canvas - Canvas element
 * @param mimeType - MIME type
 * @param quality - Quality (0-1)
 * @returns Data URL
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/png',
  quality: number = 0.92,
): string {
  return canvas.toDataURL(mimeType, quality);
}

// ============================================================================
// Image Analysis
// ============================================================================

/**
 * Check if image has transparency (alpha channel)
 * @param file - Image file
 * @returns Promise resolving to true if has alpha
 */
export async function hasAlphaChannel(file: File): Promise<boolean> {
  // Only PNG and WebP can have transparency
  if (file.type !== 'image/png' && file.type !== 'image/webp') {
    return false;
  }

  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return false;
  }

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Check if any pixel has alpha < 255
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i] ?? 255;
    if (alpha < 255) {
      return true;
    }
  }

  return false;
}

/**
 * Get dominant color from image
 * @param file - Image file
 * @returns Promise resolving to RGB color
 */
export async function getDominantColor(
  file: File,
): Promise<{ r: number; g: number; b: number }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');

  // Sample a scaled down version for performance
  const sampleSize = 50;
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imageData.data;

  let r = 0,
    g = 0,
    b = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i] ?? 0;
    g += data[i + 1] ?? 0;
    b += data[i + 2] ?? 0;
  }

  return {
    r: Math.round(r / pixelCount),
    g: Math.round(g / pixelCount),
    b: Math.round(b / pixelCount),
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  getImageDimensions,
  calculateAspectRatio,
  calculateDimensionsForAspectRatio,
  fitDimensions,
  compressImage,
  calculateCompressionStatistics,
  convertImageFormat,
  mimeTypeToFormat,
  formatToMimeType,
  formatFileSize,
  parseFileSize,
  loadImageFromFile,
  canvasToBlob,
  canvasToDataURL,
  hasAlphaChannel,
  getDominantColor,
};
