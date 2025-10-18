# Responsive Design Guide

> Comprehensive guide for implementing and testing responsive design in the Chrome AI DevBench unified playground.

## Table of Contents

- [Overview](#overview)
- [Breakpoints](#breakpoints)
- [Touch Targets](#touch-targets)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [File Locations](#file-locations)

## Overview

This project follows WCAG AAA accessibility standards with mobile-first responsive design principles. All components are optimized for touch devices while maintaining excellent desktop experiences.

### Key Principles

1. **Mobile-First**: Start with mobile layouts, enhance for larger screens
2. **Touch-Optimized**: 48px minimum touch targets (WCAG AAA)
3. **Fluid Typography**: Smooth font scaling across breakpoints
4. **Progressive Enhancement**: Core functionality works everywhere
5. **Performance**: Debounced resize handlers, efficient re-renders

## Breakpoints

### Defined Breakpoints

```typescript
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

// Pixel ranges
mobile:  0-767px    // Phones
tablet:  768-1023px // Tablets
desktop: 1024-1535px // Laptops/monitors
wide:    1536px+    // Large displays
```

### Usage with `useBreakpoint` Hook

```tsx
import { useBreakpoint } from '@/features/unified-playground/shared/hooks/useBreakpoint';

function MyComponent() {
  const breakpoint = useBreakpoint();

  return (
    <div>
      {breakpoint === 'mobile' && <MobileView />}
      {breakpoint === 'desktop' && <DesktopView />}
    </div>
  );
}
```

### Tailwind Breakpoints

```css
sm:   min-width: 640px
md:   min-width: 768px
lg:   min-width: 1024px
xl:   min-width: 1280px
2xl:  min-width: 1536px
```

**Common Patterns**:

```tsx
// Hide on mobile, show on tablet+
<span className="hidden sm:inline">Desktop Label</span>

// Different sizing
<Button className="h-12 lg:h-10">Submit</Button>

// Responsive margins
<div className="mx-4 sm:mx-6 lg:mx-8">Content</div>
```

## Touch Targets

### WCAG AAA Compliance

All interactive elements must meet touch target requirements:

- **Minimum**: 48x48px (WCAG AAA)
- **Primary Actions**: 56x56px recommended
- **Spacing**: 8px minimum between targets

### Utility Classes

```css
/* Touch Target Sizes */
.touch-target    /* 48x48px minimum */
.touch-target-lg /* 56x56px for primary actions */

/* Touch Spacing */
.touch-gap       /* 8px gap between interactive elements */

/* Touch Optimization */
.tap-fast        /* Removes 300ms tap delay */
```

### Button Patterns

```tsx
// Standard responsive button
<Button className="h-10 lg:h-8 tap-fast">
  Action
</Button>

// Primary action (larger)
<Button className="h-12 lg:h-10 tap-fast">
  <Icon className="mr-2 h-4 w-4 sm:mr-1" />
  <span className="hidden sm:inline">Submit</span>
</Button>

// Icon-only on mobile, labeled on desktop
<Button className="h-10 lg:h-8 px-2 sm:px-3 tap-fast">
  <Copy className="w-4 h-4" />
  <span className="hidden sm:inline ml-1.5 text-xs">Copy</span>
</Button>
```

### Button Groups

```tsx
// Proper spacing between touch targets
<div className="flex items-center touch-gap">
  <Button className="h-10 lg:h-8 tap-fast">Action 1</Button>
  <Button className="h-10 lg:h-8 tap-fast">Action 2</Button>
  <Button className="h-10 lg:h-8 tap-fast">Action 3</Button>
</div>
```

## Typography

### Fluid Typography System

Smooth font scaling using CSS `clamp()`:

```css
.text-fluid-xs   /* 12px → 14px */
.text-fluid-sm   /* 14px → 16px */
.text-fluid-base /* 16px → 18px */
.text-fluid-lg   /* 18px → 20px */
.text-fluid-xl   /* 20px → 24px */
.text-fluid-2xl  /* 24px → 30px */
.text-fluid-3xl  /* 30px → 36px */
```

### Usage Guidelines

**Headings**:

```tsx
<h1 className="text-fluid-3xl font-bold">Page Title</h1>
<h2 className="text-fluid-2xl font-semibold">Section</h2>
<h3 className="text-fluid-lg font-semibold">Subsection</h3>
```

**Body Text**:

```tsx
<p className="text-fluid-base">Regular paragraph text</p>
<span className="text-fluid-sm text-muted-foreground">Helper text</span>
```

**UI Elements**:

```tsx
<CardTitle className="text-fluid-base sm:text-fluid-lg">
  Card Heading
</CardTitle>
<TabsTrigger className="text-fluid-xs sm:text-fluid-sm">
  Tab Label
</TabsTrigger>
```

### Responsive Typography Patterns

```tsx
// Responsive heading with breakpoint variants
<h2 className="text-fluid-base sm:text-fluid-lg lg:text-fluid-xl">
  Adaptive Heading
</h2>

// Content with fluid sizing
<div className="font-mono text-fluid-sm whitespace-pre-wrap">
  {codeContent}
</div>

// Muted text that scales
<p className="text-fluid-sm text-muted-foreground">
  Secondary information
</p>
```

## Spacing

### Responsive Padding

```tsx
// Container padding (increases on larger screens)
<div className="px-4 sm:px-6 lg:px-8">
  Content
</div>

// Compact spacing
<div className="px-3 sm:px-4 lg:px-6">
  Compact Content
</div>

// Spacious layout
<div className="px-6 sm:px-8 lg:px-12">
  Spacious Content
</div>
```

### Responsive Margins

```tsx
// Vertical spacing
<div className="my-4 sm:my-6 lg:my-8">
  Section
</div>

// Horizontal centering with responsive margins
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  Centered Content
</div>
```

### Gap Utilities

```tsx
// Flex gap
<div className="flex gap-2 sm:gap-3 lg:gap-4">
  <Item />
  <Item />
</div>

// Grid gap
<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
  <Cell />
  <Cell />
</div>
```

## Components

### ResponsiveContainer

Standardized responsive wrapper with multiple variants.

**Import**:

```tsx
import { ResponsiveContainer } from '@/features/unified-playground/shared/components/ResponsiveContainer';
```

**Width Variants**:

```tsx
// Default (1280px max)
<ResponsiveContainer variant="default">
  Content
</ResponsiveContainer>

// Narrow (896px - for forms)
<ResponsiveContainer variant="narrow">
  <Form />
</ResponsiveContainer>

// Wide (1536px - for dashboards)
<ResponsiveContainer variant="wide">
  <Dashboard />
</ResponsiveContainer>

// Code (1152px - for code viewers)
<ResponsiveContainer variant="code">
  <CodeBlock />
</ResponsiveContainer>

// Full width (no max-width)
<ResponsiveContainer variant="full">
  <FullWidthContent />
</ResponsiveContainer>
```

**Padding Variants**:

```tsx
// Default padding (16px → 24px → 32px)
<ResponsiveContainer padding="default">
  Content
</ResponsiveContainer>

// Compact (12px → 16px → 24px)
<ResponsiveContainer padding="compact">
  Content
</ResponsiveContainer>

// Spacious (24px → 32px → 48px)
<ResponsiveContainer padding="spacious">
  Content
</ResponsiveContainer>

// No padding
<ResponsiveContainer padding="none">
  Content
</ResponsiveContainer>
```

**Semantic HTML**:

```tsx
<ResponsiveContainer as="section" aria-label="Results">
  <h2>Results</h2>
  <Results />
</ResponsiveContainer>

<ResponsiveContainer as="article">
  <Article />
</ResponsiveContainer>

<ResponsiveContainer as="main">
  <MainContent />
</ResponsiveContainer>
```

**Combined Usage**:

```tsx
<ResponsiveContainer
  variant="narrow"
  padding="spacious"
  as="section"
  className="bg-muted"
>
  <Form />
</ResponsiveContainer>
```

### Results Components

All result components follow consistent responsive patterns:

**ProofreaderResults**:

```tsx
<ProofreaderResults
  originalText={text}
  correctedText={corrected}
  corrections={corrections}
  correctionStates={states}
  onApplyCorrection={handleApply}
  onIgnoreCorrection={handleIgnore}
  onApplyAll={handleApplyAll}
  onReset={handleReset}
/>
```

Features:

- Fluid typography for headings and content
- Touch-optimized buttons (40px mobile, 32px desktop)
- Responsive spacing between correction cards
- Accessible form elements with aria-labels

**RewriterResults**:

```tsx
<RewriterResults
  originalText={original}
  content={rewritten}
  isRewriting={false}
  isStreaming={false}
  metrics={performanceMetrics}
  onCopyOriginal={handleCopy}
  onCopyRewritten={handleCopy}
  onDownload={handleDownload}
  onRetry={handleRetry}
/>
```

Features:

- Tab navigation with fluid text
- Responsive content display
- Touch-friendly action buttons
- Performance metrics with fluid sizing

**TranslatorResults**:

```tsx
<TranslatorResults
  originalText="Hello"
  translatedText="Hola"
  isStreaming={false}
  sourceLanguage="en"
  targetLanguage="es"
  performance={metrics}
  onCopy={handleCopy}
  onDownload={handleDownload}
  onRetry={handleRetry}
/>
```

Features:

- RTL language support
- Fluid typography with responsive scaling
- Touch-optimized controls
- Streaming indicator

## Best Practices

### Do's ✅

1. **Always use fluid typography** for headings and content

   ```tsx
   ✅ <h2 className="text-fluid-lg">Heading</h2>
   ❌ <h2 className="text-lg">Heading</h2>
   ```

2. **Use touch-gap for button groups**

   ```tsx
   ✅ <div className="flex touch-gap">...</div>
   ❌ <div className="flex gap-1">...</div>
   ```

3. **Add tap-fast to all buttons**

   ```tsx
   ✅ <Button className="h-10 lg:h-8 tap-fast">OK</Button>
   ❌ <Button className="h-8">OK</Button>
   ```

4. **Use ResponsiveContainer for sections**

   ```tsx
   ✅ <ResponsiveContainer variant="narrow">
        <Form />
      </ResponsiveContainer>
   ❌ <div className="max-w-4xl mx-auto">
        <Form />
      </div>
   ```

5. **Hide labels on mobile, show on desktop**

   ```tsx
   ✅ <Button className="h-10 lg:h-8 tap-fast">
        <Icon />
        <span className="hidden sm:inline ml-1.5">Label</span>
      </Button>
   ```

6. **Use semantic HTML**

   ```tsx
   ✅ <ResponsiveContainer as="section" aria-label="Results">
   ❌ <div role="region">
   ```

7. **Add aria-labels to form elements**
   ```tsx
   ✅ <Textarea aria-label="Translation context" />
   ❌ <Textarea />
   ```

### Don'ts ❌

1. **Don't use fixed font sizes** for content
2. **Don't use small gaps** between touch targets (<8px)
3. **Don't forget tap-fast** on interactive elements
4. **Don't skip breakpoint testing**
5. **Don't use h-8 alone** on mobile (use h-10 lg:h-8)
6. **Don't nest buttons** (causes accessibility violations)
7. **Don't use px-0** without padding variant="none"
8. **Don't create unnecessary wrapper divs** (apply classes directly to components when possible)

### Wrapper Div Best Practices

**When to Use Wrapper Divs**:

✅ **Necessary wrapper divs**:

```tsx
// Grid/flex layout container
<div className="grid grid-cols-2 gap-4">
  <Item />
  <Item />
</div>

// Grid positioning (direct child of grid)
<div className="lg:col-span-3">
  <Component />
</div>

// Semantic sections
<section className="space-y-4">
  <Content />
</section>
```

❌ **Unnecessary wrapper divs**:

```tsx
// Don't wrap components just for conditional classes
❌ {isDesktop && <div className="lg:hidden"><Component /></div>}
✅ {isDesktop && <Component className="lg:hidden" />}

// Don't wrap when component accepts className
❌ <div className="mb-4"><CustomComponent /></div>
✅ <CustomComponent className="mb-4" />
```

**Decision Tree**:

1. Does the div provide layout structure (flex/grid)? → **Keep it**
2. Is the div a direct child of a grid container with grid positioning? → **Keep it**
3. Is it a semantic HTML element (section, article, main)? → **Keep it**
4. Can the className be applied directly to the child component? → **Remove wrapper**
5. Is it wrapping a single component for conditional classes? → **Apply className directly**

### Common Patterns

**Card with Responsive Header**:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-fluid-base sm:text-fluid-lg">Results</CardTitle>
    <CardDescription className="text-fluid-xs sm:text-fluid-sm">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-fluid-sm">Content</div>
  </CardContent>
</Card>
```

**Responsive Button Group**:

```tsx
<div className="flex items-center touch-gap">
  <Button className="h-10 lg:h-8 tap-fast">
    <Copy className="w-4 h-4" />
    <span className="hidden sm:inline ml-1.5 text-xs">Copy</span>
  </Button>
  <Button className="h-10 lg:h-8 tap-fast">
    <Download className="w-4 h-4" />
    <span className="hidden sm:inline ml-1.5 text-xs">Download</span>
  </Button>
</div>
```

**Form Layout**:

```tsx
<ResponsiveContainer variant="narrow" padding="spacious" as="section">
  <form className="space-y-4">
    <div>
      <Label htmlFor="input" className="text-fluid-sm">
        Label
      </Label>
      <Input id="input" className="mt-2" aria-label="Input field" />
    </div>
    <Button className="h-12 lg:h-10 w-full tap-fast">Submit</Button>
  </form>
</ResponsiveContainer>
```

## Testing

### Quick Start

1. Open Chrome DevTools (F12)
2. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test each breakpoint listed below
4. Check off items as you verify them

### Breakpoint Testing

#### 📱 Mobile - Phone (375px x 667px)

**Device**: iPhone SE, iPhone 6/7/8

- [ ] Layout renders without horizontal scroll
- [ ] Touch targets are ≥ 48px (h-10 class)
- [ ] Button labels hidden, icons visible
- [ ] Text is readable (fluid typography active)
- [ ] Spacing adequate between interactive elements (≥8px)
- [ ] Cards stack vertically
- [ ] Navigation is accessible
- [ ] Forms are usable with touch
- [ ] Modals/dialogs fit screen
- [ ] No content overflow

**Test Components**:

- [ ] ProofreaderResults: Correction cards stack properly
- [ ] RewriterResults: Tabs are touch-friendly
- [ ] TranslatorResults: Translation panel full-width
- [ ] All buttons have tap-fast class

#### 📱 Mobile - Phablet (414px x 896px)

**Device**: iPhone 11 Pro Max, iPhone XR

- [ ] Layout improved from 375px
- [ ] Touch targets still ≥ 48px
- [ ] More content visible
- [ ] Typography scales smoothly
- [ ] No layout shifts from 375px
- [ ] Buttons remain touch-friendly

#### 📱 Tablet - Portrait (768px x 1024px)

**Device**: iPad, iPad Mini

- [ ] Button labels start appearing (sm:inline)
- [ ] Layout transitions to tablet view
- [ ] Touch targets can reduce to 40px (still accessible)
- [ ] Typography increases slightly
- [ ] Multi-column layouts appear where appropriate
- [ ] Spacing increases (sm:px-6)
- [ ] Tabs show full labels
- [ ] Sidebar/navigation expands

**Test Components**:

- [ ] ResponsiveContainer: Padding increases to px-6
- [ ] Card headers: Title text increases
- [ ] Button groups: Labels visible
- [ ] Form layouts: Utilize extra width

#### 💻 Tablet - Landscape (1024px x 768px)

**Device**: iPad Pro

- [ ] Desktop-like layout begins
- [ ] Touch targets optimize to 32px (h-8)
- [ ] Full button labels visible
- [ ] Typography at desktop sizes
- [ ] Multi-column content utilizes space
- [ ] Hover states work
- [ ] Spacing at lg: values (px-8)

**Test Components**:

- [ ] Tabs: Full labels, proper sizing
- [ ] Results: Side-by-side comparisons
- [ ] Forms: Multi-column where appropriate

#### 💻 Desktop - Laptop (1280px x 720px)

**Device**: Standard laptop

- [ ] All desktop features active
- [ ] Typography fully scaled
- [ ] Multi-column layouts optimized
- [ ] Hover effects functional
- [ ] Touch targets 32px (h-8)
- [ ] Maximum content width (max-w-7xl)
- [ ] Proper margins (mx-auto)

**Test Components**:

- [ ] ResponsiveContainer: Constrained to max-w-7xl
- [ ] All text uses fluid typography
- [ ] Buttons compact (h-8) with labels
- [ ] Performance metrics displayed inline

#### 🖥️ Desktop - Monitor (1440px x 900px)

**Device**: Common desktop monitor

- [ ] Layout scales appropriately
- [ ] No excessive whitespace
- [ ] Content remains centered
- [ ] Typography doesn't over-scale
- [ ] Consistent with 1280px layout

#### 🖥️ Wide - Full HD (1920px x 1080px)

**Device**: Full HD display

- [ ] Wide variant containers visible (max-w-screen-2xl)
- [ ] Content properly centered
- [ ] Typography at maximum scale
- [ ] No layout breaking
- [ ] Dashboard layouts utilize space

**Test Components**:

- [ ] ResponsiveContainer variant="wide": Expands to 1536px
- [ ] Multi-column grids: 3-4 columns
- [ ] Large cards: Utilize horizontal space

#### 🖥️ Ultra-Wide (2560px x 1440px)

**Device**: QHD/4K display

- [ ] Layout doesn't break
- [ ] Content remains readable
- [ ] Maximum widths enforced
- [ ] No extreme spacing
- [ ] Typography capped at max size

### Component-Specific Tests

#### ResponsiveContainer

Test all width variants:

**Default (max-w-7xl - 1280px)**:

- [ ] 375px: Full width with px-4 padding
- [ ] 768px: Full width with px-6 padding
- [ ] 1024px: Full width with px-8 padding
- [ ] 1280px: Constrained to 1280px
- [ ] 1920px: Centered at 1280px

**Narrow (max-w-4xl - 896px)**:

- [ ] Constrains earlier on larger screens
- [ ] Good for forms and focused content
- [ ] Proper padding at all breakpoints

**Wide (max-w-screen-2xl - 1536px)**:

- [ ] Allows more horizontal space
- [ ] Good for dashboards
- [ ] Still centered on ultra-wide

**Code (max-w-6xl - 1152px)**:

- [ ] Optimized for code viewing
- [ ] Prevents excessive line length

**Full (max-w-none)**:

- [ ] Uses full viewport width
- [ ] Padding variant="none" option works
- [ ] Good for media/images

#### Touch Targets

**Buttons**:

- [ ] 375px: h-10 (40px) minimum
- [ ] 768px: h-10 or h-8 acceptable
- [ ] 1024px+: h-8 (32px) optimal
- [ ] All have tap-fast class
- [ ] Spacing ≥ 8px (touch-gap)

**Form Elements**:

- [ ] Inputs: Adequate height for touch
- [ ] Textareas: Properly sized
- [ ] Selects: Touch-friendly
- [ ] Checkboxes/Radio: ≥ 48px target area

**Interactive Cards**:

- [ ] Clickable areas large enough
- [ ] Proper feedback on interaction
- [ ] No accidental clicks from proximity

#### Typography

**Headings**:

- [ ] h1: text-fluid-3xl scales properly
- [ ] h2: text-fluid-2xl scales properly
- [ ] h3: text-fluid-lg scales properly
- [ ] No text overflow at any breakpoint
- [ ] Line height appropriate

**Body Text**:

- [ ] text-fluid-base for paragraphs
- [ ] text-fluid-sm for secondary text
- [ ] Readable at all sizes (16px+ base)
- [ ] Proper line length (45-75 characters)

**UI Text**:

- [ ] Button labels: text-fluid-xs or text-xs
- [ ] Badges/tags: Appropriate sizing
- [ ] Helper text: text-fluid-sm
- [ ] Monospace code: text-fluid-sm

#### Spacing

**Padding**:

- [ ] 375px: px-4 (16px)
- [ ] 768px: px-6 (24px)
- [ ] 1024px: px-8 (32px)
- [ ] Variant="compact": Smaller values
- [ ] Variant="spacious": Larger values

**Gaps**:

- [ ] touch-gap (8px) between buttons
- [ ] Responsive gaps in grids
- [ ] Consistent spacing in lists

**Margins**:

- [ ] Responsive vertical spacing
- [ ] Proper section separation
- [ ] No excessive margins on mobile

### Accessibility Testing

#### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus visible on all elements
- [ ] Logical tab order
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dialogs
- [ ] Arrow keys work in appropriate contexts

#### Screen Reader

**Test with**:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Checklist**:

- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] ARIA labels on custom controls
- [ ] Landmark regions identified
- [ ] Dynamic content announces
- [ ] Error messages read aloud

#### Color Contrast

- [ ] Text meets WCAG AA (4.5:1)
- [ ] Large text meets WCAG AA (3:1)
- [ ] Interactive elements identifiable
- [ ] Focus indicators visible
- [ ] Works in dark mode

#### Motion

- [ ] Respects prefers-reduced-motion
- [ ] Animations can be disabled
- [ ] No seizure-inducing patterns
- [ ] Smooth transitions

### Performance Testing

#### Load Time

- [ ] Initial render < 2s
- [ ] Time to interactive < 3s
- [ ] No layout shift (CLS < 0.1)
- [ ] Images lazy-load

#### Runtime Performance

- [ ] Smooth scrolling (60fps)
- [ ] Resize debounced (150ms)
- [ ] No memory leaks
- [ ] Efficient re-renders

#### Network

- [ ] Works offline (if applicable)
- [ ] Graceful degradation on slow 3G
- [ ] Assets optimized

### Browser Testing

#### Chrome/Edge (Chromium)

- [ ] 375px - Mobile
- [ ] 768px - Tablet
- [ ] 1280px - Desktop
- [ ] 1920px - Wide
- [ ] DevTools responsive mode works
- [ ] Touch emulation works

#### Firefox

- [ ] All breakpoints
- [ ] Responsive design mode
- [ ] Touch simulation

#### Safari

- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] macOS Safari
- [ ] Touch gestures

#### Mobile Browsers

**Android**:

- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

**iOS**:

- [ ] Safari
- [ ] Chrome iOS
- [ ] Firefox iOS

### Automated Testing

```bash
# All responsive tests
pnpm vitest run src/features/unified-playground/shared

# Specific tests
pnpm vitest run useBreakpoint
pnpm vitest run ResponsiveContainer
pnpm vitest run accessibility

# Coverage report
pnpm test:coverage
```

**Expected Results**:

- ✅ 92 tests passing
- ✅ 0 accessibility violations
- ✅ Type-check: PASS
- ✅ Lint: PASS

### Common Issues & Fixes

**Horizontal Scroll**:

- Cause: Fixed widths, overflow
- Fix: max-w-full, overflow-hidden

**Touch Target Too Small**:

- Cause: h-8 on mobile
- Fix: h-10 lg:h-8

**Text Overflow**:

- Cause: Fixed font sizes
- Fix: Use text-fluid-\* classes

**Broken Layout**:

- Cause: Missing responsive classes
- Fix: Add sm:, md:, lg: variants

**Excessive Whitespace**:

- Cause: Max-width too small
- Fix: Adjust ResponsiveContainer variant

### Issue Reporting Template

```markdown
## Issue: [Brief Description]

**Breakpoint**: [e.g., 375px mobile]
**Component**: [e.g., ProofreaderResults]
**Browser**: [e.g., Chrome 120]

**Expected**:
[What should happen]

**Actual**:
[What actually happens]

**Screenshot**:
[Attach if relevant]

**Steps to Reproduce**:

1. ...
2. ...
3. ...

**Suggested Fix**:
[If known]
```

### Sign-Off Checklist

#### Developer Checklist

- [ ] All breakpoints tested
- [ ] Touch targets verified
- [ ] Typography scales properly
- [ ] Spacing consistent
- [ ] Components responsive
- [ ] Accessibility compliant
- [ ] Tests passing
- [ ] Documentation updated

#### QA Checklist

- [ ] Manual testing complete
- [ ] Cross-browser verified
- [ ] Performance acceptable
- [ ] No regressions
- [ ] Ready for release

## File Locations

### Core Files

- **Breakpoint Hook**: `src/features/unified-playground/shared/hooks/useBreakpoint.ts`
- **ResponsiveContainer**: `src/features/unified-playground/shared/components/ResponsiveContainer.tsx`
- **Styles**: `src/styles/globals.css`

### Tests

- **Breakpoint Tests**: `src/features/unified-playground/shared/hooks/__tests__/useBreakpoint.test.tsx` (44 tests)
- **Container Tests**: `src/features/unified-playground/shared/components/__tests__/ResponsiveContainer.test.tsx` (32 tests)
- **Accessibility Tests**: `src/features/unified-playground/shared/__tests__/accessibility.test.tsx` (16 tests)

### Documentation

- **This Guide**: `docs/RESPONSIVE_DESIGN_GUIDE.md`

## Support

For questions or issues:

1. Check this guide first
2. Review the test files for examples
3. Inspect existing components for patterns
4. Run accessibility tests to verify compliance

---

**Last Updated**: 2025-10-18
**Version**: 3.0 (Unified Guide)
**Test Coverage**: 92 tests (100% passing)
