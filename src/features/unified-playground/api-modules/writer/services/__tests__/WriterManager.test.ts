/**
 * WriterManager Tests
 *
 * Essential tests for WriterManager service.
 * Focus: Core functionality, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WriterManager } from '../WriterManager';

// Mock Chrome AI Writer API
const mockWriter = {
  write: vi.fn(),
  writeStreaming: vi.fn(),
  destroy: vi.fn(),
};

global.Writer = {
  create: vi.fn(async () => mockWriter),
  availability: vi.fn(async () => 'readily'),
} as any;

describe('WriterManager', () => {
  let manager: WriterManager;

  beforeEach(() => {
    manager = new WriterManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('getInstance', () => {
    it('should create instance with config', async () => {
      const config = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
      };

      await manager.getInstance(config);

      expect(global.Writer.create).toHaveBeenCalledWith(
        expect.objectContaining({ tone: 'formal', format: 'markdown' }),
      );
    });

    it('should reuse instance for same config', async () => {
      const config = {
        tone: 'formal',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
      };

      await manager.getInstance(config);
      await manager.getInstance(config);

      expect(global.Writer.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('write', () => {
    it('should generate content', async () => {
      mockWriter.write.mockResolvedValue('Generated content');
      const config = {
        tone: 'neutral',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
        sharedContext: '',
      };

      await manager.getInstance(config);
      const result = await manager.write('Test prompt');

      expect(result).toBe('Generated content');
      expect(mockWriter.write).toHaveBeenCalledWith(
        'Test prompt',
        expect.any(Object),
      );
    });

    it('should handle write errors', async () => {
      mockWriter.write.mockRejectedValue(new Error('API error'));
      const config = {
        tone: 'neutral',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
        sharedContext: '',
      };

      await manager.getInstance(config);
      await expect(manager.write('Test')).rejects.toThrow();
    });
  });

  describe('writeStreaming', () => {
    it('should stream content', async () => {
      const chunks = ['Hello', ' ', 'world'];
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
      };

      mockWriter.writeStreaming.mockReturnValue(mockStream);
      const config = {
        tone: 'neutral',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
        sharedContext: '',
      };
      const onChunk = vi.fn();

      await manager.getInstance(config);
      const result = await manager.writeStreaming('Test', onChunk);

      expect(result).toBe('Hello world');
      expect(onChunk).toHaveBeenCalledTimes(3);
    });
  });

  describe('destroy', () => {
    it('should destroy instance', async () => {
      const config = {
        tone: 'neutral',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
        sharedContext: '',
      };
      await manager.getInstance(config);

      manager.destroy();

      expect(mockWriter.destroy).toHaveBeenCalled();
    });
  });
});
