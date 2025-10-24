# Contributing to Chrome AI DevBench

Thank you for your interest in contributing to Chrome AI DevBench! This project provides an interactive learning playground for Chrome's built-in AI APIs, and we welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Chrome AI Setup](#chrome-ai-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

**Development Requirements:**

- Node.js 22.0.0 or higher
- pnpm 8.0.0 or higher
- Git

**Chrome AI Requirements:**

- Chrome 138+ (Canary/Dev channel) or Edge Canary
- 22+ GB free disk space (for AI models)
- 4+ GB VRAM (for on-device AI processing)
- Stable internet connection (for initial model downloads)

### First-Time Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/abodacs/chrome-ai-devbench.git
   cd chrome-ai-devbench
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Start development server:**

   ```bash
   pnpm dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

## Development Setup

### Chrome AI Configuration

To develop and test Chrome AI features, you must enable experimental flags:

1. Enable the following flags (set each to `Enabled`):

   **Core API Flags:**
   - [Summarization API](chrome://flags/#summarization-api-for-gemini-nano)
   - [Prompt API](chrome://flags/#prompt-api-for-gemini-nano)
   - [Prompt API Multimodal](chrome://flags/#prompt-api-for-gemini-nano-multimodal-input)
   - [Translation API](chrome://flags/#translation-api)
   - [Writer API](chrome://flags/#writer-api-for-gemini-nano)
   - [Rewriter API](chrome://flags/#rewriter-api-for-gemini-nano)
   - [Proofreader API](chrome://flags/#proofreader-api-for-gemini-nano)
   - [Language Detection API](chrome://flags/#language-detection-api)

   **Multilingual Flags (Chrome 141+, optional - for Spanish/Japanese support):**
   - [Summarization Multilingual](chrome://flags/#summarization-api-for-gemini-nano-multilingual)
   - [Prompt Multilingual Text](chrome://flags/#prompt-api-for-gemini-nano-multilingual-text)
   - [Writer Multilingual](chrome://flags/#writer-api-for-gemini-nano-multilingual)
   - [Rewriter Multilingual](chrome://flags/#rewriter-api-for-gemini-nano-multilingual)

2. Restart Chrome completely
3. On first use of each API, Chrome will download the required AI models (~1-2 GB per API)

### Verifying Setup

Run the test suite to ensure everything is configured correctly:

```bash
pnpm test
pnpm type-check
pnpm lint
```

## Project Structure

Chrome AI DevBench follows a **feature-driven architecture**:

```
chrome-ai-devbench/
├── src/
│   ├── features/
│   │   └── unified-playground/
│   │       └── api-modules/
│   │           ├── summarizer/          # Summarizer API module
│   │           ├── translator/          # Translator API module
│   │           ├── writer/              # Writer API module
│   │           ├── rewriter/            # Rewriter API module
│   │           ├── proofreader/         # Proofreader API module
│   │           ├── language-detection/  # Language Detection API module
│   │           ├── prompt/              # Prompt API module
│   │           └── shared/              # Shared components and utilities
│   ├── components/                      # Shared UI components
│   ├── services/                        # Global services
│   ├── hooks/                           # Global hooks
│   └── types/                           # TypeScript type definitions
├── tests/                               # Test suites
└── docs/                                # Documentation

```

### API Module Structure

Each API module follows a consistent structure:

```
api-module/
├── components/          # UI components
├── hooks/              # React hooks
├── services/           # Business logic
├── types/              # Type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
```

## Chrome AI Setup

### Supported APIs

The project includes playgrounds for all 7 Chrome Built-in AI APIs:

1. **Summarizer API** - Content summarization and condensation with advanced chunking
2. **Translator API** - Real-time language translation (13+ languages)
3. **Writer API** - Content generation and creative writing (18+ templates)
4. **Rewriter API** - Content restructuring and style adaptation
5. **Proofreader API** - Grammar improvement with CSS Custom Highlights
6. **Language Detection API** - Automatic language identification (40+ languages)
7. **Prompt API** - Flexible AI prompting with multimodal support (text + images)

### Testing with Chrome AI APIs

When developing features that use Chrome AI APIs:

- Always check API availability before use
- Handle model download states gracefully
- Implement proper error handling for API failures
- Test on actual Chrome Canary/Dev builds
- Mock API responses in unit tests

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/[name]` - New features
- `fix/[name]` - Bug fixes
- `docs/[name]` - Documentation updates

### Creating a Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### Development Commands

```bash
# Development
pnpm dev                # Start dev server with HMR
pnpm build              # Build for production
pnpm preview            # Preview production build

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix linting issues automatically
pnpm type-check         # TypeScript type checking
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report
pnpm test:unit          # Run unit tests only
pnpm test:integration   # Run integration tests only
pnpm test:e2e           # Run end-to-end tests

# Deployment
pnpm build:cloudflare   # Build for Cloudflare Pages
pnpm deploy:preview     # Deploy preview
pnpm deploy:production  # Deploy to production

# Maintenance
pnpm clean              # Clean build artifacts
pnpm check-deps         # Check for outdated dependencies
```

