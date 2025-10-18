/**
 * ImagePreview Component
 * Display image thumbnails with zoom modal and image details
 */

import React, { useState, useEffect } from 'react';

interface ImagePreviewProps {
  /**
   * Image URL (data URL or blob URL)
   */
  url: string;

  /**
   * Image file name
   */
  name: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Image dimensions
   */
  dimensions?: {
    width: number;
    height: number;
  };

  /**
   * Alt text for accessibility
   */
  alt?: string;

  /**
   * Callback when remove button is clicked
   */
  onRemove?: () => void;

  /**
   * Callback when image is clicked
   */
  onClick?: () => void;

  /**
   * Show detailed info?
   */
  showDetails?: boolean;

  /**
   * Is this preview removable?
   */
  removable?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  name,
  size,
  dimensions,
  alt,
  onRemove,
  onClick,
  showDetails = true,
  removable = true,
}) => {
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showZoomModal) {
        setShowZoomModal(false);
      }
    };

    if (showZoomModal) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showZoomModal]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle image click
  const handleImageClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowZoomModal(true);
    }
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      {/* Thumbnail */}
      <div className="image-preview group relative inline-block border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* Image */}
        <div className="relative w-32 h-32">
          {imageError ? (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-1">🖼️</div>
                <div className="text-xs">Image Error</div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleImageClick}
              className="relative w-full h-full p-0 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`View ${alt || name} in full size. Press Enter to open.`}
              type="button"
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <img
                src={url}
                alt={alt || name}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                onError={handleImageError}
                loading="lazy"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                  Click to enlarge
                </span>
              </div>
            </button>
          )}

          {/* Remove button */}
          {removable && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
              aria-label="Remove image"
            >
              ×
            </button>
          )}
        </div>

        {/* Details */}
        {showDetails && (
          <div className="p-2 bg-white dark:bg-gray-800 border-t">
            <p
              className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"
              title={name}
            >
              {name}
            </p>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatSize(size)}</span>
              {dimensions && (
                <span>
                  {dimensions.width} × {dimensions.height}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {showZoomModal && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setShowZoomModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom modal - Press Escape to close"
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close button */}
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
              aria-label="Close modal"
            >
              ×
            </button>

            {/* Full-size image */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
              <img
                src={url}
                alt={alt || name}
                className="max-w-full max-h-[80vh] object-contain"
              />

              {/* Image info footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatSize(size)}</span>
                      {dimensions && (
                        <span>
                          {dimensions.width} × {dimensions.height} px
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {removable && onRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove();
                          setShowZoomModal(false);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                    <a
                      href={url}
                      download={name}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
