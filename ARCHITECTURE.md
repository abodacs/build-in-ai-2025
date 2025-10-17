# Architecture Documentation

> **Ultrathink Architecture**: Modular, Testable, Production-Ready Chrome AI Integration

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Module Architecture](#api-module-architecture)
- [State Management](#state-management)
- [Service Layer](#service-layer)
- [Component Patterns](#component-patterns)
- [Testing Architecture](#testing-architecture)
- [Build and Deployment](#build-and-deployment)

## Overview

Chrome AI DevBench is built on a feature-driven architecture that prioritizes modularity, type safety, and developer experience. The application is a static Single-Page Application (SPA) running entirely client-side, leveraging Chrome's built-in AI APIs for on-device processing.

### Core Design Goals

1. **Zero Backend Dependency**: Fully client-side architecture
2. **Type-Safe Development**: Comprehensive TypeScript coverage
3. **Modular API Integration**: Self-contained API modules
4. **Production-Ready Code**: Enterprise-grade error handling and resilience
5. **Developer Experience**: Intuitive APIs and excellent debugging capabilities

## Design Principles

### 1. Feature-First Architecture

Each Chrome AI API is implemented as an independent, self-contained module with its own:

- UI components
- Business logic (services)
- Custom React hooks
- Type definitions
- Utility functions
- Test suites

### 2. Separation of Concerns

- **Components**: Pure presentation logic
- **Hooks**: State management and side effects
- **Services**: Business logic and AI API integration
- **Utils**: Shared utility functions
- **Types**: TypeScript type definitions

### 3. Type Safety Everywhere

- TypeScript 5+ strict mode enabled
- Zod schemas for runtime validation
- Explicit interfaces for all data structures
- No implicit `any` types

### 4. Error Resilience

- Graceful degradation for unavailable APIs
- Comprehensive error handling
- Retry logic with exponential backoff
- User-friendly error messages

### 5. Performance Optimization

- Code splitting by route
- Lazy loading of API modules
- Response caching
- Bundle size optimization

## Technology Stack

### Frontend Framework

- **React 19**: UI framework with concurrent features
- **TypeScript 5**: Type safety and developer experience
- **Vite 6**: Build tool with fast HMR

**Why React + Vite instead of Next.js?**

- Simpler static deployment
- Faster development builds
- Better suited for client-side AI processing
- Smaller bundle sizes
- No server infrastructure needed

### UI and Styling

- **shadcn/ui**: Accessible UI components (built on Radix UI)
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide React**: Icon library

### State Management

- **Zustand 5**: Lightweight state management
- **Zod 3**: Runtime validation

**Why Zustand?**

- Minimal boilerplate
- Excellent TypeScript support
- Built-in DevTools integration
- Optimal re-render performance

### Testing

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Testing Library**: Component testing

### Deployment

- **Cloudflare Pages**: Global CDN with edge computing
- **GitHub Actions**: CI/CD pipeline

## Project Structure

```
chrome-ai-devbench/
├── src/
│   ├── features/
│   │   └── unified-playground/
│   │       ├── shell/                 # Playground container
│   │       └── api-modules/
│   │           ├── summarizer/        # Summarizer API module
│   │           ├── translator/        # Translator API module
│   │           ├── writer/            # Writer API module
│   │           ├── rewriter/          # Rewriter API module
│   │           ├── proofreader/       # Proofreader API module
│   │           ├── language-detection/ # Language Detection module
│   │           ├── prompt/            # Prompt API module
│   │           └── shared/            # Shared components
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── layout/                    # Layout components
│   │   └── common/                    # Common utilities
│   ├── hooks/                         # Global hooks
│   ├── services/                      # Global services
│   ├── stores/                        # Zustand stores
│   ├── types/                         # TypeScript types
│   ├── utils/                         # Utility functions
│   └── lib/                           # Third-party integrations
├── tests/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
├── public/                            # Static assets
└── docs/                              # Documentation
```

## API Module Architecture

### Module Structure

Each API module follows a consistent structure:

```
api-module/
├── components/
│   ├── tabs/
│   │   ├── PlaygroundTab.tsx         # Main interaction UI
│   │   ├── CodeTab.tsx               # Code generation view
│   │   └── AdvancedTab.tsx           # Advanced features
│   ├── ModuleConfig.tsx              # Configuration panel
│   ├── ModuleInput.tsx               # Input handling
│   ├── ModuleResults.tsx             # Results display
│   └── [Other Components]            # Additional UI components
├── hooks/
│   ├── useModuleAPI.ts               # Main API hook
│   ├── useModuleAvailability.ts      # Availability detection
│   └── [Other Hooks]                 # Feature-specific hooks
├── services/
│   ├── ChromeAIService.ts            # API wrapper
│   ├── ModuleManager.ts              # High-level orchestration
│   ├── ErrorHandler.ts               # Error handling
│   └── [Other Services]              # Feature-specific services
├── types/
│   ├── module.types.ts               # Core types
│   └── [Other Types]                 # Feature-specific types
├── utils/
│   └── [Utilities]                   # Module-specific utilities
└── __tests__/
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── e2e/                          # E2E tests
```

### Example: Summarizer API Module

**Location**: `src/features/unified-playground/api-modules/summarizer/`

**Components** (15+):

- `PlaygroundTab.tsx` - Main UI
- `CodeModal.tsx` - Code overlay with Cmd+K support
- `SummarizerConfig.tsx` - Configuration panel
- `SummarizerInput.tsx` - Text input with smart detection
- `SummarizerResults.tsx` - Results with metrics
- `SparkButton.tsx` - Animated action button
- `QuickSamplesDialog.tsx` - Sample content
- And more...

**Services** (6):

- `ChromeAIService.ts` - Direct Chrome API wrapper
- `SummarizerManager.ts` - Business logic orchestration
- `ChunkingEngine.ts` - Text chunking for long content
- `URLExtractor.ts` - URL content extraction
- `ErrorHandler.ts` - Error classification and recovery
- `ChromeAICompatibility.ts` - Browser compatibility checks

**Hooks** (2):

- `useSummarizer.ts` - Main hook for summarization
- `useSummarizerAvailability.ts` - API availability detection

## State Management

### Zustand Store Architecture

**Global Store**: `src/stores/appStore.ts`

```typescript
interface AppStore {
  // API state
  activeApi: string;
  apiCapabilities: Record<string, string>;

  // UI state
  theme: 'light' | 'dark';
  codeLanguage: 'js' | 'ts';

  // Results
  apiResult: ApiResult | null;
  isLoading: boolean;

  // Actions
  setActiveApi: (api: string) => void;
  setCodeLanguage: (lang: 'js' | 'ts') => void;
  setApiResult: (result: ApiResult) => void;
  // ... other actions
}
```

**Module-Level State**:

- Managed by custom hooks (`useState`, `useReducer`)
- Focused on feature-specific state
- Integrated with global store when needed

**State Flow**:

1. User interaction → Component
2. Component → Custom Hook
3. Hook → Service Layer
4. Service → Chrome AI API
5. Response → Hook → Component
6. Update → Zustand Store (if global)

## Service Layer

### Three-Tier Service Architecture

#### 1. Chrome AI Service (Low-Level)

**Purpose**: Direct wrapper around Chrome AI APIs

```typescript
// src/services/ChromeAIService.ts
class ChromeAIService {
  async checkAvailability(): Promise<string>;
  async createSession(options: SessionOptions): Promise<Session>;
  async process(session: Session, input: string): Promise<string>;
  async destroy(session: Session): Promise<void>;
}
```

#### 2. Manager Service (Mid-Level)

**Purpose**: High-level orchestration and business logic

```typescript
// api-modules/summarizer/services/SummarizerManager.ts
class SummarizerManager {
  async summarize(input: string, options: Options): Promise<Result>;
  async summarizeStreaming(input: string, onChunk: Callback): Promise<Result>;
  async summarizeWithChunking(input: string): Promise<Result>;
}
```

#### 3. Error Handler (Cross-Cutting)

**Purpose**: Error classification and recovery strategies

```typescript
// api-modules/*/services/ErrorHandler.ts
class ErrorHandler {
  classifyError(error: Error): ErrorType;
  getRecoveryStrategy(errorType: ErrorType): Strategy;
  async retry<T>(operation: () => Promise<T>): Promise<T>;
}
```

### Service Communication Flow

```
Component
  ↓
Custom Hook
  ↓
Manager Service  ←→  Error Handler
  ↓
Chrome AI Service
  ↓
Chrome Built-in AI API
```

## Component Patterns

### Component Composition

**Atomic Design Principles**:

- **Atoms**: Basic UI elements (Button, Input, Badge)
- **Molecules**: Simple combinations (SearchBox, ConfigPanel)
- **Organisms**: Complex features (SummarizerPlayground, CodeModal)
- **Templates**: Page layouts (PlaygroundContainer)

### Key Component Patterns

#### 1. View Code Integration

**CodeModal Component** (`summarizer/components/CodeModal.tsx`):

- Overlay design for non-blocking code viewing
- Keyboard shortcut: Cmd+K / Ctrl+K
- Real-time code generation based on current configuration
- Language toggle: TypeScript ↔ JavaScript
- Copy to clipboard and download functionality

#### 2. Error Boundary System

**ErrorDisplay Component** (`shared/components/ErrorDisplay.tsx`):

- Wraps each major section
- Recovery action buttons
- User-friendly error messages
- Technical details available for debugging

#### 3. Resilient UI Components

**LoadingScreen**: Progress tracking for async operations
**ResultsSkeleton**: Skeleton screens during loading
**StreamingIndicator**: Real-time feedback for streaming responses
**ModelDownloadProgress**: Model download status

### Component Communication

- **Props**: Parent to child data flow
- **Callbacks**: Child to parent events
- **Context**: Cross-cutting concerns (theme, auth)
- **Zustand**: Global state access

## Testing Architecture

### Test Pyramid

```
        E2E Tests (10%)
       Integration Tests (30%)
      Unit Tests (60%)
```

### Testing Strategy

**Unit Tests** (Vitest):

- Services: Business logic testing
- Hooks: State management testing
- Utils: Pure function testing
- Coverage target: 90%+

**Integration Tests** (Testing Library):

- Component integration
- Service layer integration
- API mocking with MSW
- Coverage target: 80%+

**E2E Tests** (Playwright):

- Critical user flows
- Cross-browser testing
- Visual regression testing
- Coverage: All main features

### Mocking Chrome AI APIs

```typescript
// __tests__/mocks/chromeAI.ts
const mockSummarizer = {
  summarize: vi.fn(),
  destroy: vi.fn(),
};

globalThis.Summarizer = {
  create: vi.fn().mockResolvedValue(mockSummarizer),
  availability: vi.fn().mockResolvedValue('readily'),
};
```

## Build and Deployment

### Build Pipeline

```bash
# Development
pnpm dev                # Vite dev server with HMR

# Production Build
pnpm type-check         # TypeScript validation
pnpm lint               # ESLint
pnpm test               # Run test suite
pnpm build              # Vite production build
```

### Build Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Minification**: Terser for production
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: vite-bundle-analyzer

### Deployment

**Platform**: Cloudflare Pages

**CI/CD Pipeline** (GitHub Actions):

1. Run tests
2. Type check
3. Lint
4. Build
5. Deploy to Cloudflare Pages

**Deployment Targets**:

- Preview: On pull requests
- Production: On main branch merges

### Performance Targets

- **Initial Load**: < 3s on 3G
- **Time to Interactive**: < 1s
- **Bundle Size**: < 1MB (gzipped)
- **Lighthouse Score**: 90+ across all categories

## Key Architectural Patterns

### 1. Service Singleton Pattern

```typescript
class SummarizerService {
  private static instance: SummarizerService;

  static getInstance(): SummarizerService {
    if (!SummarizerService.instance) {
      SummarizerService.instance = new SummarizerService();
    }
    return SummarizerService.instance;
  }
}
```

### 2. Manager Pattern

High-level orchestration that coordinates multiple services:

```typescript
class SummarizerManager {
  constructor(
    private service: ChromeAIService,
    private chunker: ChunkingEngine,
    private errorHandler: ErrorHandler,
  ) {}

  async summarizeWithChunking(input: string): Promise<Result> {
    const chunks = this.chunker.split(input);
    const summaries = await Promise.all(
      chunks.map((chunk) => this.summarize(chunk)),
    );
    return this.chunker.combine(summaries);
  }
}
```

### 3. Hook Composition Pattern

```typescript
function useSummarizer() {
  const service = useMemo(() => SummarizerService.getInstance(), []);
  const [state, setState] = useState(initialState);

  const summarize = useCallback(
    async (input: string) => {
      // Implementation
    },
    [service],
  );

  return { summarize, state };
}
```

### 4. Error Recovery Pattern

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await delay(2 ** attempt * 1000); // Exponential backoff
    }
  }
}
```

## Chrome AI Integration

### API Availability Detection

```typescript
async function checkAPIAvailability(): Promise<Record<string, string>> {
  const apis = [
    'Summarizer',
    'Translator',
    'Writer',
    'Rewriter',
    'Proofreader',
    'LanguageDetector',
    'LanguageModel', // Prompt API
  ];

  const availability = {};
  for (const api of apis) {
    if (api in globalThis) {
      availability[api] = await globalThis[api].availability();
    } else {
      availability[api] = 'no';
    }
  }

  return availability;
}
```

### Session Management

```typescript
class SessionManager {
  private sessions = new Map<string, AISession>();

  async createSession(apiName: string, options: Options): Promise<string> {
    const sessionId = generateId();
    const session = await globalThis[apiName].create(options);
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.destroy();
      this.sessions.delete(sessionId);
    }
  }
}
```

## Future Architecture Considerations

### Scalability

- **Module Federation**: For micro-frontend architecture
- **Web Workers**: For heavy computation offload
- **Service Worker**: For offline functionality
- **IndexedDB**: For local data persistence

### Performance

- **Virtual Scrolling**: For large result sets
- **Debouncing**: For search and input handling
- **Request Cancellation**: AbortController integration
- **Memory Management**: Proper cleanup and garbage collection

### Developer Experience

- **VS Code Extension**: For code generation
- **CLI Tools**: For project scaffolding
- **Storybook**: For component documentation
- **API Mocking**: Improved development workflow

---

**Document Version**: 1.0
**Last Updated**: October 16, 2025
**Maintainers**: Chrome AI DevBench Team

For questions or suggestions about the architecture, please open a GitHub Discussion.
