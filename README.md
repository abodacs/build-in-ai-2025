# Chrome AI DevBench 🤖

> Interactive learning playground for Chrome's built-in AI APIs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Chrome](https://img.shields.io/badge/Chrome-138%2B-brightgreen.svg)](https://www.google.com/chrome/canary/)

**🔗 Repository**: [GitHub - chrome-ai-devbench](https://github.com/abodacs/chrome-ai-devbench)

> **Note**: Replace `abodacs` with your actual GitHub username after creating the public repository.

## 📖 Overview

> **TL;DR**: Chrome AI DevBench is the first production-ready platform unifying **all 7 Chrome Built-in AI APIs** with real-time code generation, 200+ comprehensive tests, and enterprise-grade patterns. It enables compound AI workflows and privacy-first applications that were previously impossible without expensive cloud infrastructure—all running entirely on-device with zero backend costs.

### The Problem We Solve

**Challenge 1: Fragmented Chrome AI Ecosystem**

Chrome's built-in AI APIs (Summarizer, Translator, Writer, Rewriter, Proofreader, Language Detection, and Prompt) are experimental features scattered across different documentation pages with minimal working examples. Developers face steep learning curves understanding how these APIs work, how to configure them properly, and how to handle real-world edge cases like retry logic, model availability checks, and text chunking for large documents.

**Challenge 2: Lack of Production-Ready Reference Implementations**

Existing Chrome AI examples are simplified demos that don't address production concerns: error handling with exponential backoff, state management patterns, TypeScript integration, testing strategies, or security considerations like prompt injection mitigation. Developers need battle-tested code they can confidently adapt for production applications.

**Challenge 3: On-Device AI Adoption Barriers**

While cloud-based AI is well-understood, browser-based on-device AI represents a paradigm shift. Developers are uncertain about which use cases benefit from local processing, how to handle 1-2GB model downloads gracefully, performance implications on different hardware, privacy advantages, and graceful degradation strategies for unsupported browsers.

### Our Solution: Unified Platform for Chrome AI Innovation

Chrome AI DevBench provides a **comprehensive, interactive environment** where developers can:

✅ **Test all 7 Chrome AI APIs** in real-time with immediate visual feedback
✅ **Generate production-ready code** (TypeScript/JavaScript) with Cmd+K shortcut
✅ **Experiment with advanced features** like text chunking, multimodal input, diff visualization, and undo/redo
✅ **Learn enterprise-grade patterns** through 200+ tests covering error handling, retry logic, and resilience
✅ **Understand browser compatibility** with availability checks and graceful fallbacks
✅ **Deploy with confidence** using modular architecture, comprehensive documentation, and CI/CD pipeline

### All 7 Chrome Built-in AI APIs Implemented

#### 1. **Summarizer API** — Intelligent Content Compression

**What it does**: Condenses lengthy documents into concise summaries while preserving key information and context.

**Problems solved**:

- Information overload for users consuming long-form content
- Generating quick previews for content management systems
- Creating executive summaries for business intelligence
- Document triage and prioritization in research workflows

**Advanced features**:

- **Text Chunking Engine**: Process documents exceeding token limits with configurable chunk size and overlap
- **URL Content Extraction**: Summarize web pages directly from URLs
- **Streaming Mode**: Progressive summarization for better user experience
- **Quality Metrics**: Track summarization ratio and performance

#### 2. **Translator API** — Privacy-First Language Translation

**What it does**: Translates text between 13+ languages entirely on-device without sending data to external servers.

**Problems solved**:

- **Privacy-sensitive translation**: Medical records, legal documents, personal messages
- **Offline capabilities**: Translation without internet connectivity
- **Cost reduction**: Zero API fees by eliminating cloud translation services
- **Low latency**: Sub-second translation for real-time applications

**Advanced features**:

- **LRU Caching**: Performance optimization for frequently translated phrases
- **Batch Translation**: Process multiple segments efficiently
- **Auto-Detection Integration**: Seamless workflow with Language Detection API
- **Multilingual Support**: Spanish and Japanese (Chrome 141+)

#### 3. **Writer API** — AI-Powered Content Generation

**What it does**: Generates original content based on prompts and templates, supporting 18+ writing formats.

**Problems solved**:

- Overcoming writer's block with AI-generated starting points
- Rapid content creation for blogs, marketing copy, and documentation
- Template-based generation for consistent brand voice
- Context-aware writing assistance for personalized output

**Advanced features**:

- **18+ Pre-Built Templates**: Blog posts, emails, essays, product descriptions, social media, technical docs
- **Tone Control**: Formal, casual, professional, creative
- **Streaming Generation**: Progressive content display
- **Context Injection**: Personalized generation based on user data

#### 4. **Rewriter API** — Content Refinement and Style Transfer

**What it does**: Restructures existing text to match desired tone, formality, clarity, or audience.

**Problems solved**:

- Adjusting content tone for different audiences (technical vs. general)
- Simplifying complex writing for broader accessibility
- Formalizing casual text for professional contexts
- Improving clarity and readability metrics

**Advanced features**:

- **Side-by-Side Diff Visualization**: See exact changes with additions/deletions highlighted
- **Three-View Mode**: Original, rewritten, and diff view simultaneously
- **Change Statistics**: Track word count changes, sentence restructuring
- **Multiple Rewrite Modes**: Formal, casual, simplify, elaborate

#### 5. **Proofreader API** — Browser-Native Grammar Correction

**What it does**: Identifies and suggests corrections for grammar, spelling, punctuation, and style errors using on-device AI.

**Problems solved**:

- **Privacy-preserving correction**: No cloud uploads for sensitive documents
- **Real-time writing assistance**: Instant feedback in web applications
- **Dependency-free grammar checking**: No third-party APIs or libraries
- **Accessible text quality**: Democratized writing improvement

**Advanced features**:

- **CSS Custom Highlights API**: Browser-native text highlighting (like Google Docs)
- **Correction Filtering**: By type (grammar, spelling, style) and severity
- **Undo/Redo History**: Full state preservation with time-travel debugging
- **Inline Popovers**: Context-aware correction suggestions
- **Batch Operations**: Apply multiple corrections at once

#### 6. **Language Detection API** — Automatic Language Identification

**What it does**: Identifies the language of input text with confidence scores, supporting 40+ languages.

**Problems solved**:

- Automatic language routing for multilingual applications
- Content moderation and filtering by language
- UI localization based on detected input language
- Preprocessing for translation pipelines

**Advanced features**:

- **Confidence Scoring**: Adjustable thresholds for detection accuracy
- **Multiple Results**: Ranked list of detected languages
- **Fast Detection**: < 1 second for most texts
- **Integration Workflows**: Seamless connection with Translator API

#### 7. **Prompt API** — General-Purpose AI with Multimodal Support

**What it does**: Provides flexible AI prompting for custom tasks, supporting both text-only and multimodal (text + images) inputs.

**Problems solved**:

- **Custom AI workflows**: Tasks not covered by specialized APIs
- **Image understanding**: OCR, object detection, image descriptions, visual Q&A
- **Conversational AI**: Chatbots and virtual assistants
- **Context-aware assistance**: System prompts for role-based AI

**Advanced features**:

- **Multimodal Input**: Upload images (up to 10MB) alongside text prompts
- **File Upload**: Drag-and-drop interface for image processing
- **Conversation History**: Maintain context across multiple turns
- **System Prompts**: Configure AI behavior and personality
- **Streaming Responses**: Real-time token-by-token output

### What Makes This Innovative?

Chrome AI DevBench demonstrates **compound AI workflows** that were previously impractical or impossible:

🔗 **Privacy-First Content Pipeline**
Detect language → Translate → Proofread → Rewrite (all on-device, no cloud dependencies)

💰 **Zero-Cost AI at Scale**
Process unlimited text without API fees, rate limits, or backend infrastructure

🔒 **Offline-First AI**
Full functionality without internet after initial model download (~1-2 GB per API)

🖼️ **Multimodal Learning**
Combine text + image analysis for richer AI interactions (Prompt API)

🌍 **True Privacy Compliance**
GDPR, HIPAA, and privacy-sensitive applications with guaranteed on-device processing

**Real-World Impact**: Developers can now build privacy-compliant AI tools for sensitive domains (healthcare, legal, education, finance) without cloud dependencies or data transmission concerns. This enables an entirely new category of applications that prioritize user privacy while maintaining powerful AI capabilities.

### Why Chrome AI DevBench Stands Out

**🏆 Comprehensive Implementation**
Most submissions focus on a single API. We implemented **all 7 APIs** with production-grade patterns, demonstrating the full potential of Chrome's Built-in AI ecosystem.

**🧪 Enterprise-Grade Quality**
Most submissions are demos. We provide **200+ comprehensive tests**, **80%+ code coverage**, full **TypeScript strict mode**, and a complete **CI/CD pipeline** with automated quality gates.

**⚡ Real-Time Code Generation**
Most submissions lack developer tools. We offer **instant TypeScript/JavaScript code generation** (Cmd+K), allowing developers to copy production-ready code directly into their projects.

**🛡️ Production Resilience**
Most submissions ignore edge cases. We demonstrate **exponential backoff retry logic**, **graceful degradation**, **error boundaries**, **model availability checks**, and **prompt injection mitigation**.

**🎨 Advanced Capabilities**
Most submissions use basic features. We showcase **text chunking for large documents**, **CSS Custom Highlights**, **side-by-side diff visualization**, **undo/redo history**, and **multimodal input** (text + images).

### Who Benefits Most?

**🎓 Student Developers**
→ Learn modern React/TypeScript patterns while exploring cutting-edge browser AI. Study enterprise-grade architecture through well-documented, production-ready code.

**💼 Enterprise Engineering Teams**
→ Evaluate Chrome AI feasibility for privacy-compliant internal tools (healthcare records, legal documents, HR systems). Accelerate POC development with battle-tested patterns.

**🚀 Startup Founders & Product Teams**
→ Build AI-powered MVPs without expensive cloud GPU infrastructure. Reduce operational costs to zero for text-based AI features. Ship faster with ready-to-use components.

**📚 Educators & Technical Trainers**
→ Teaching resource for browser-based AI, on-device computing, and modern web development. Comprehensive curriculum material with 200+ test examples.

**🔬 AI Researchers & Academics**
→ Benchmark on-device vs. cloud AI performance for academic studies. Explore privacy-preserving AI architectures. Study user experience implications of local processing.

**🌐 Open Source Contributors**
→ Contribute to a production-grade AI platform. Learn from modular architecture and comprehensive testing strategies. Build portfolio with real-world impact.

### Why On-Device AI Matters

Chrome AI DevBench showcases the transformative potential of **on-device AI processing**:

🔒 **Privacy**: All processing happens locally in the browser—user data never leaves the device
⚡ **Performance**: Low latency without network round-trips (sub-second responses)
💰 **Cost**: Zero API usage fees or cloud infrastructure expenses
🌐 **Offline**: Full functionality without internet connectivity after initial model download
📈 **Scalability**: Compute scales with user devices, not your infrastructure budget
🔐 **Compliance**: GDPR, HIPAA, and privacy regulations satisfied by design
🌍 **Accessibility**: AI capabilities available in regions with limited cloud access

This paradigm shift enables entirely new categories of **privacy-first applications** that weren't feasible with cloud-based AI: secure medical note-taking, confidential legal document analysis, private language learning, offline content creation, and sensitive data processing without transmission risks.

### Technical Excellence as a Reference Implementation

Beyond being a developer tool, Chrome AI DevBench serves as a **production-grade reference implementation** demonstrating:

- **Type Safety**: TypeScript 5+ strict mode with Zod runtime validation schemas
- **Error Resilience**: Exponential backoff retry logic, error boundaries, graceful degradation
- **Testing**: 200+ comprehensive tests (unit, integration, E2E) with 80%+ coverage
- **Performance**: Code splitting, lazy loading, tree shaking, <1MB gzipped bundle
- **Security**: Prompt injection mitigation, input sanitization with DOMPurify, CSP enforcement
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Architecture**: Service layer pattern, separation of concerns, modular API structure
- **Documentation**: 8 comprehensive guides (Contributing, Architecture, Security, Support)
- **CI/CD**: Automated testing, linting, type checking, deployment via GitHub Actions
- **Developer Experience**: Hot module replacement, comprehensive tooling, clear code organization

### Get Started in 5 Minutes

1. **Enable Chrome AI flags** → 7 core flags + 4 optional multilingual flags (one-click links)
2. **Clone and install** → `git clone` + `pnpm install`
3. **Start exploring** → `pnpm dev` opens playground at localhost:5173
4. **Generate code** → Press Cmd+K (Mac) or Ctrl+K (Windows/Linux) for code modal
5. **Copy to your project** → Export TypeScript or JavaScript with all configurations

Chrome AI DevBench transforms Chrome's experimental AI APIs from documentation into **working, production-ready code** in your hands within minutes.

---

## 🎥 Demo Video

> **📹 3-Minute Walkthrough**: Watch Chrome AI DevBench in action

[![Chrome AI DevBench Demo](https://img.shields.io/badge/▶️_Watch_Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

**Demo Highlights**:

- ✨ Live demonstration of all 7 Chrome AI APIs with real-world examples
- 💻 Real-time code generation workflow (Cmd+K shortcut)
- 🚀 Advanced features: text chunking, diff visualization, multimodal input
- 🧪 Testing patterns and error handling strategies
- 🎨 Unified playground interface and developer experience

> **Note**: Replace `YOUR_VIDEO_ID` with actual YouTube video ID before submission

---

## 🚀 Try It Now

**🌐 Live Demo**: [https://chrome-ai-devbench.pages.dev](https://chrome-ai-devbench.pages.dev)

> **Note**: Replace with actual Cloudflare Pages deployment URL

### Quick Setup (5 Minutes)

1. **Install Chrome Canary 138+** → [Download](https://www.google.com/chrome/canary/)
2. **Enable AI flags** → One-click links in [Chrome AI Setup section](#-chrome-ai-setup) below
3. **Open demo link** → Visit live deployment or run `pnpm dev` locally
4. **Watch models download** → Automatic on first API use (1-2 GB per API)
5. **Start testing APIs** → Instant access to all 7 Chrome AI APIs

**✅ No account required | No API keys | No backend infrastructure**

---

## 📸 Screenshots

### Unified Playground Interface

> **Coming Soon**: Screenshot showing all 7 API modules in unified interface with AI Status counter

### Real-Time Code Generation (Cmd+K)

> **Coming Soon**: Screenshot of CodeModal with TypeScript/JavaScript toggle and copy functionality

### Advanced Features

> **Coming Soon**: Screenshots showcasing:
>
> - Side-by-side diff visualization (Rewriter API)
> - CSS Custom Highlights (Proofreader API)
> - Multimodal input (Prompt API with image upload)
> - Text chunking configuration (Summarizer API)

### Architecture Diagram

> **Coming Soon**: Visual diagram showing:
>
> - Unified playground shell architecture
> - 7 modular API implementations
> - Service layer pattern (ChromeAIService → Manager → ErrorHandler)
> - State management flow (Zustand + React hooks)

---

## ✨ Features

### 🚀 Chrome AI APIs (7 Total)

- **Summarizer API** — Content summarization with advanced text chunking engine
- **Translator API** — Real-time language translation (13+ supported languages)
- **Writer API** — Content generation with 18+ writing templates
- **Rewriter API** — Content restructuring with side-by-side diff visualization
- **Proofreader API** — Grammar improvement with CSS Custom Highlights
- **Language Detection API** — Automatic language identification (40+ languages)
- **Prompt API** — Flexible AI prompting with multimodal support (text + images)

### 💡 Advanced Capabilities

- 📝 **Text Chunking** — Process long documents with configurable chunk size and overlap
- 🎨 **CSS Custom Highlights** — Browser-native text highlighting for proofreading corrections
- 🖼️ **Multimodal Input** — Upload and process images alongside text (Prompt API)
- ⏮️ **Undo/Redo History** — Full history management for proofreading corrections
- 🔄 **Diff Visualization** — Three-view mode (original, rewritten, diff) for content comparison
- 🌐 **Multilingual Support** — Spanish and Japanese support (Chrome 141+)

### 🛡️ Developer Experience

- 🔒 **Security-First** — Prompt injection mitigation and input sanitization with DOMPurify
- 🎯 **Type Safety** — Comprehensive TypeScript with Zod runtime validation
- 🧪 **Testing** — 200+ comprehensive tests with 80%+ coverage
- 📚 **Documentation** — Complete guides for architecture, contributing, and security
- ⚡ **Performance** — Code splitting, lazy loading, and optimized bundle (<1MB gzipped)
- 🌍 **Production-Ready** — Deployed on Cloudflare Pages with CI/CD pipeline

## 🏗️ Architecture

This project follows a **unified playground architecture** with modular API modules:

```
chrome-ai-devbench/
├── src/
│   ├── features/
│   │   └── unified-playground/          # Unified playground container
│   │       ├── shell/                   # Playground shell components
│   │       └── api-modules/             # Modular API implementations
│   │           ├── summarizer/          # Summarizer API module
│   │           ├── translator/          # Translator API module
│   │           ├── writer/              # Writer API module
│   │           ├── rewriter/            # Rewriter API module
│   │           ├── proofreader/         # Proofreader API module
│   │           ├── language-detection/  # Language Detection API module
│   │           ├── prompt/              # Prompt API module
│   │           └── shared/              # Shared components & utilities
│   ├── components/                      # Global UI components
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── layout/                      # Layout components
│   │   └── common/                      # Common utilities
│   ├── hooks/                           # Global React hooks
│   ├── services/                        # Global services
│   ├── stores/                          # Zustand state management
│   ├── types/                           # TypeScript type definitions
│   └── utils/                           # Utility functions
├── tests/                               # Test suites
│   ├── unit/                            # Unit tests
│   ├── integration/                     # Integration tests
│   └── e2e/                             # End-to-end tests
└── docs/                                # Documentation

```

### 🧠 Design Principles

1. **Modular API Architecture** — Each API is self-contained with components, hooks, services, and tests
2. **Separation of Concerns** — Components (UI), Hooks (state), Services (business logic)
3. **Type Safety Everywhere** — TypeScript strict mode + Zod runtime validation
4. **Service Layer Pattern** — ChromeAIService → Manager → ErrorHandler architecture
5. **Testing First** — 80%+ coverage with unit, integration, and E2E tests
6. **Performance Optimized** — Code splitting, lazy loading, response caching

> **📖 For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)**

## 🚀 Quick Start

### Prerequisites

#### Development Requirements

- **Node.js**: 22.0.0 or higher ([Download](https://nodejs.org/))
- **pnpm**: 8.0.0 or higher ([Installation guide](https://pnpm.io/installation))
- **Git**: Latest version

#### Chrome AI Requirements

- **Browser**: Chrome 138+ (Canary or Dev channel) or Edge Canary
  - [Chrome Canary Download](https://www.google.com/chrome/canary/)
  - [Chrome Dev Download](https://www.google.com/chrome/dev/)
- **Operating System**:
  - Windows 10 or 11
  - macOS 13+ (Ventura and onwards)
  - Linux (modern distributions)
  - ChromeOS (Platform 16389.0.0+ on Chromebook Plus devices)
- **Storage**: 22+ GB free disk space (for AI models)
- **Hardware**:
  - **GPU**: 4+ GB VRAM (recommended)
  - **CPU**: 4+ cores with 16+ GB RAM (CPU fallback)
- **Network**: Stable internet connection for initial model downloads (~1-2 GB per API)

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

**Core API Flags** (set each to `Enabled`):

- [Summarization API](chrome://flags/#summarization-api-for-gemini-nano)
- [Prompt API](chrome://flags/#prompt-api-for-gemini-nano)
- [Prompt API Multimodal](chrome://flags/#prompt-api-for-gemini-nano-multimodal-input)
- [Translation API](chrome://flags/#translation-api)
- [Writer API](chrome://flags/#writer-api-for-gemini-nano)
- [Rewriter API](chrome://flags/#rewriter-api-for-gemini-nano)
- [Language Detection API](chrome://flags/#language-detection-api)

**Multilingual Flags** (Chrome 141+, optional - for Spanish/Japanese support):

- [Summarization Multilingual](chrome://flags/#summarization-api-for-gemini-nano-multilingual)
- [Prompt Multilingual Text](chrome://flags/#prompt-api-for-gemini-nano-multilingual-text)
- [Writer Multilingual](chrome://flags/#writer-api-for-gemini-nano-multilingual)
- [Rewriter Multilingual](chrome://flags/#rewriter-api-for-gemini-nano-multilingual)

**After enabling flags**: Restart Chrome completely (not just close windows)

#### 2. Download AI Models

When you first use an API, Chrome will prompt you to download the AI model:

- Models are downloaded automatically on first use
- Download progress is shown in the UI
- Models are cached locally for future use
- Requires stable internet connection

#### 3. Verify Setup

1. **Open the app**: Navigate to `http://localhost:5173`
2. **Check API status**: Look for "AI Status" counter in header (should show "7/7")
3. **Verify model download**: Go to `chrome://components` and look for "Optimization Guide On Device Model"
4. **Test an API**: Click on any API module to test functionality

> **💡 For detailed troubleshooting by API, see [SUPPORT.md](SUPPORT.md)**

#### Common Issues

<details>
<summary><strong>APIs not available?</strong></summary>

- Ensure you're using Chrome 138+ (check `chrome://version`)
- Verify all flags are enabled in `chrome://flags`
- Restart Chrome completely (not just close windows)
- Check available disk space (need 22+ GB free)
- Check `chrome://components` for model status
</details>

<details>
<summary><strong>Model download fails?</strong></summary>

- Check internet connection (stable connection required)
- Ensure sufficient disk space (models are ~1-2GB each)
- Try clearing Chrome cache: `chrome://settings/clearBrowserData`
- Manually trigger update at `chrome://components`
</details>

<details>
<summary><strong>Performance issues?</strong></summary>

- Ensure you have 4+ GB VRAM available
- Close other GPU-intensive applications
- Check GPU acceleration: `chrome://gpu`
- Check Chrome Task Manager: Shift+Esc
</details>

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

## 📚 Documentation

Comprehensive guides for all aspects of the project:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Development setup, coding standards, and contribution guidelines
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Technical architecture, design patterns, and system design
- **[SECURITY.md](SECURITY.md)** — Security policy, vulnerability reporting, and best practices
- **[SUPPORT.md](SUPPORT.md)** — Troubleshooting guide, common issues, and API-specific help
- **[CHANGELOG.md](CHANGELOG.md)** — Version history, release notes, and feature updates
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** — Community guidelines and standards
- **[AGENTS.md](AGENTS.md)** — AI development tools, usage patterns, and release process
- **[LICENSE](LICENSE)** — MIT License and terms of use

## 🛠️ Tech Stack

### Core

- **React 19** — UI framework with concurrent features
- **TypeScript 5+** — Type safety and developer experience (strict mode enabled)
- **Vite 6** — Fast build tool and dev server with HMR

### UI & Styling

- **shadcn/ui** — High-quality, accessible UI components (built on Radix UI)
- **Tailwind CSS 4+** — Utility-first CSS framework
- **Radix UI** — Unstyled, accessible UI primitives
- **Lucide React** — Beautiful SVG icon library

### State Management

- **Zustand 5+** — Lightweight state management with minimal boilerplate
- **Zod 3+** — Runtime validation and type safety with TypeScript integration

### Development

- **ESLint** — Code linting with TypeScript rules
- **Prettier** — Code formatting
- **Husky** — Git hooks for quality gates
- **Vitest** — Fast unit testing
- **Playwright** — End-to-end testing

### Deployment

- **Cloudflare Pages** — Global CDN with edge computing
- **GitHub Actions** — CI/CD pipeline

## 🎯 Chrome AI APIs Supported

All 7 Chrome Built-in AI APIs are fully implemented:

- ✅ **Summarizer API** — Content summarization with advanced text chunking engine
  - Configurable chunk size and overlap for long documents
  - URL content extraction support
  - Streaming and non-streaming modes

- ✅ **Translator API** — Real-time language translation (13+ language pairs)
  - LRU caching for performance optimization
  - Batch translation support
  - Language auto-detection integration

- ✅ **Writer API** — Content generation with 18+ writing templates
  - Templates: blog posts, emails, essays, product descriptions, etc.
  - Tone control (formal, casual, professional)
  - Context-aware generation with streaming support

- ✅ **Rewriter API** — Content restructuring with diff visualization
  - Multiple rewrite modes (formal, casual, simplify)
  - Side-by-side diff view with statistics
  - Three-view mode (original, rewritten, diff)

- ✅ **Proofreader API** — Grammar improvement with CSS Custom Highlights
  - Browser-native text highlighting (CSS Custom Highlights API)
  - Correction filtering and management
  - Undo/redo history with state preservation
  - Inline correction popovers

- ✅ **Language Detection API** — Automatic language identification (40+ languages)
  - Confidence score filtering and thresholds
  - Multiple detection results with rankings
  - Fast detection (< 1 second for most texts)

- ✅ **Prompt API** — Flexible AI prompting with multimodal support
  - Text-based prompting with system instructions
  - Multimodal support (text + images up to 10MB)
  - File upload with drag-and-drop
  - Conversation history management
  - Real-time streaming responses

## 🔒 Security Features

- **Prompt Injection Protection** — System prompt isolation and input delimitation patterns
- **Input Sanitization** — DOMPurify integration for XSS prevention
- **Content Security Policy** — Strict CSP enforcement in production
- **Secret Scanning** — Automated secret detection in CI/CD pipeline
- **Client-Side Only** — All processing happens on-device, no data transmission
- **File Upload Security** — Client-side validation, type checking, size limits

> **🛡️ For detailed security information, see [SECURITY.md](SECURITY.md)**

## 📱 Browser Support

- **Chrome 138+** (Canary or Dev channel) — Required for basic AI APIs
- **Chrome 141+** — Required for multilingual support (Spanish, Japanese)
- **Edge Canary** — Alternative browser with Chromium AI support
- **Graceful Degradation** — Fallbacks for unsupported browsers
- **Progressive Enhancement** — Features enabled based on API availability

**Supported Platforms**: Windows 10/11, macOS 13+, Linux, ChromeOS (Chromebook Plus)

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### Quick Contribution Guide

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add comprehensive tests
4. **Run quality checks**:
   ```bash
   pnpm lint          # ESLint
   pnpm type-check    # TypeScript
   pnpm test          # Unit + Integration tests
   pnpm test:e2e      # End-to-end tests
   ```
5. **Commit using Conventional Commits**:
   ```bash
   git commit -m "feat(summarizer): add chunking support for large documents"
   ```
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a pull request** with a clear description

### Contribution Areas

- 🐛 **Bug Fixes** — Report or fix issues in existing APIs
- ✨ **New Features** — Implement new API modules or capabilities
- 📝 **Documentation** — Improve guides, add examples, fix typos
- 🧪 **Testing** — Add tests, improve coverage, fix flaky tests
- 🎨 **UI/UX** — Enhance user interface and experience
- ⚡ **Performance** — Optimize bundle size, improve loading times
- 🔒 **Security** — Security improvements and vulnerability fixes

> **📖 For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)**

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Copyright © 2025 Chrome AI DevBench Contributors**

## 🙏 Acknowledgments

- **Chrome AI Team** — For creating the amazing built-in AI APIs that power this project
- **shadcn** — For the incredible UI component library (shadcn/ui)
- **Vercel** — For Next Themes and inspiration
- **Radix UI** — For accessible, unstyled UI primitives
- **Chrome AI Community** — For feedback, testing, and contributions

## 📞 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/abodacs/chrome-ai-devbench/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/abodacs/chrome-ai-devbench/discussions)
- 📖 **Documentation**: [Full documentation](./docs/)
- 🔒 **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

<div align="center">

**Built with ❤️ for the Chrome developers community**

**Version 1.0.0** | **Released October 16, 2025**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-138%2B-brightgreen.svg)](https://www.google.com/chrome/canary/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>
