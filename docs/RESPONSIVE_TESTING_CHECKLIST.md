# Responsive Design Testing Checklist

> Manual testing checklist for verifying responsive design implementation across breakpoints.

## Quick Start

1. Open Chrome DevTools (F12)
2. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test each breakpoint listed below
4. Check off items as you verify them

## Breakpoint Testing

### 📱 Mobile - Phone (375px x 667px)

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

### 📱 Mobile - Phablet (414px x 896px)

**Device**: iPhone 11 Pro Max, iPhone XR

- [ ] Layout improved from 375px
- [ ] Touch targets still ≥ 48px
- [ ] More content visible
- [ ] Typography scales smoothly
- [ ] No layout shifts from 375px
- [ ] Buttons remain touch-friendly

### 📱 Tablet - Portrait (768px x 1024px)

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

### 💻 Tablet - Landscape (1024px x 768px)

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

### 💻 Desktop - Laptop (1280px x 720px)

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

### 🖥️ Desktop - Monitor (1440px x 900px)

**Device**: Common desktop monitor

- [ ] Layout scales appropriately
- [ ] No excessive whitespace
- [ ] Content remains centered
- [ ] Typography doesn't over-scale
- [ ] Consistent with 1280px layout

### 🖥️ Wide - Full HD (1920px x 1080px)

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

### 🖥️ Ultra-Wide (2560px x 1440px)

**Device**: QHD/4K display

- [ ] Layout doesn't break
- [ ] Content remains readable
- [ ] Maximum widths enforced
- [ ] No extreme spacing
- [ ] Typography capped at max size

## Component-Specific Tests

### ResponsiveContainer

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

### Touch Targets

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

### Typography

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

### Spacing

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

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus visible on all elements
- [ ] Logical tab order
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dialogs
- [ ] Arrow keys work in appropriate contexts

### Screen Reader

**Test with**:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] ARIA labels on custom controls
- [ ] Landmark regions identified
- [ ] Dynamic content announces
- [ ] Error messages read aloud

### Color Contrast

- [ ] Text meets WCAG AA (4.5:1)
- [ ] Large text meets WCAG AA (3:1)
- [ ] Interactive elements identifiable
- [ ] Focus indicators visible
- [ ] Works in dark mode

### Motion

- [ ] Respects prefers-reduced-motion
- [ ] Animations can be disabled
- [ ] No seizure-inducing patterns
- [ ] Smooth transitions

## Performance Testing

### Load Time

- [ ] Initial render < 2s
- [ ] Time to interactive < 3s
- [ ] No layout shift (CLS < 0.1)
- [ ] Images lazy-load

### Runtime Performance

- [ ] Smooth scrolling (60fps)
- [ ] Resize debounced (150ms)
- [ ] No memory leaks
- [ ] Efficient re-renders

### Network

- [ ] Works offline (if applicable)
- [ ] Graceful degradation on slow 3G
- [ ] Assets optimized

## Browser Testing

### Chrome/Edge (Chromium)

- [ ] 375px - Mobile
- [ ] 768px - Tablet
- [ ] 1280px - Desktop
- [ ] 1920px - Wide
- [ ] DevTools responsive mode works
- [ ] Touch emulation works

### Firefox

- [ ] All breakpoints
- [ ] Responsive design mode
- [ ] Touch simulation

### Safari

- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] macOS Safari
- [ ] Touch gestures

### Mobile Browsers

**Android**:

- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

**iOS**:

- [ ] Safari
- [ ] Chrome iOS
- [ ] Firefox iOS

## Issue Tracking

### Common Issues

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

### Reporting Template

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

## Automated Testing

### Run Test Suite

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

### Expected Results

- ✅ 92 tests passing
- ✅ 0 accessibility violations
- ✅ Type-check: PASS
- ✅ Lint: PASS

## Sign-Off

### Developer Checklist

- [ ] All breakpoints tested
- [ ] Touch targets verified
- [ ] Typography scales properly
- [ ] Spacing consistent
- [ ] Components responsive
- [ ] Accessibility compliant
- [ ] Tests passing
- [ ] Documentation updated

### QA Checklist

- [ ] Manual testing complete
- [ ] Cross-browser verified
- [ ] Performance acceptable
- [ ] No regressions
- [ ] Ready for release

---

**Tester**: ******\_\_\_******
**Date**: ******\_\_\_******
**Build/Version**: ******\_\_\_******
**Status**: ⬜ Pass / ⬜ Fail / ⬜ Needs Review
