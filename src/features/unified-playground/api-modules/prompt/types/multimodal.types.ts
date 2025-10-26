/**
 * Multimodal File Handling Types
 *
 * Types for file uploads, image processing, and multimodal content
 *
 * @module prompt/types/multimodal.types
 */

// ============================================================================
// File Upload Types
// ============================================================================

/**
 * Supported file types for upload (images and audio)
 */
export type SupportedFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'audio/mp3'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/ogg'
  | 'audio/webm'
  | 'audio/m4a';

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Is the file valid? */
  valid: boolean;

  /** Error message if invalid */
  error?: string;

  /** Validation details */
  details: {
    /** File size validation */
    sizeValid: boolean;

    /** File type validation */
    typeValid: boolean;

    /** File format validation */
    formatValid: boolean;

    /** File dimension validation (for images) */
    dimensionValid: boolean;
  };
}

/**
 * File upload constraints
 */
export interface FileUploadConstraints {
  /** Maximum file size in bytes */
  maxSize: number;

  /** Minimum file size in bytes */
  minSize: number;

  /** Supported MIME types */
  supportedTypes: SupportedFileType[];

  /** Maximum image dimensions */
  maxDimensions: {
    width: number;
    height: number;
  };

  /** Minimum image dimensions */
  minDimensions: {
    width: number;
    height: number;
  };

  /** Maximum number of files per message */
  maxFiles: number;
}

/**
 * Default file upload constraints
 */