## Coding Standards

### TypeScript

- **Strict Mode**: TypeScript strict mode is enabled
- **Type Safety**: Avoid `any` types; use proper type definitions
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use const enums for better performance
- **Runtime Validation**: Use Zod for runtime type validation

### React

- **Functional Components**: Use function components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Props Interface**: Define explicit interfaces for component props
- **Event Handlers**: Use descriptive names (`handleClick`, `handleSubmit`)
- **State Management**: Use Zustand for global state, useState for local state

### Code Style

- **Formatting**: Prettier (configured in `.prettierrc`)
- **Linting**: ESLint (configured in `eslint.config.js`)
- **Naming Conventions**:
  - Components: `PascalCase` (e.g., `SummarizerPlayground`)
  - Hooks: `camelCase` with `use` prefix (e.g., `useSummarizer`)
  - Services: `PascalCase` (e.g., `SummarizerService`)
  - Files: Match the export name
- **File Organization**:
  - One component per file
  - Co-locate tests with implementation (`__tests__` folder)
  - Keep files under 300 lines when possible

### CSS and Styling

- **Tailwind CSS**: Use utility classes
- **shadcn/ui**: Prefer shadcn components
- **Custom Styles**: Use CSS modules if needed
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Follow WCAG 2.1 AA standards

## Testing Requirements

### Test Coverage

- **Target**: 80%+ code coverage
- **Required**: All new features must include tests
- **Types**:
  - Unit tests for hooks, services, utilities
  - Integration tests for API interactions
  - Component tests for UI behavior
  - E2E tests for critical user flows

### Writing Tests

**Unit Tests (Vitest):**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSummarizer } from './useSummarizer';

describe('useSummarizer', () => {
  it('should summarize text successfully', async () => {
    const { result } = renderHook(() => useSummarizer());

    await result.current.summarize('Long text here...');

    expect(result.current.summary).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });
});
```

**Component Tests:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SummarizerPlayground } from './SummarizerPlayground';

describe('SummarizerPlayground', () => {
  it('should render input and submit button', () => {
    render(<SummarizerPlayground />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument();
  });
});
```

### Test Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets 80% threshold
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No linting errors (`pnpm lint`)
- [ ] E2E tests pass for affected features
- [ ] Manual testing completed in Chrome Canary

## Pull Request Process

### Before Submitting

1. **Update from main:**

   ```bash
   git checkout main
   git pull origin main
   git checkout feature/my-feature
   git rebase main
   ```

2. **Run quality checks:**

   ```bash
   pnpm lint && pnpm type-check && pnpm test
   ```

3. **Build successfully:**
   ```bash
   pnpm build
   ```

### PR Template

When creating a pull request, include:

```markdown
## Description

[Brief description of changes]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related APIs

- [ ] Summarizer API
- [ ] Translator API
- [ ] Writer API
- [ ] Rewriter API
- [ ] Proofreader API
- [ ] Language Detection API
- [ ] Prompt API

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Coverage threshold met
```

### Review Process

1. **Automated Checks**: CI must pass (linting, type checking, tests)
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Changes tested in Chrome Canary/Dev
4. **Documentation**: Relevant docs updated
5. **Merge**: Squash and merge to main

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

### Scopes

Use API names or component areas:

- `summarizer`: Summarizer API changes
- `translator`: Translator API changes
- `writer`: Writer API changes
- `rewriter`: Rewriter API changes
- `proofreader`: Proofreader API changes
- `language-detection`: Language Detection API changes
- `prompt`: Prompt API changes
- `ui`: UI component changes
- `tests`: Test suite changes
- `docs`: Documentation changes

### Examples

```bash
feat(summarizer): add chunking support for large documents

Implements text chunking with configurable chunk size and overlap.
Includes progress tracking and error recovery.

Closes #123
```

```bash
fix(translator): resolve language detection timeout issue

Increases timeout threshold and adds retry logic for failed
language detection requests.

Fixes #456
```

```bash
docs(api): update Prompt API usage examples

Adds multimodal examples and streaming patterns.
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to" not "moves cursor to")
- Keep subject line under 72 characters
- Reference issues and PRs in footer
- Include breaking change warnings in footer

## Getting Help

### Resources

- **Architecture Guide**: See ARCHITECTURE.md for technical architecture details
- **Support**: See SUPPORT.md for common issues and troubleshooting
- **Security**: See SECURITY.md for security guidelines

### Community

- **Issues**: GitHub Issues - Report bugs or request features
- **Discussions**: GitHub Discussions - Ask questions
- **Pull Requests**: GitHub PRs - View or contribute code

### Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues and PRs
3. Ask in GitHub Discussions
4. Create a new issue with the `question` label

## Recognition

Contributors are recognized in:

- Git commit history
- Release notes
- Project README (for significant contributions)

Thank you for contributing to Chrome AI DevBench! Your contributions help make Chrome's built-in AI APIs more accessible to developers worldwide.

---

**Happy Coding!** 🚀
