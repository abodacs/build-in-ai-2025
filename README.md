# Chrome AI DevBench 🤖

> Interactive learning playground for Chrome's built-in AI APIs

## ✨ Features

- 🔮 **Interactive AI Playground** - Test Chrome AI APIs in real-time
- 🔒 **Security-First** - Built-in prompt injection mitigation examples
- 🔄 **Hybrid AI Strategy** - On-device with cloud fallback patterns
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- ⚡ **Performance Optimized** - Vite + React + TypeScript
- 🌍 **Global CDN** - Deployed on Cloudflare Pages

## 🏗️ Architecture

This project follows a **feature-driven architecture** designed for scalability and developer experience:

```
src/
├── features/              # Domain-driven feature modules
│   ├── api-playground/    # Interactive AI API testing
│   │   ├── components/    # Feature-specific components
│   │   ├── hooks/         # Feature-specific hooks
│   │   ├── services/      # Feature business logic
│   │   ├── types/         # Feature type definitions
│   │   └── utils/         # Feature utilities
│   ├── security-demo/     # Security demonstrations
│   ├── hybrid-ai/         # Hybrid AI strategies
│   └── code-display/      # Code snippet generation
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── common/           # Common utility components
├── hooks/                # Global hooks
├── services/             # Global services (AI API wrappers)
├── stores/               # Zustand global state
├── types/                # Global TypeScript types
├── utils/                # Global utilities
└── lib/                  # Third-party integrations
```

### 🧠 Design Principles

1. **Feature-First**: Each feature is self-contained with its own components, logic, and state
2. **Separation of Concerns**: UI components are purely presentational
3. **Type Safety**: Comprehensive TypeScript with Zod runtime validation
4. **Developer Experience**: Hot reloading, comprehensive tooling, and clear documentation
5. **Performance**: Code splitting, tree shaking, and optimized bundle size

## 🚀 Quick Start

### Prerequisites

#### Development Requirements
- Node.js 22+
- pnpm 8+

#### Chrome AI Requirements
- **Browser**: Chrome 138+ (Canary/Dev) or Edge Canary
- **Storage**: 22+ GB free disk space (for AI models)
- **VRAM**: 4+ GB (for on-device AI processing)
- **Network**: Required for initial model download (~1-2 GB per API)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd chrome-ai-devbench

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 🔧 Chrome AI Setup

To use Chrome's built-in AI APIs, you need to enable experimental features:

#### 1. Enable Chrome AI Flags

1. Open Chrome and navigate to `chrome://flags`
2. Enable the following flags:
   - **Summarization API for Gemini Nano** → `Enabled`
   - **Prompt API for Gemini Nano** → `Enabled`
   - **Translation API** → `Enabled`
   - **Writer API** → `Enabled`
   - **Rewriter API** → `Enabled`
   - **Language Detection API** → `Enabled`
3. Restart Chrome

#### 2. Download AI Models

When you first use an API, Chrome will prompt you to download the AI model:

- Models are downloaded automatically on first use
- Download progress is shown in the UI
- Models are cached locally for future use
- Requires stable internet connection

#### 3. Verify Setup

1. Open the app: `http://localhost:5173`
2. Check the header for API status indicators
3. Green badges = APIs ready to use
4. Click on any API to test functionality

#### Troubleshooting

**APIs not available?**
- Ensure you're using Chrome 138+ (check `chrome://version`)
- Verify flags are enabled in `chrome://flags`
- Try restarting Chrome completely
- Check available disk space (need 22+ GB free)

**Model download fails?**
- Check internet connection
- Ensure sufficient disk space
- Try clearing Chrome cache: `chrome://settings/clearBrowserData`
- Check `chrome://components` for model status

**Performance issues?**
- Ensure you have 4+ GB VRAM
- Close other GPU-intensive applications
- Check GPU acceleration: `chrome://gpu`

### Development Commands

```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run end-to-end tests

# Deployment
pnpm build:cloudflare # Build for Cloudflare Pages
pnpm deploy:preview   # Deploy preview
pnpm deploy:production # Deploy to production
```

## 🛠️ Tech Stack

### Core
- **React 19** - UI framework with concurrent features
- **TypeScript 5** - Type safety and developer experience
- **Vite 6** - Fast build tool and dev server

### UI & Styling
- **shadcn/ui** - High-quality, accessible UI components
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful SVG icons

### State Management
- **Zustand** - Lightweight state management
- **Zod** - Runtime validation and type safety

### Development
- **ESLint** - Code linting with TypeScript rules
- **Prettier** - Code formatting
- **Husky** - Git hooks for quality gates
- **Vitest** - Fast unit testing
- **Playwright** - End-to-end testing

### Deployment
- **Cloudflare Pages** - Global CDN with edge computing
- **GitHub Actions** - CI/CD pipeline

## 🎯 Chrome AI APIs Supported

- ✅ **Summarizer API** - Content summarization
- ✅ **Translator API** - Real-time translation
- ✅ **Writer API** - Content generation
- ✅ **Rewriter API** - Content restructuring
- ✅ **Proofreader API** - Grammar improvement
- ✅ **Prompt API** - Flexible AI prompting
- ✅ **Language Detection** - Automatic language identification

## 🔒 Security Features

- **Prompt Injection Protection** - Interactive examples and mitigation strategies
- **Input Sanitization** - DOMPurify integration for safe content rendering
- **Content Security Policy** - Configured for production deployments
- **Secret Scanning** - Automated secret detection in CI/CD

## 📱 Browser Support

- Chrome 140+ (with AI APIs enabled)
- Graceful fallbacks for unsupported browsers
- Progressive enhancement approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run quality checks: `pnpm lint && pnpm type-check && pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome AI Team for the amazing built-in AI APIs
- shadcn for the incredible UI component library

---

**Built with ❤️ for the Chrome developers community**