export const DEFAULT_FILE_CONSTRAINTS: FileUploadConstraints = {
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

// ============================================================================
// Image Processing Types
// ============================================================================

/**
 * Image format for processing
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';

/**
 * Image quality settings
 */
export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

/**
 * Image data structure
 */
export interface ImageData {
  /** Image ID */
  id: string;

  /** Original file */
  file: File;

  /** Data URL for display */
  dataUrl: string;

  /** Blob URL for processing */
  blobUrl: string;

  /** Image dimensions */
  dimensions: {
    width: number;
    height: number;
  };

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: SupportedFileType;

  /** Image format */
  format: ImageFormat;

  /** Is image optimized? */
  optimized: boolean;

  /** Thumbnail data URL */
  thumbnailUrl?: string;

  /** Image metadata */
  metadata: ImageMetadata;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  /** File name */
  fileName: string;

  /** Original file size */
  originalSize: number;

  /** Current file size */
  currentSize: number;

  /** Compression ratio (0-1) */
  compressionRatio: number;

  /** Created timestamp */
  createdAt: Date;

  /** Modified timestamp */
  modifiedAt: Date;

  /** Aspect ratio */
  aspectRatio: number;

  /** Color space (if available) */
  colorSpace?: string;

  /** Has alpha channel? */
  hasAlpha?: boolean;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  /** Target quality */
  quality: ImageQuality;

  /** Output format (if converting) */
  outputFormat?: ImageFormat;

  /** Maximum dimensions (resize if larger) */
  maxDimensions?: {
    width: number;
    height: number;
  };

  /** Maximum width */
  maxWidth?: number;

  /** Maximum height */
  maxHeight?: number;

  /** Generate thumbnail? */
  generateThumbnail: boolean;

  /** Thumbnail size */
  thumbnailSize?: {
    width: number;
    height: number;
  };

  /** Optimize file size? */
  optimize: boolean;

  /** Preserve metadata? */
  preserveMetadata: boolean;

  /** Preserve aspect ratio when resizing? */
  preserveAspectRatio?: boolean;
}

/**
 * Default image processing options
 */
export const DEFAULT_IMAGE_PROCESSING: ImageProcessingOptions = {
  quality: 'high',
  generateThumbnail: true,
  thumbnailSize: {
    width: 200,
    height: 200,
  },
  optimize: true,
  preserveMetadata: false,
};

/**
 * Image processing result
 */
export interface ImageProcessingResult {
  /** Original image data */
  original: ImageData;

  /** Processed image data */
  processed: ImageData;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Size reduction percentage */
  sizeReduction: number;

  /** Was processing successful? */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Audio Processing Types
// ============================================================================

/**
 * Audio format for processing
 */
export type AudioFormat = 'mp3' | 'mpeg' | 'wav' | 'ogg' | 'webm' | 'm4a';

/**
 * Audio data structure
 */
export interface AudioData {
  /** Audio ID */
  id: string;

  /** Original file */
  file: File;

  /** Data URL for playback */
  dataUrl: string;

  /** Blob URL for processing */
  blobUrl: string;

  /** Audio duration in seconds */
  duration?: number;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: SupportedFileType;

  /** Audio format */
  format: AudioFormat;

  /** Audio metadata */
  metadata: AudioMetadata;
}

/**
 * Audio metadata
 */
export interface AudioMetadata {
  /** File name */
  fileName: string;

  /** Original file size */
  originalSize: number;

  /** Current file size */
  currentSize: number;

  /** Created timestamp */
  createdAt: Date;

  /** Modified timestamp */
  modifiedAt: Date;

  /** Duration in seconds */
  duration?: number;

  /** Bitrate in kbps */
  bitrate?: number;

  /** Sample rate in Hz */
  sampleRate?: number;

  /** Number of audio channels */
  channels?: number;

  /** Codec used */
  codec?: string;
}

/**
 * Audio processing options
 */
export interface AudioProcessingOptions {
  /** Generate waveform preview? */
  generateWaveform: boolean;

  /** Normalize audio levels? */
  normalize: boolean;

  /** Extract metadata? */
  extractMetadata: boolean;
}

/**
 * Default audio processing options
 */
export const DEFAULT_AUDIO_PROCESSING: AudioProcessingOptions = {
  generateWaveform: true,
  normalize: false,
  extractMetadata: true,
};

/**
 * Unified media data type (images or audio)
 */
export type MediaData = ImageData | AudioData;

/**
 * Media type discriminator
 */
export type MediaType = 'image' | 'audio';

// ============================================================================
// File Upload State Types
// ============================================================================

/**
 * Upload status
 */
export type UploadStatus =
  | 'idle'
  | 'selecting'
  | 'validating'
  | 'processing'
  | 'uploading'
  | 'complete'
  | 'error';

/**
 * File upload state
 */
export interface FileUploadState {
  /** Current status */
  status: UploadStatus;

  /** Uploaded files */
  files: UploadedFile[];

  /** Upload progress (0-100) */
  progress: number;

  /** Validation errors */
  errors: string[];

  /** Is drag-over active? */
  isDragOver: boolean;

  /** Maximum files reached? */
  maxFilesReached: boolean;
}

/**
 * Uploaded file information
 */
export interface UploadedFile {
  /** File ID */
  id: string;

  /** Original file */
  file: File;

  /** Upload status */
  status: UploadStatus;

  /** Processing progress (0-100) */
  progress: number;

  /** Preview URL */
  previewUrl: string;

  /** Processed image data (if image) */
  imageData?: ImageData;

  /** Processed audio data (if audio) */
  audioData?: AudioData;

  /** Media data (unified) */
  mediaData?: MediaData;

  /** Error message if failed */
  error?: string;

  /** Upload timestamp */
  uploadedAt: Date;
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

/**
 * Drag and drop event data
 */
export interface DragDropEventData {
  /** Files from drag event */
  files: File[];

  /** Event type */
  eventType: 'dragenter' | 'dragover' | 'dragleave' | 'drop';

  /** Is valid drop target? */
  isValidTarget: boolean;

  /** Validation results for each file */
  validationResults: FileValidationResult[];
}

/**
 * Drag and drop state
 */
export interface DragDropState {
  /** Is dragging over? */
  isDragOver: boolean;

  /** Files being dragged */
  draggedFiles: File[];

  /** Is valid drop? */
  isValidDrop: boolean;

  /** Drop zone element ref */
  dropZoneRef: React.RefObject<HTMLElement> | null;
}

// ============================================================================
// Preview Types
// ============================================================================

/**
 * Image preview mode
 */
export type PreviewMode = 'thumbnail' | 'modal' | 'inline';

/**
 * Image preview state
 */
export interface ImagePreviewState {
  /** Is preview open? */
  open: boolean;

  /** Preview mode */
  mode: PreviewMode;

  /** Current image being previewed */
  currentImage: ImageData | null;

  /** All images in gallery */
  images: ImageData[];

  /** Current image index */
  currentIndex: number;

  /** Is zoomed in? */
  zoomed: boolean;

  /** Zoom level (1-5) */
  zoomLevel: number;
}

/**
 * Preview controls
 */
export interface PreviewControls {
  /** Show next image */
  next: () => void;

  /** Show previous image */
  previous: () => void;

  /** Zoom in */
  zoomIn: () => void;

  /** Zoom out */
  zoomOut: () => void;

  /** Reset zoom */
  resetZoom: () => void;

  /** Close preview */
  close: () => void;

  /** Download image */
  download: () => void;

  /** Remove image */
  remove: () => void;
}

// ============================================================================
// Multimodal Message Types
// ============================================================================

/**
 * Multimodal message content (internal representation)
 * Note: This differs from the Chrome API MultimodalContent format in api.types.ts
 */
export interface MultimodalMessageContent {
  /** Text content */
  text: string;

  /** Attached images */
  images: ImageData[];

  /** Attached audio files */
  audios: AudioData[];

  /** Has multimodal content? */
  hasMultimodal: boolean;

  /** Total content size in bytes */
  totalSize: number;

  /** Estimated token count */
  estimatedTokens: number;
}

/**
 * Multimodal prompt input
 */
export interface MultimodalPromptInput {
  /** User prompt text */
  prompt: string;

  /** Attached images */
  images: ImageData[];

  /** Attached audio files */
  audios?: AudioData[];

  /** Context from previous messages */
  context?: string;

  /** Additional options */
  options?: {
    /** Analyze images? */
    analyzeImages: boolean;

    /** Analyze audio? (transcription, etc.) */
    analyzeAudio: boolean;

    /** Extract text from images (OCR)? */
    extractText: boolean;

    /** Image analysis detail level */
    detailLevel: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * File upload error types
 */
export type FileUploadErrorType =
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SMALL'
  | 'UNSUPPORTED_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_DIMENSIONS'
  | 'TOO_MANY_FILES'
  | 'PROCESSING_FAILED'
  | 'UPLOAD_FAILED';

/**
 * Structured file upload error
 */
export interface FileUploadError {
  /** Error type */
  type: FileUploadErrorType;

  /** Error message */
  message: string;

  /** File name that caused error */
  fileName: string;

  /** Is error recoverable? */
  recoverable: boolean;

  /** Suggested action */
  suggestion: string;

  /** Additional details */
  details?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * File size formatter result
 */
export interface FormattedFileSize {
  /** Numeric value */
  value: number;

  /** Unit (bytes, KB, MB, GB) */
  unit: 'bytes' | 'KB' | 'MB' | 'GB';

  /** Formatted string (e.g., "2.5 MB") */
  formatted: string;
}

/**
 * Image dimensions result
 */
export interface ImageDimensionsResult {
  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Aspect ratio (width/height) */
  aspectRatio: number;

  /** Orientation */
  orientation: 'portrait' | 'landscape' | 'square';
}

/**
 * Compression statistics
 */
export interface CompressionStatistics {
  /** Original size in bytes */
  originalSize: number;

  /** Compressed size in bytes */
  compressedSize: number;

  /** Bytes saved */
  bytesSaved: number;

  /** Space saved (alias for bytesSaved) */
  spaceSaved: number;

  /** Compression ratio (0-1) */
  ratio: number;

  /** Compression ratio (alias for ratio) */
  compressionRatio: number;

  /** Percentage saved */
  percentageSaved: number;

  /** Space saved percentage (alias for percentageSaved) */
  spaceSavedPercentage: number;

  /** Compression time in milliseconds */
  compressionTime: number;

  /** Whether image was resized */
  resized?: boolean;
}
