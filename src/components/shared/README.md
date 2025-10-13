# Shared Components

Reusable UI components used across multiple API playground modules.

## Components

### ViewCodeButton

**Location:** `@chrome-ai-devbench/src/components/shared/ViewCodeButton.tsx`

A consistent "View Code" button used in all API playground configuration panels.

**Quick Start:**

```tsx
import { ViewCodeButton } from '@/components/shared/ViewCodeButton';

<ViewCodeButton onClick={() => setIsCodeModalOpen(true)} />;
```

**Documentation:** See [/docs/components/view-code-button.md](../../docs/components/view-code-button.md)

**Used In:**

- Summarizer Config (`/api-modules/summarizer/components/SummarizerConfig.tsx`)
- Translator Config (`/api-modules/translator/components/TranslatorConfig.tsx`)
- Future: Writer, Rewriter, Language Detector modules

---

## Adding New Shared Components

When creating a new shared component:

1. **Create the component** in `src/components/shared/`
2. **Add documentation** in `docs/components/`
3. **Update this README** with a brief description and link to docs
4. **Export from index** if needed
5. **Add unit tests** in `__tests__/` directory

## Design Principles

Shared components should:

- ✅ Be **reusable** across multiple modules
- ✅ Have **consistent styling** with the design system
- ✅ Include **comprehensive documentation**
- ✅ Support **dark mode**
- ✅ Be **accessible** (ARIA labels, keyboard navigation)
- ✅ Have **clear APIs** with TypeScript types
