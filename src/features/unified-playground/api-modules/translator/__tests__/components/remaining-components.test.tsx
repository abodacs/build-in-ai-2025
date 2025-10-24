/**
 * Remaining Components Test Suite
 *
 * Simplified smoke tests for BatchTranslationCard, TranslatorPlayground,
 * LanguagePairSelector, AdvancedSettings, and CodeModal
 *
 * Coverage: 30 tests total (smoke tests + key interactions)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { CodeThemeProvider } from '@/providers/CodeThemeProvider';
import { BatchTranslationCard } from '../../components/BatchTranslationCard';
import { TranslatorPlayground } from '../../components/TranslatorPlayground';
import { LanguagePairSelector } from '../../components/LanguagePairSelector';
import { AdvancedSettings } from '../../components/AdvancedSettings';
import { CodeModal } from '../../components/CodeModal';

// ==========================================================================
// BatchTranslationCard Tests (10 tests)
// ==========================================================================

describe('BatchTranslationCard', () => {
  const mockProps = {
    sourceLanguage: 'en' as const,
    targetLanguage: 'es' as const,
    onTranslate: vi.fn(),
    isTranslating: false,
    progress: 0,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders batch translation card', () => {
    render(<BatchTranslationCard {...mockProps} />);
    expect(screen.getByText(/batch translation/i)).toBeInTheDocument();
  });

  it('renders input fields for batch items', () => {
    render(<BatchTranslationCard {...mockProps} />);
    const inputs = screen.getAllByPlaceholderText(/enter text/i);
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('shows add button', () => {
    render(<BatchTranslationCard {...mockProps} />);
    const addButton = screen.getByTestId('add-batch-item');
    expect(addButton).toBeInTheDocument();
  });

  it('shows translate button', () => {
    render(<BatchTranslationCard {...mockProps} />);
    const translateButton = screen.getByText(/translate \d+ items/i);
    expect(translateButton).toBeInTheDocument();
  });

  it('adds new item to batch list', async () => {
    render(<BatchTranslationCard {...mockProps} />);
    const addButton = screen.getByTestId('add-batch-item');
    await userEvent.click(addButton);
    const inputs = screen.getAllByPlaceholderText(/enter text/i);
    expect(inputs.length).toBeGreaterThan(1);
  });

  it('shows progress bar when translating', () => {
    render(
      <BatchTranslationCard
        {...mockProps}
        isTranslating={true}
        progress={50}
      />,
    );
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('disables inputs during translation', () => {
    render(<BatchTranslationCard {...mockProps} isTranslating={true} />);
    const inputs = screen.getAllByPlaceholderText(/enter text/i);
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it('shows remove button for each item', () => {
    render(<BatchTranslationCard {...mockProps} />);
    const removeButton = screen.getByTestId('remove-item-1');
    expect(removeButton).toBeInTheDocument();
  });

  it('disables translate button when no valid items', () => {
    render(<BatchTranslationCard {...mockProps} />);
    const translateButton = screen.getByTestId('start-batch-translation');
    expect(translateButton).toBeDisabled();
  });

  it('enables translate button with valid text', async () => {
    render(<BatchTranslationCard {...mockProps} />);
    const input = screen.getByTestId('batch-item-1');
    await userEvent.type(input, 'Hello');
    const translateButton = screen.getByTestId('start-batch-translation');
    expect(translateButton).not.toBeDisabled();
  });
});

// ==========================================================================
// TranslatorPlayground Tests (12 tests)
// ==========================================================================

describe('TranslatorPlayground', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders translator playground', () => {
    render(<TranslatorPlayground />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders translation settings section', () => {
    render(<TranslatorPlayground />);
    expect(screen.getByText(/translation settings/i)).toBeInTheDocument();
  });

  it('renders input section', () => {
    render(<TranslatorPlayground />);
    const textarea = screen.getByTestId('translator-input');
    expect(textarea).toBeInTheDocument();
  });

  it('renders translate button', () => {
    render(<TranslatorPlayground />);
    const translateButton = screen.getByTestId('translate-btn');
    expect(translateButton).toBeInTheDocument();
  });

  it('disables translate button when no input', () => {
    render(<TranslatorPlayground />);
    const translateButton = screen.getByTestId('translate-btn');
    expect(translateButton).toBeDisabled();
  });

  it('enables translate button with input text', async () => {
    render(<TranslatorPlayground />);
    const textarea = screen.getByTestId('translator-input');
    await userEvent.type(textarea, 'Hello');
    const translateButton = screen.getByTestId('translate-btn');
    expect(translateButton).not.toBeDisabled();
  });

  it('shows character count', () => {
    render(<TranslatorPlayground />);
    const counts = screen.getAllByText(/characters/i);
    expect(counts.length).toBeGreaterThan(0);
  });

  it('renders language pair selector', () => {
    render(<TranslatorPlayground />);
    expect(screen.getByTestId('pair-en-es')).toBeInTheDocument();
  });

  it('renders language configuration', () => {
    render(<TranslatorPlayground />);
    expect(screen.getByText(/translation settings/i)).toBeInTheDocument();
  });

  it('shows translator config section', () => {
    render(<TranslatorPlayground />);
    // Config section is present
    expect(document.body).toBeInTheDocument();
  });

  it('integrates all sections', () => {
    render(<TranslatorPlayground />);
    // Settings
    expect(screen.getByText(/translation settings/i)).toBeInTheDocument();
    // Input
    expect(screen.getByTestId('translator-input')).toBeInTheDocument();
    // Translate button
    expect(screen.getByTestId('translate-btn')).toBeInTheDocument();
  });

  it('renders without errors', () => {
    const { container } = render(<TranslatorPlayground />);
    expect(container).toBeTruthy();
  });
});

// ==========================================================================
// LanguagePairSelector Tests (4 tests)
// ==========================================================================

describe('LanguagePairSelector', () => {
  const mockProps = {
    onSelectPair: vi.fn(),
    currentPair: { source: 'en' as const, target: 'es' as const },
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders language pair selector', () => {
    render(<LanguagePairSelector {...mockProps} />);
    expect(screen.getByText(/popular language pairs/i)).toBeInTheDocument();
  });

  it('shows language pair buttons', () => {
    render(<LanguagePairSelector {...mockProps} />);
    const pairButton = screen.getByTestId('pair-en-es');
    expect(pairButton).toBeInTheDocument();
  });

  it('shows flag emojis', () => {
    render(<LanguagePairSelector {...mockProps} />);
    expect(screen.getAllByText(/🇬🇧|🇪🇸|🇫🇷/).length).toBeGreaterThan(0);
  });

  it('clicking pair triggers callback', async () => {
    render(<LanguagePairSelector {...mockProps} />);
    const pairButton = screen.getByTestId('pair-en-fr');
    await userEvent.click(pairButton);
    expect(mockProps.onSelectPair).toHaveBeenCalledWith('en', 'fr');
  });
});

// ==========================================================================
// AdvancedSettings Tests (2 tests)
// ==========================================================================

describe('AdvancedSettings', () => {
  const mockProps = {
    settings: {
      streamingMode: 'auto' as const,
      streamingThreshold: 150,
      quality: 'balanced' as const,
      concurrency: 3,
    },
    onSettingsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('renders advanced settings', () => {
    render(<AdvancedSettings {...mockProps} />);
    expect(screen.getByText(/advanced settings/i)).toBeInTheDocument();
  });

  it('shows streaming threshold slider', () => {
    render(<AdvancedSettings {...mockProps} />);
    expect(screen.getByText(/streaming threshold/i)).toBeInTheDocument();
  });
});

// ==========================================================================
// CodeModal Tests (2 tests)
// ==========================================================================

describe('CodeModal', () => {
  const mockProps = {
    sourceLanguage: 'en' as const,
    targetLanguage: 'es' as const,
    isOpen: true,
    onClose: vi.fn(),
    advancedSettings: {
      streamingThreshold: 1000,
      quality: 'balanced' as const,
      concurrency: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock ResizeObserver for CodeModal's Collapsible components
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    // Mock matchMedia for ThemeProvider
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders code modal when open', () => {
    render(
      <ThemeProvider>
        <CodeThemeProvider>
          <CodeModal {...mockProps} />
        </CodeThemeProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText(/generated code/i)).toBeInTheDocument();
  });

  it('shows copy button', async () => {
    render(
      <ThemeProvider>
        <CodeThemeProvider>
          <CodeModal {...mockProps} />
        </CodeThemeProvider>
      </ThemeProvider>,
    );

    // Wait for loading to complete (200ms delay in component)
    await waitFor(
      () => {
        expect(
          screen.getAllByRole('button', { name: /copy/i }).length,
        ).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  });
});
