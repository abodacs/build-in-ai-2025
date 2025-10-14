/**
 * FileUploadZone Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadZone } from '../FileUploadZone';

describe('FileUploadZone', () => {
  const mockFile = {
    id: '1',
    name: 'test.png',
    size: 102400,
    mimeType: 'image/png',
    preview: 'data:image/png',
    file: new File([''], 'test.png', { type: 'image/png' }),
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
    expect(
      screen.getByText(/drag.*drop.*click to select/i),
    ).toBeInTheDocument();
  });

  it('should show drag over state', () => {
    render(<FileUploadZone {...defaultProps} isDragOver={true} />);
    const zone = screen.getByText(/drop.*here/i);
    expect(zone).toBeInTheDocument();
  });

  it('should call onDragEnter on drag enter', () => {
    const { container } = render(<FileUploadZone {...defaultProps} />);
    const zone = container.firstChild;
    if (zone) {
      fireEvent.dragEnter(zone);
      expect(defaultProps.onDragEnter).toHaveBeenCalled();
    }
  });

  it('should call onDrop on file drop', () => {
    const { container } = render(<FileUploadZone {...defaultProps} />);
    const zone = container.firstChild;
    if (zone) {
      fireEvent.drop(zone);
      expect(defaultProps.onDrop).toHaveBeenCalled();
    }
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
    const input = screen.queryByRole('button');
    expect(input).toHaveAttribute('disabled');
  });
});
