/**
 * useFileUpload Hook
 *
 * Hook for handling file uploads with drag-and-drop support and image processing.
 *
 * @module prompt/hooks/useFileUpload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MultimodalHandler } from '../services/MultimodalHandler';
import type {
  ImageData,
  UploadedFile,
  FileValidationResult,
  FileUploadConstraints,
  ImageProcessingOptions,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface UseFileUploadOptions {
  /** File upload constraints */
  constraints?: Partial<FileUploadConstraints>;

  /** Image processing options */
  processingOptions?: Partial<ImageProcessingOptions>;

  /** Maximum number of files */
  maxFiles?: number;

  /** Callback when files are added */
  onFilesAdded?: (files: ImageData[]) => void;

  /** Callback when file is removed */
  onFileRemoved?: (fileId: string) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  // State
  files: ImageData[];
  uploadedFiles: UploadedFile[];
  isDragOver: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: number;

  // File counts
  fileCount: number;
  maxFiles: number;
  canAddMore: boolean;

  // Actions
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  validateFile: (file: File) => FileValidationResult;

  // Drag and Drop
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // Input
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useFileUpload - Handle file uploads and image processing
 *
 * Provides file upload functionality with drag-and-drop support,
 * validation, and image processing.
 */
export function useFileUpload(
  options: UseFileUploadOptions = {},
): UseFileUploadReturn {
  const {
    constraints,
    processingOptions,
    maxFiles: maxFilesOption = 5,
    onFilesAdded,
    onFileRemoved,
    onError,
  } = options;

  // Multimodal handler
  const handlerRef = useRef<MultimodalHandler | null>(null);

  // Initialize handler
  if (!handlerRef.current) {
    handlerRef.current = new MultimodalHandler(constraints, processingOptions);
  }

  // State
  const [files, setFiles] = useState<ImageData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Derived state
  const fileCount = files.length;
  const maxFiles = maxFilesOption;
  const canAddMore = fileCount < maxFiles;

  // Drag counter for nested drag events
  const dragCounterRef = useRef(0);

  // ============================================================================
  // File Processing
  // ============================================================================

  /**
   * Process and add files
   */
  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const handler = handlerRef.current!;
      const filesToProcess = Array.from(fileList);

      // Check if we can add more files
      const remainingSlots = maxFiles - fileCount;
      if (remainingSlots <= 0) {
        const errorMsg = `Maximum ${maxFiles} files allowed`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Limit files to remaining slots
      const filesToAdd = filesToProcess.slice(0, remainingSlots);

      try {
        setIsProcessing(true);
        setError(null);

        const processedFiles: ImageData[] = [];
        const tempUploadedFiles: UploadedFile[] = [];

        for (let i = 0; i < filesToAdd.length; i++) {
          const file = filesToAdd[i];
          if (!file) continue;

          try {
            // Update progress
            setProgress(((i + 1) / filesToAdd.length) * 100);

            // Validate file
            const validation = handler.validateFile(file);
            if (!validation.valid) {
              const uploadedFile: UploadedFile = {
                id: `${Date.now()}-${i}`,
                file,
                status: 'error',
                progress: 0,
                previewUrl: '',
                error: validation.error,
                uploadedAt: new Date(),
              };
              tempUploadedFiles.push(uploadedFile);
              continue;
            }

            // Process image
            const imageData = await handler.processImage(file);
            processedFiles.push(imageData);

            const uploadedFile: UploadedFile = {
              id: imageData.id,
              file,
              status: 'complete',
              progress: 100,
              previewUrl: imageData.dataUrl,
              imageData,
              uploadedAt: new Date(),
            };
            tempUploadedFiles.push(uploadedFile);
          } catch (err) {
            const uploadedFile: UploadedFile = {
              id: `${Date.now()}-${i}`,
              file,
              status: 'error',
              progress: 0,
              previewUrl: '',
              error: err instanceof Error ? err.message : 'Processing failed',
              uploadedAt: new Date(),
            };
            tempUploadedFiles.push(uploadedFile);
          }
        }

        // Update state
        setFiles((prev) => [...prev, ...processedFiles]);
        setUploadedFiles((prev) => [...prev, ...tempUploadedFiles]);

        // Callback
        if (processedFiles.length > 0) {
          onFilesAdded?.(processedFiles);
        }

        // Show errors if any
        const failedFiles = tempUploadedFiles.filter(
          (f) => f.status === 'error',
        );
        if (failedFiles.length > 0) {
          const errorMsg = `${failedFiles.length} file(s) failed to process`;
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [fileCount, maxFiles, onFilesAdded, onError],
  );

  /**
   * Remove a file
   */
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.id !== fileId);

        // Cleanup blob URL
        const removedFile = prev.find((f) => f.id === fileId);
        if (removedFile && handlerRef.current) {
          handlerRef.current.cleanup(removedFile);
        }

        return filtered;
      });

      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

      onFileRemoved?.(fileId);
      setError(null);
    },
    [onFileRemoved],
  );

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    // Cleanup all blob URLs
    if (handlerRef.current) {
      files.forEach((file) => handlerRef.current!.cleanup(file));
    }

    setFiles([]);
    setUploadedFiles([]);
    setError(null);
  }, [files]);

  /**
   * Validate a file without processing
   */
  const validateFile = useCallback((file: File): FileValidationResult => {
    if (!handlerRef.current) {
      return {
        valid: false,
        error: 'Handler not initialized',
        details: {
          sizeValid: false,
          typeValid: false,
          formatValid: false,
          dimensionValid: false,
        },
      };
    }

    return handlerRef.current.validateFile(file);
  }, []);

  // ============================================================================
  // Drag and Drop Handlers
  // ============================================================================

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current++;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(false);
      dragCounterRef.current = 0;

      const { files: droppedFiles } = e.dataTransfer;

      if (droppedFiles && droppedFiles.length > 0) {
        await addFiles(droppedFiles);
      }
    },
    [addFiles],
  );

  // ============================================================================
  // Input Handler
  // ============================================================================

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target;

      if (selectedFiles && selectedFiles.length > 0) {
        await addFiles(selectedFiles);
      }

      // Reset input
      e.target.value = '';
    },
    [addFiles],
  );

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Cleanup blob URLs on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      // Cleanup all blob URLs when component unmounts
      if (handlerRef.current && files.length > 0) {
        files.forEach((file) => {
          handlerRef.current!.cleanup(file);
        });
      }
    };
  }, [files]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    files,
    uploadedFiles,
    isDragOver,
    isProcessing,
    error,
    progress,

    // File counts
    fileCount,
    maxFiles,
    canAddMore,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    validateFile,

    // Drag and Drop
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,

    // Input
    handleFileInputChange,
  };
}

export default useFileUpload;
