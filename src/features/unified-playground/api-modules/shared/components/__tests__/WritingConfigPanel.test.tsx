/**
 * WritingConfigPanel Tests
 *
 * Unit tests for WritingConfigPanel component.
 * Focus: Props, rendering, basic interactions.
 *
 * @module shared/components/__tests__/WritingConfigPanel.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WritingConfigPanel } from '../WritingConfigPanel';
import type { WritingConfigPanelProps } from '../WritingConfigPanel';
import type { ConfigOption } from '../../types';

const MOCK_TONE_OPTIONS: ConfigOption[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'casual', label: 'Casual' },
];

const MOCK_FORMAT_OPTIONS: ConfigOption[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain-text', label: 'Plain Text' },
];

const MOCK_LENGTH_OPTIONS: ConfigOption[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const DEFAULT_CONFIG = {
  tone: 'neutral',
  format: 'markdown',
  length: 'medium',
  sharedContext: '',
};

function renderPanel(props: Partial<WritingConfigPanelProps> = {}) {
  const defaultProps: WritingConfigPanelProps = {
    config: DEFAULT_CONFIG,
    onChange: vi.fn(),
    toneOptions: MOCK_TONE_OPTIONS,
    formatOptions: MOCK_FORMAT_OPTIONS,
    lengthOptions: MOCK_LENGTH_OPTIONS,
    ...props,
  };

  return {
    ...render(<WritingConfigPanel {...defaultProps} />),
    props: defaultProps,
  };
}

describe('WritingConfigPanel', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      renderPanel();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      renderPanel({ title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render custom description', () => {
      renderPanel({ description: 'Custom Desc' });
      expect(screen.getByText('Custom Desc')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderPanel({ className: 'test-class' });
      expect(container.querySelector('.test-class')).toBeInTheDocument();
    });
  });

  describe('Configuration Selects', () => {
    it('should render tone select', () => {
      renderPanel({ defaultCollapsed: false });
      expect(
        screen.getByRole('combobox', { name: /tone/i }),
      ).toBeInTheDocument();
    });

    it('should render format select', () => {
      renderPanel({ defaultCollapsed: false });
      expect(
        screen.getByRole('combobox', { name: /format/i }),
      ).toBeInTheDocument();
    });

    it('should render length select', () => {
      renderPanel({ defaultCollapsed: false });
      expect(
        screen.getByRole('combobox', { name: /length/i }),
      ).toBeInTheDocument();
    });

    it('should display current tone value', () => {
      renderPanel({
        config: { ...DEFAULT_CONFIG, tone: 'formal' },
        defaultCollapsed: false,
      });
      expect(screen.getByText('Formal')).toBeInTheDocument();
    });

    it('should display current format value', () => {
      renderPanel({
        config: { ...DEFAULT_CONFIG, format: 'plain-text' },
        defaultCollapsed: false,
      });
      expect(screen.getByText('Plain Text')).toBeInTheDocument();
    });

    it('should display current length value', () => {
      renderPanel({
        config: { ...DEFAULT_CONFIG, length: 'long' },
        defaultCollapsed: false,
      });
      expect(screen.getByText('Long')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable tone select when disabled', () => {
      renderPanel({ disabled: true, defaultCollapsed: false });
      expect(screen.getByRole('combobox', { name: /tone/i })).toBeDisabled();
    });

    it('should disable format select when disabled', () => {
      renderPanel({ disabled: true, defaultCollapsed: false });
      expect(screen.getByRole('combobox', { name: /format/i })).toBeDisabled();
    });

    it('should disable length select when disabled', () => {
      renderPanel({ disabled: true, defaultCollapsed: false });
      expect(screen.getByRole('combobox', { name: /length/i })).toBeDisabled();
    });
  });

  describe('View Code Button', () => {
    it('should render View Code button when onViewCode provided', () => {
      renderPanel({ onViewCode: vi.fn() });
      expect(
        screen.getByRole('button', { name: /view.*code/i }),
      ).toBeInTheDocument();
    });

    it('should not render View Code button when onViewCode not provided', () => {
      renderPanel({ onViewCode: undefined });
      expect(
        screen.queryByRole('button', { name: /view.*code/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Advanced Settings', () => {
    it('should not show shared context when showAdvanced is false', () => {
      renderPanel({ showAdvanced: false, defaultCollapsed: false });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should show shared context when showAdvanced is true', () => {
      renderPanel({ showAdvanced: true, defaultCollapsed: false });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display shared context value', () => {
      const config = { ...DEFAULT_CONFIG, sharedContext: 'Test context' };
      renderPanel({ config, showAdvanced: true, defaultCollapsed: false });
      expect(screen.getByRole('textbox')).toHaveValue('Test context');
    });

    it('should disable shared context when disabled', () => {
      renderPanel({
        disabled: true,
        showAdvanced: true,
        defaultCollapsed: false,
      });
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Labels and Accessibility', () => {
    it('should have accessible label for tone', () => {
      renderPanel({ defaultCollapsed: false });
      expect(screen.getByLabelText(/tone/i)).toBeInTheDocument();
    });

    it('should have accessible label for format', () => {
      renderPanel({ defaultCollapsed: false });
      expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    });

    it('should have accessible label for length', () => {
      renderPanel({ defaultCollapsed: false });
      expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    });
  });
});
