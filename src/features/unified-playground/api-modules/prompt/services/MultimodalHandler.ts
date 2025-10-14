/**
 * Multimodal Handler
 *
 * Handles file uploads, validation, image processing, and multimodal content
 * preparation for the Prompt API.
 *
 * @module prompt/services/MultimodalHandler
 */

import type {
  ImageData,
  ImageMetadata,
  ImageProcessingOptions,
  FileValidationResult,
  FileUploadConstraints,
  SupportedFileType,
  ImageFormat,
  FileUploadError,
  FileUploadErrorType,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONSTRAINTS: FileUploadConstraints = {
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 100, // 100 bytes
  supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxDimensions: {
    width: 4096,
    height: 4096,
  },
  minDimensions: {
    width: 16,
    height: 16,
  },
  maxFiles: 5,
};

const DEFAULT_PROCESSING: ImageProcessingOptions = {
  quality: 'high',
  generateThumbnail: true,
  thumbnailSize: {
    width: 200,
    height: 200,
  },
  optimize: true,
  preserveMetadata: false,
};

// ============================================================================
// MultimodalHandler Class
// ============================================================================

/**
 * MultimodalHandler - File upload and image processing
 *
 * Responsibilities:
 * - File validation
 * - Image processing and optimization
 * - Thumbnail generation
 * - Format conversion
 * - Error handling
 */
export class MultimodalHandler {
  private constraints: FileUploadConstraints;
  private processingOptions: ImageProcessingOptions;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    config?:
      | Partial<FileUploadConstraints>
      | {
          maxFileSize?: number;
          allowedTypes?: SupportedFileType[];
          maxFiles?: number;
          processingOptions?: Partial<ImageProcessingOptions>;
        },
    legacyProcessingOptions?: Partial<ImageProcessingOptions>,
  ) {
    // Support both new flat config and legacy separate params
    if (
      config &&
      ('maxFileSize' in config ||
        'allowedTypes' in config ||
        'processingOptions' in config)
    ) {
      // New flat config format
      const flatConfig = config as {
        maxFileSize?: number;
        allowedTypes?: SupportedFileType[];
        maxFiles?: number;
        processingOptions?: Partial<ImageProcessingOptions>;
      };

      this.constraints = {
        ...DEFAULT_CONSTRAINTS,
        ...(flatConfig.maxFileSize !== undefined && {
          maxSize: flatConfig.maxFileSize,
        }),
        ...(flatConfig.allowedTypes && {
          supportedTypes: flatConfig.allowedTypes,
        }),
        ...(flatConfig.maxFiles !== undefined && {
          maxFiles: flatConfig.maxFiles,
        }),
      };

      this.processingOptions = {
        ...DEFAULT_PROCESSING,
        ...flatConfig.processingOptions,
      };
    } else {
      // Legacy format: (constraints, processingOptions)
      this.constraints = {
        ...DEFAULT_CONSTRAINTS,
        ...(config as Partial<FileUploadConstraints>),
      };
      this.processingOptions = {
        ...DEFAULT_PROCESSING,
        ...legacyProcessingOptions,
      };
    }
  }

  // ============================================================================
  // File Validation
  // ============================================================================

  /**
   * Validate a file
   * @param file - File to validate
   * @returns Validation result
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    // Check file size
    const sizeValid = this.validateFileSize(file);
    if (!sizeValid.valid) {
      errors.push(sizeValid.error!);
    }

    // Check file type
    const typeValid = this.validateFileType(file);
    if (!typeValid.valid) {
      errors.push(typeValid.error!);
    }

    // Format validation (basic)
    const formatValid = this.isValidFormat(file);
    if (!formatValid) {
      errors.push('File format is invalid or corrupted');
    }

    const allValid = errors.length === 0;

    return {
      valid: allValid,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      details: {
        sizeValid: sizeValid.valid,
        typeValid: typeValid.valid,
        formatValid,
        dimensionValid: true, // Will be checked during processing
      },
    };
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: File): { valid: boolean; error?: string } {
    if (file.size === 0 || file.size < this.constraints.minSize) {
      return {
        valid: false,
        error: `File ${file.name} is empty or too small (minimum ${this.formatBytes(this.constraints.minSize)})`,
      };
    }

    if (file.size > this.constraints.maxSize) {
      return {
        valid: false,
        error: `File ${file.name} exceeds maximum size of ${this.formatBytes(this.constraints.maxSize)}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate file type
   */
  private validateFileType(file: File): { valid: boolean; error?: string } {
    if (
      !this.constraints.supportedTypes.includes(file.type as SupportedFileType)
    ) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported (${file.name}). Supported types: ${this.constraints.supportedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Basic format validation
   */
  private isValidFormat(file: File): boolean {
    // If file has no extension, validate by MIME type
    if (file.name.indexOf('.') === -1) {
      return this.constraints.supportedTypes.includes(
        file.type as SupportedFileType,
      );
    }
    // Basic check - proper validation happens during image loading
    return file.name.match(/\.(jpe?g|png|webp|gif)$/i) !== null;
  }

  // ============================================================================
  // Image Processing
  // ============================================================================

  /**
   * Process an image file
   * @param file - Image file to process
   * @returns Promise resolving to image data
   */
  async processImage(file: File): Promise<ImageData> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw this.createError('INVALID_FORMAT', validation.error!, file.name);
    }

    // Load image
    const img = await this.loadImage(file);

    // Validate dimensions
    if (!this.validateDimensions(img.width, img.height)) {
      throw this.createError(
        'INVALID_DIMENSIONS',
        `Image dimensions ${img.width}x${img.height} are outside allowed range`,
        file.name,
      );
    }

    // Create data URL
    const dataUrl = await this.createDataURL(file);

    // Create blob URL
    const blobUrl = URL.createObjectURL(file);

    // Generate thumbnail if requested
    let thumbnailUrl: string | undefined;
    if (this.processingOptions.generateThumbnail) {
      thumbnailUrl = await this.generateThumbnail(img, file.type);
    }

    // Create metadata
    const metadata: ImageMetadata = {
      fileName: file.name,
      originalSize: file.size,
      currentSize: file.size,
      compressionRatio: 1.0,
      createdAt: new Date(file.lastModified),
      modifiedAt: new Date(file.lastModified),
      aspectRatio: img.width / img.height,
    };

    const imageData: ImageData = {
      id: this.generateId(),
      file,
      dataUrl,
      blobUrl,
      dimensions: {
        width: img.width,
        height: img.height,
      },
      size: file.size,
      mimeType: file.type as SupportedFileType,
      format: this.getImageFormat(file.type),
      optimized: false,
      thumbnailUrl,
      metadata,
    };

    // Optimize if requested
    if (this.processingOptions.optimize) {
      return await this.optimizeImage(imageData);
    }

    return imageData;
  }

  /**
   * Optimize image
   */
  private async optimizeImage(imageData: ImageData): Promise<ImageData> {
    try {
      const img = await this.loadImageFromDataURL(imageData.dataUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return imageData; // Return original if optimization fails
      }

      // Determine target dimensions
      let width = img.width;
      let height = img.height;
      let needsResize = false;

      const maxWidth =
        this.processingOptions.maxWidth ||
        this.processingOptions.maxDimensions?.width;
      const maxHeight =
        this.processingOptions.maxHeight ||
        this.processingOptions.maxDimensions?.height;

      if (maxWidth || maxHeight) {
        const scale = Math.min(
          maxWidth ? maxWidth / width : 1,
          maxHeight ? maxHeight / height : 1,
          1, // Don't upscale
        );

        if (scale < 1) {
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          needsResize = true;
        }
      }

      // Skip optimization if no actual processing will occur:
      // - No resizing needed (image already within max dimensions)
      // - No format conversion requested
      // - No explicit quality settings (different from default)
      // - Image is already small (<100KB, likely already optimized)
      const hasFormatConversion =
        this.processingOptions.outputFormat !== undefined;
      const hasExplicitQuality =
        this.processingOptions.quality !== DEFAULT_PROCESSING.quality;

      // Only run optimization if actual processing is needed or explicitly requested
      if (
        !needsResize &&
        !hasFormatConversion &&
        !hasExplicitQuality &&
        imageData.size < 100 * 1024
      ) {
        return imageData;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      let outputFormat = imageData.mimeType;
      if (this.processingOptions.outputFormat) {
        outputFormat =
          `image/${this.processingOptions.outputFormat}` as SupportedFileType;
      }

      // Convert to blob
      const quality = this.getQualityValue(this.processingOptions.quality);
      const blob = await this.canvasToBlob(canvas, outputFormat, quality);

      // Create new data URL
      const dataUrl = await this.blobToDataURL(blob);

      // Update metadata
      const compressionRatio = blob.size / imageData.size;

      return {
        ...imageData,
        dataUrl,
        dimensions: { width, height },
        size: blob.size,
        format: this.getImageFormat(outputFormat),
        mimeType: outputFormat,
        optimized: true,
        metadata: {
          ...imageData.metadata,
          currentSize: blob.size,
          compressionRatio,
        },
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return imageData; // Return original on error
    }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(
    img: HTMLImageElement,
    mimeType: string,
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    const thumbSize = this.processingOptions.thumbnailSize || {
      width: 200,
      height: 200,
    };

    // Calculate dimensions maintaining aspect ratio
    const scale = Math.min(
      thumbSize.width / img.width,
      thumbSize.height / img.height,
    );

    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    canvas.width = width;
    canvas.height = height;

    // Draw thumbnail
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to data URL
    return canvas.toDataURL(mimeType, 0.7);
  }

  // ============================================================================
  // File Loading
  // ============================================================================

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
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
   * Load image from data URL
   */
  private loadImageFromDataURL(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('Failed to load image from data URL'));

      img.src = dataUrl;
    });
  }

  /**
   * Create data URL from file
   */
  private createDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));

      reader.readAsDataURL(file);
    });
  }

  // ============================================================================
  // Canvas/Blob Utilities
  // ============================================================================

  /**
   * Convert canvas to blob
   */
  private canvasToBlob(
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
   * Convert blob to data URL
   */
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read blob'));
        }
      };

      reader.onerror = () => reject(new Error('Blob reading failed'));

      reader.readAsDataURL(blob);
    });
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  /**
   * Validate image dimensions
   */
  private validateDimensions(width: number, height: number): boolean {
    return (
      width >= this.constraints.minDimensions.width &&
      height >= this.constraints.minDimensions.height &&
      width <= this.constraints.maxDimensions.width &&
      height <= this.constraints.maxDimensions.height
    );
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Get image format from MIME type
   */
  private getImageFormat(mimeType: string): ImageFormat {
    const formatMap: Record<string, ImageFormat> = {
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    return formatMap[mimeType] || 'jpeg';
  }

  /**
   * Get quality value from quality setting
   */
  private getQualityValue(quality: string): number {
    const qualityMap: Record<string, number> = {
      low: 0.5,
      medium: 0.7,
      high: 0.9,
      original: 1.0,
    };

    return qualityMap[quality] || 0.9;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create structured error
   */
  private createError(
    type: FileUploadErrorType,
    message: string,
    fileName: string,
  ): FileUploadError {
    // Include filename in the error message
    const fullMessage = `${message} (${fileName})`;

    const errorObj: FileUploadError = {
      type,
      message: fullMessage,
      fileName,
      recoverable: type !== 'PROCESSING_FAILED',
      suggestion: this.getErrorSuggestion(type),
    };

    const error = new Error(fullMessage) as any;
    error.uploadError = errorObj;
    return error;
  }

  /**
   * Get error suggestion
   */
  private getErrorSuggestion(type: FileUploadErrorType): string {
    const suggestions: Record<FileUploadErrorType, string> = {
      FILE_TOO_LARGE: 'Please choose a smaller file or compress the image',
      FILE_TOO_SMALL: 'Please choose a valid image file',
      UNSUPPORTED_TYPE: 'Please use JPEG, PNG, WebP, or GIF format',
      INVALID_FORMAT: 'The file may be corrupted. Please try another file',
      INVALID_DIMENSIONS:
        'Image dimensions are outside the allowed range. Please resize the image',
      TOO_MANY_FILES: `Maximum ${this.constraints.maxFiles} files allowed`,
      PROCESSING_FAILED: 'An error occurred while processing the image',
      UPLOAD_FAILED: 'Upload failed. Please try again',
    };

    return suggestions[type] || 'Please try again';
  }

  // ============================================================================
  // Public Utilities
  // ============================================================================

  /**
   * Get current constraints
   */
  getConstraints(): FileUploadConstraints {
    return { ...this.constraints };
  }

  /**
   * Update constraints
   */
  updateConstraints(constraints: Partial<FileUploadConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
  }

  /**
   * Get processing options
   */
  getProcessingOptions(): ImageProcessingOptions {
    return { ...this.processingOptions };
  }

  /**
   * Update processing options
   */
  updateProcessingOptions(options: Partial<ImageProcessingOptions>): void {
    this.processingOptions = { ...this.processingOptions, ...options };
  }

  /**
   * Clean up resources
   */
  cleanup(imageData: ImageData): void {
    if (imageData.blobUrl) {
      URL.revokeObjectURL(imageData.blobUrl);
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default MultimodalHandler;
