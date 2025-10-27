/**
 * FileUploadZone Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadZone } from '../FileUploadZone';

describe('FileUploadZone', () => {
  const mockFile = {
    id: '1',
    file: new File([''], 'test.png', { type: 'image/png' }),
    dataUrl: 'data:image/png',
    blobUrl: 'blob:test',
    dimensions: { width: 100, height: 100 },
    size: 102400,
    mimeType: 'image/png' as const,
    format: 'png' as const,
    optimized: false,
    thumbnailUrl: 'data:image/png',
    metadata: {
      fileName: 'test.png',
      originalSize: 102400,
      uploadedAt: new Date(),
      lastModified: new Date(),
    },
  };

  const defaultProps = {
    files: [],
    isDragOver: false,
    onFilesAdded: vi.fn(),
    onFileRemoved: vi.fn(),
    onDragEnter: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload zone', () => {
    render(<FileUploadZone {...defaultProps} />);
    // Component shows "Click or drag files to upload"
    expect(
      screen.getByText(/click or drag files to upload/i),
    ).toBeInTheDocument();
  });

  it('should show drag over state', () => {
    render(<FileUploadZone {...defaultProps} isDragOver={true} />);
    // When dragging, aria-label changes to "Drop files to upload"
    const zone = screen.getByRole('button', { name: /drop files to upload/i });
    expect(zone).toBeInTheDocument();
  });

  it('should call onDragEnter on drag enter', () => {
    render(<FileUploadZone {...defaultProps} />);
    // Fire dragEnter on the drop zone button element
    const zone = screen.getByRole('button');
    fireEvent.dragEnter(zone);
    expect(defaultProps.onDragEnter).toHaveBeenCalled();
  });

  it('should call onDrop on file drop', () => {
    render(<FileUploadZone {...defaultProps} />);
    // Fire drop on the drop zone button element
    const zone = screen.getByRole('button');
    fireEvent.drop(zone);
    expect(defaultProps.onDrop).toHaveBeenCalled();
  });

  it('should display uploaded files', () => {
    render(<FileUploadZone {...defaultProps} files={[mockFile]} />);
    expect(screen.getByText('test.png')).toBeInTheDocument();
  });

  it('should call onFileRemoved when remove is clicked', () => {
    render(<FileUploadZone {...defaultProps} files={[mockFile]} />);
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    expect(defaultProps.onFileRemoved).toHaveBeenCalledWith('1');
  });

  it('should disable upload when maxFiles reached', () => {
    render(
      <FileUploadZone {...defaultProps} files={[mockFile]} maxFiles={1} />,
    );
    expect(screen.getByText(/maximum.*files reached/i)).toBeInTheDocument();
  });

  it('should disable when disabled prop is true', () => {
    render(<FileUploadZone {...defaultProps} disabled={true} />);
    const button = screen.queryByRole('button');
    // Component uses aria-disabled instead of disabled attribute
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
