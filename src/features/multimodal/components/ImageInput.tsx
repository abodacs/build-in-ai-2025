/**
 * Image Input Component
 * Drag-and-drop image input with preview and validation per Design Document Section 4.4
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { processImageFile, validateFile, formatFileSize, isDragDropSupported } from '../utils/fileProcessing';
import { DEFAULT_IMAGE_CONSTRAINTS } from '../types';
import type { ImageInputData, DragDropState, FileConstraints } from '../types';

interface ImageInputProps {
  onImageSelect: (imageData: ImageInputData | null) => void;
  onError?: (error: string) => void;
  constraints?: FileConstraints;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  placeholder?: string;
}

export function ImageInput({
  onImageSelect,
  onError,
  constraints = DEFAULT_IMAGE_CONSTRAINTS,
  disabled = false,
  className = '',
  showPreview = true,
  placeholder = 'Drop an image here or click to browse'
}: ImageInputProps) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragOver: false,
    isDragActive: false,
    error: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageInputData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragState(prev => ({
      ...prev,
      isDragOver: true,
      isDragActive: true
    }));
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only reset if leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;

    setDragState(prev => ({
      ...prev,
      isDragOver: false,
      isDragActive: false
    }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setDragState({
      isDragOver: false,
      isDragActive: false,
      error: null
    });

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file);
  }, [disabled]);

  // Process selected file
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setDragState(prev => ({ ...prev, error: null }));

    try {
      // Validate file
      const validationError = validateFile(file, constraints);
      if (validationError) {
        throw new Error(validationError.message);
      }

      // Process image
      const imageData = await processImageFile(file, constraints);
      setSelectedImage(imageData);
      onImageSelect(imageData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setDragState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [constraints, onImageSelect, onError]);

  // Handle file input change
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFile(files[0]);
  }, [processFile]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  }, [disabled, isProcessing]);

  // Handle remove image
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    onImageSelect(null);
    setDragState(prev => ({ ...prev, error: null }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect]);

  // Get container classes
  const getContainerClasses = () => {
    const baseClasses = 'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer';

    if (disabled) {
      return `${baseClasses} border-border bg-muted/50 cursor-not-allowed opacity-50`;
    }

    if (dragState.error) {
      return `${baseClasses} border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20`;
    }

    if (dragState.isDragActive) {
      return `${baseClasses} border-primary bg-primary/10`;
    }

    if (selectedImage) {
      return `${baseClasses} border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20`;
    }

    return `${baseClasses} border-border hover:border-primary hover:bg-primary/5`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={getContainerClasses()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Content */}
        <div className="p-6 text-center">
          {isProcessing ? (
            <div className="space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          ) : selectedImage && showPreview ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={selectedImage.preview}
                  alt="Selected image"
                  className="max-w-full max-h-48 rounded-md shadow-sm"
                />
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium">{selectedImage.file.name}</p>
                <p className="text-muted-foreground">
                  {formatFileSize(selectedImage.file.size)}
                  {selectedImage.dimensions && (
                    <span> • {selectedImage.dimensions.width}×{selectedImage.dimensions.height}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs">Image ready</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                {dragState.error ? (
                  <AlertCircle className="w-12 h-12 text-red-500" />
                ) : (
                  <div className={`p-3 rounded-full ${dragState.isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                    {dragState.isDragActive ? (
                      <Upload className="w-6 h-6 text-primary" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {dragState.isDragActive ? 'Drop image here' : placeholder}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dragState.error || (
                    isDragDropSupported()
                      ? `Supports: ${constraints.allowedFormats.map(f => f.split('/')[1]).join(', ').toUpperCase()}, max ${formatFileSize(constraints.maxSize)}`
                      : 'Click to select an image file'
                  )}
                </p>
              </div>

              {dragState.isDragActive && (
                <div className="text-xs text-primary font-medium">
                  Release to upload
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {dragState.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{dragState.error}</p>
        </div>
      )}

      {/* File constraints info */}
      {!selectedImage && !dragState.error && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Maximum file size: {formatFileSize(constraints.maxSize)}</p>
          <p>• Supported formats: {constraints.allowedFormats.map(f => f.split('/')[1]).join(', ').toUpperCase()}</p>
          {constraints.maxDimensions && (
            <p>• Maximum dimensions: {constraints.maxDimensions.width}×{constraints.maxDimensions.height}</p>
          )}
        </div>
      )}
    </div>
  );
}