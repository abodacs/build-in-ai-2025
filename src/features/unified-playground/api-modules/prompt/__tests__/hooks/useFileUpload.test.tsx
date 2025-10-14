/**
 * useFileUpload Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from '../../hooks/useFileUpload';

// Mock browser APIs
beforeEach(() => {
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock FileReader
  class MockFileReader {
    result: string | null = null;
    onload: ((e: any) => void) | null = null;
    onerror: ((e: any) => void) | null = null;

    readAsDataURL() {
      setTimeout(() => {
        this.result = 'data:image/png;base64,test';
        if (this.onload) {
          this.onload({ target: { result: this.result } });
        }
      }, 0);
    }
  }
  global.FileReader = MockFileReader as any;

  // Mock Image
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    width: number = 100;
    height: number = 100;

    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  }
  global.Image = MockImage as any;

  // Mock Canvas
  const originalCreateElement = document.createElement.bind(document);
  global.document.createElement = vi.fn((tag: string) => {
    if (tag === 'canvas') {
      const mockCanvas = {
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/png;base64,thumbnail'),
        toBlob: vi.fn((callback) => {
          callback(new Blob(['test'], { type: 'image/png' }));
        }),
        width: 0,
        height: 0,
      };
      return mockCanvas as any;
    }
    return originalCreateElement(tag);
  });
});

describe('useFileUpload', () => {
  const createMockFile = (name: string, type: string = 'image/png') => {
    const file = new File(['test'], name, { type });
    Object.defineProperty(file, 'size', { value: 1024 });
    return file;
  };

  it('initializes with empty files', () => {
    const { result } = renderHook(() => useFileUpload());
    expect(result.current.files).toEqual([]);
    expect(result.current.fileCount).toBe(0);
  });

  it('adds single file', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = createMockFile('test.png');

    await act(async () => {
      await result.current.addFiles([mockFile]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });

    expect(result.current.files[0].file.name).toBe('test.png');
    expect(result.current.files[0].dataUrl).toBe('data:image/png;base64,test');
  });

  it('adds multiple files', async () => {
    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.addFiles([
        createMockFile('file1.png'),
        createMockFile('file2.png'),
      ]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(2);
    });
  });

  it('removes file by id', async () => {
    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.addFiles([createMockFile('test.png')]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });

    const fileId = result.current.files[0].id;

    act(() => {
      result.current.removeFile(fileId);
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('clears all files', async () => {
    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.addFiles([
        createMockFile('file1.png'),
        createMockFile('file2.png'),
      ]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(2);
    });

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('respects maxFiles limit', async () => {
    const { result } = renderHook(() => useFileUpload({ maxFiles: 2 }));

    await act(async () => {
      await result.current.addFiles([
        createMockFile('file1.png'),
        createMockFile('file2.png'),
        createMockFile('file3.png'),
      ]);
    });

    await waitFor(() => {
      expect(result.current.files.length).toBeGreaterThan(0);
    });

    expect(result.current.files).toHaveLength(2);
  });

  it('validates file types', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        constraints: {
          supportedTypes: ['image/png', 'image/jpeg'],
        },
      }),
    );

    await act(async () => {
      await result.current.addFiles([createMockFile('test.txt', 'text/plain')]);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.files).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('validates file size', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        constraints: {
          maxSize: 500,
        },
      }),
    );

    await act(async () => {
      await result.current.addFiles([createMockFile('large.png')]);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.files).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('handles drag over state', () => {
    const { result } = renderHook(() => useFileUpload());

    const mockDragEnterEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        items: [{}],
      },
    } as any;

    const mockDragLeaveEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleDragEnter(mockDragEnterEvent);
    });

    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.handleDragLeave(mockDragLeaveEvent);
    });

    expect(result.current.isDragOver).toBe(false);
  });

  it('handles drop event', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = createMockFile('dropped.png');

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [mockFile],
      },
    } as any;

    await act(async () => {
      await result.current.handleDrop(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });

    expect(result.current.isDragOver).toBe(false);
  });

  it('generates file previews for images', async () => {
    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.addFiles([createMockFile('test.png')]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });

    expect(result.current.files[0].blobUrl).toBe('blob:test-url');
    expect(result.current.files[0].dataUrl).toBe('data:image/png;base64,test');
  });
});
