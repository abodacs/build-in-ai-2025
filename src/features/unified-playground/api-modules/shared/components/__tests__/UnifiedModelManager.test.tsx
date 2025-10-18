/**
 * UnifiedModelManager Component Tests
 *
 * Comprehensive test suite for the unified model management component
 *
 * @module shared/components/__tests__/UnifiedModelManager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedModelManager } from '../UnifiedModelManager';
import type {
  UnifiedModelManagerProps,
  ModelInfo,
} from '../UnifiedModelManager';

// ============================================================================
// Mock Data
// ============================================================================

const mockModelInfo: ModelInfo = {
  name: 'Test Model',
  chromeVersion: '127+',
  requiresOriginTrial: false,
  storageRequirement: '22GB+ free space',
  vramRequirement: '4GB+ VRAM',
};

const defaultProps: UnifiedModelManagerProps = {
  apiName: 'TestAPI',
  availability: 'no',
  isReady: false,
  isLoading: false,
  modelInfo: mockModelInfo,
};

// ============================================================================
// Test Suite
// ============================================================================

describe('UnifiedModelManager', () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe('Rendering', () => {
    it('should render component with model name', () => {
      render(<UnifiedModelManager {...defaultProps} />);
      expect(screen.getByText('Test Model Status')).toBeInTheDocument();
    });

    it('should render API name in model info', () => {
      render(<UnifiedModelManager {...defaultProps} />);
      expect(screen.getByText('TestAPI API')).toBeInTheDocument();
    });

    it('should render chrome version', () => {
      render(<UnifiedModelManager {...defaultProps} />);
      expect(screen.getByText('127+')).toBeInTheDocument();
    });

    it('should render storage requirements', () => {
      render(<UnifiedModelManager {...defaultProps} />);
      expect(screen.getByText(/22GB\+ free space/i)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <UnifiedModelManager {...defaultProps} className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ==========================================================================
  // Status Badge Tests
  // ==========================================================================

  describe('Status Badges', () => {
    it('should show "Not Available" badge when availability is "no"', () => {
      render(<UnifiedModelManager {...defaultProps} availability="no" />);
      expect(screen.getByText('Not Available')).toBeInTheDocument();
    });

    it('should show "Needs Download" badge when availability is "after-download"', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="after-download"
          isReady={false}
        />,
      );
      expect(screen.getByText('Needs Download')).toBeInTheDocument();
    });

    it('should show "Ready" badge when model is ready', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="readily"
          isReady={true}
        />,
      );
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show "Loading" badge when isLoading is true', () => {
      render(<UnifiedModelManager {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Display', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to download model';
      render(<UnifiedModelManager {...defaultProps} error={errorMessage} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error alert when error is null', () => {
      render(<UnifiedModelManager {...defaultProps} error={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Download Progress Tests
  // ==========================================================================

  describe('Download Progress', () => {
    it('should display download progress when provided', () => {
      const downloadProgress = {
        loaded: 1073741824, // 1 GB
        total: 2147483648, // 2 GB
        percentage: 50,
      };

      render(
        <UnifiedModelManager
          {...defaultProps}
          downloadProgress={downloadProgress}
        />,
      );

      expect(screen.getByText('Downloading model...')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText(/1.00 GB \/ 2.00 GB/)).toBeInTheDocument();
    });

    it('should display download speed when provided', () => {
      const downloadProgress = {
        loaded: 1073741824,
        total: 2147483648,
        percentage: 50,
        downloadSpeed: 10485760, // 10 MB/s
      };

      render(
        <UnifiedModelManager
          {...defaultProps}
          downloadProgress={downloadProgress}
        />,
      );

      expect(screen.getByText(/10.00 MB\/s/)).toBeInTheDocument();
    });

    it('should not display progress bar when downloadProgress is null', () => {
      render(<UnifiedModelManager {...defaultProps} downloadProgress={null} />);
      expect(
        screen.queryByText('Downloading model...'),
      ).not.toBeInTheDocument();
    });

    it('should not display size when loaded/total are missing', () => {
      const downloadProgress = {
        loaded: 0,
        total: 0,
        percentage: 25,
      };

      render(
        <UnifiedModelManager
          {...defaultProps}
          downloadProgress={downloadProgress}
        />,
      );

      expect(screen.queryByText(/GB \/ /)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================

  describe('Loading States', () => {
    it('should show progressive loading UI during initialization', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          isLoading={true}
          loadingPhase="initializing"
        />,
      );

      expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
    });

    it('should show loading dots during loading phase', () => {
      const { container } = render(
        <UnifiedModelManager
          {...defaultProps}
          isLoading={true}
          loadingPhase="downloading"
        />,
      );

      const dots = container.querySelectorAll('.animate-pulse');
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });

    it('should not show loading UI when not loading', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          isLoading={false}
          loadingPhase={null}
        />,
      );

      expect(screen.queryByText(/Initializing/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Action Button Tests
  // ==========================================================================

  describe('Action Buttons', () => {
    it('should show download button when model needs download', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="after-download"
          isReady={false}
        />,
      );

      expect(
        screen.getByRole('button', { name: /download model/i }),
      ).toBeInTheDocument();
    });

    it('should call onStartDownload when download button is clicked', async () => {
      const onStartDownload = vi.fn().mockResolvedValue(undefined);

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="after-download"
          onStartDownload={onStartDownload}
        />,
      );

      const downloadButton = screen.getByRole('button', {
        name: /download model/i,
      });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(onStartDownload).toHaveBeenCalledTimes(1);
      });
    });

    it('should show re-download and clear cache buttons when model is ready', () => {
      const onClearCache = vi.fn();

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="readily"
          isReady={true}
          onClearCache={onClearCache}
        />,
      );

      expect(
        screen.getByRole('button', { name: /re-download/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /clear cache/i }),
      ).toBeInTheDocument();
    });

    it('should disable buttons during loading', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="after-download"
          isLoading={true}
        />,
      );

      const downloadButton = screen.getByRole('button', {
        name: /download model/i,
      });
      expect(downloadButton).toBeDisabled();
    });

    it('should show confirmation dialog before clearing cache', async () => {
      const onClearCache = vi.fn().mockResolvedValue(undefined);
      window.confirm = vi.fn().mockReturnValue(true);

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="readily"
          isReady={true}
          onClearCache={onClearCache}
        />,
      );

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(onClearCache).toHaveBeenCalled();
      });
    });

    it('should not clear cache if user cancels confirmation', async () => {
      const onClearCache = vi.fn();
      window.confirm = vi.fn().mockReturnValue(false);

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="readily"
          isReady={true}
          onClearCache={onClearCache}
        />,
      );

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(onClearCache).not.toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Model Info Display Tests
  // ==========================================================================

  describe('Model Information', () => {
    it('should display model status as Downloaded when ready', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          isReady={true}
          availability="readily"
        />,
      );

      expect(screen.getByText('Downloaded')).toBeInTheDocument();
    });

    it('should display model status as Not Downloaded when not ready', () => {
      render(
        <UnifiedModelManager
          {...defaultProps}
          isReady={false}
          availability="after-download"
        />,
      );

      expect(screen.getByText('Not Downloaded')).toBeInTheDocument();
    });

    it('should display origin trial requirement when specified', () => {
      const modelInfoWithTrial: ModelInfo = {
        ...mockModelInfo,
        requiresOriginTrial: true,
      };

      render(
        <UnifiedModelManager
          {...defaultProps}
          modelInfo={modelInfoWithTrial}
          isLoading={true}
          loadingPhase="initializing"
        />,
      );

      expect(screen.getByText(/origin trial enabled/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // System Requirements Tests
  // ==========================================================================

  describe('System Requirements', () => {
    it('should display system requirements info alert', () => {
      render(<UnifiedModelManager {...defaultProps} />);

      expect(
        screen.getByText(/Model is downloaded once and cached locally/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/All processing happens on your device/i),
      ).toBeInTheDocument();
    });

    it('should display storage requirement in info', () => {
      render(<UnifiedModelManager {...defaultProps} />);

      expect(screen.getByText(/22GB\+ free space/i)).toBeInTheDocument();
    });

    it('should display VRAM requirement when specified', () => {
      render(<UnifiedModelManager {...defaultProps} />);

      expect(screen.getByText(/4GB\+ VRAM/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Progressive Disclosure Tests
  // ==========================================================================

  describe('Progressive Disclosure', () => {
    it('should show first-time requirements alert during loading', () => {
      // Mock useProgressiveLoadingMessage to return elapsed time > 10s
      vi.mock('../../proofreader/hooks/useProgressiveLoadingMessage', () => ({
        useProgressiveLoadingMessage: () => ({
          currentMessage: {
            message: 'Downloading...',
            level: 'info',
          },
          elapsedTime: 15,
          reset: vi.fn(),
        }),
      }));

      render(
        <UnifiedModelManager
          {...defaultProps}
          isLoading={true}
          loadingPhase="initializing"
        />,
      );

      expect(screen.getByText(/First-Time Requirements:/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Links and External Navigation Tests
  // ==========================================================================

  describe('External Links', () => {
    it('should render link to Chrome internals', () => {
      render(<UnifiedModelManager {...defaultProps} />);

      const link = screen.getByText(
        /View detailed status in Chrome Internals/i,
      );
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute(
        'href',
        'chrome://on-device-internals',
      );
    });

    it('should open links in new tab', () => {
      render(<UnifiedModelManager {...defaultProps} />);

      const link = screen
        .getByText(/View detailed status in Chrome Internals/i)
        .closest('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  // ==========================================================================
  // Error Handling in Actions Tests
  // ==========================================================================

  describe('Action Error Handling', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should handle download errors gracefully', async () => {
      const onStartDownload = vi
        .fn()
        .mockRejectedValue(new Error('Download failed'));

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="after-download"
          onStartDownload={onStartDownload}
        />,
      );

      const downloadButton = screen.getByRole('button', {
        name: /download model/i,
      });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(onStartDownload).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to start download'),
          expect.any(Error),
        );
      });
    });

    it('should handle clear cache errors gracefully', async () => {
      const onClearCache = vi.fn().mockRejectedValue(new Error('Clear failed'));
      window.confirm = vi.fn().mockReturnValue(true);

      render(
        <UnifiedModelManager
          {...defaultProps}
          availability="readily"
          isReady={true}
          onClearCache={onClearCache}
        />,
      );

      const clearButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onClearCache).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to clear cache'),
          expect.any(Error),
        );
      });
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle missing optional props gracefully', () => {
      render(
        <UnifiedModelManager
          apiName="Test"
          availability="no"
          isReady={false}
          isLoading={false}
          modelInfo={mockModelInfo}
        />,
      );

      expect(screen.getByText('Test Model Status')).toBeInTheDocument();
    });

    it('should handle null availability', () => {
      render(
        <UnifiedModelManager {...defaultProps} availability={'no' as any} />,
      );

      expect(screen.getByText('Not Available')).toBeInTheDocument();
    });

    it('should handle model info without optional fields', () => {
      const minimalModelInfo: ModelInfo = {
        name: 'Minimal Model',
        chromeVersion: '127+',
      };

      render(
        <UnifiedModelManager {...defaultProps} modelInfo={minimalModelInfo} />,
      );

      expect(screen.getByText('Minimal Model Status')).toBeInTheDocument();
    });
  });
});
