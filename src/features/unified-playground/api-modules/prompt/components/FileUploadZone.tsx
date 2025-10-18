/**
 * FileUploadZone Component
 * Drag-and-drop file upload interface
 */

import React from 'react';
import type { ImageData } from '../types';

interface FileUploadZoneProps {
  files: ImageData[];
  isDragOver: boolean;
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (fileId: string) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  isDragOver,
  onFilesAdded,
  onFileRemoved,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  maxFiles = 5,
  disabled = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canAddMore = files.length < maxFiles;

  const handleClick = () => {
    if (!disabled && canAddMore) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
    e.target.value = '';
  };

  return (
    <div className="file-upload-zone space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        role="button"
        tabIndex={disabled || !canAddMore ? -1 : 0}
        aria-label="Upload files - click or drop files here"
        aria-disabled={disabled || !canAddMore}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50'}
          ${!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          disabled={disabled || !canAddMore}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="text-sm font-medium">
            {canAddMore
              ? 'Click or drag files to upload'
              : `Maximum ${maxFiles} files reached`}
          </p>
          <p className="text-xs text-gray-500">
            Supports: JPEG, PNG, WebP, GIF (max 10MB)
          </p>
          {canAddMore && (
            <p className="text-xs text-gray-400">
              {files.length}/{maxFiles} files uploaded
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="relative group">
              <img
                src={file.thumbnailUrl || file.dataUrl}
                alt={file.metadata.fileName}
                className="w-full h-24 object-cover rounded border"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemoved(file.id);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove file"
              >
                ×
              </button>
              <p
                className="text-xs truncate mt-1"
                title={file.metadata.fileName}
              >
                {file.metadata.fileName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
