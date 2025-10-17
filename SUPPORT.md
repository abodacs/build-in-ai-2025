# Support

Thank you for using Chrome AI DevBench! This document provides resources and guidance for getting help with the project.

## Table of Contents

- [Getting Help](#getting-help)
- [Common Issues](#common-issues)
- [Troubleshooting by API](#troubleshooting-by-api)
- [Browser Setup Issues](#browser-setup-issues)
- [Build and Development Issues](#build-and-development-issues)
- [Performance Issues](#performance-issues)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Getting Help

### Documentation

Start with these resources:

- **README.md**: Project overview and quick start guide
- **CONTRIBUTING.md**: Development setup and contribution guidelines
- **ARCHITECTURE.md**: Technical architecture details
- **SECURITY.md**: Security considerations and best practices

### Community Channels

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Pull Requests**: Contribute code and review changes

### Before Asking for Help

1. Check if your question is answered in the documentation
2. Search existing GitHub issues and discussions
3. Verify your browser and environment meet the requirements
4. Try the troubleshooting steps in this document

## Common Issues

### Chrome AI APIs Not Available

**Symptoms:**

- APIs show as "unavailable" in the UI
- Error: "API not available"
- Model download doesn't start

**Solutions:**

1. **Verify Chrome Version**

   ```bash
   # Navigate to chrome://version
   # Ensure version is 138+ (Canary or Dev channel)
   ```

2. **Enable Required Flags** (set each to `Enabled`):

   **Core API Flags:**
   - [Summarization API](chrome://flags/#summarization-api-for-gemini-nano)
   - [Prompt API](chrome://flags/#prompt-api-for-gemini-nano)
   - [Prompt API Multimodal](chrome://flags/#prompt-api-for-gemini-nano-multimodal-input)
   - [Translation API](chrome://flags/#translation-api)
   - [Writer API](chrome://flags/#writer-api-for-gemini-nano)
   - [Rewriter API](chrome://flags/#rewriter-api-for-gemini-nano)
   - [Language Detection API](chrome://flags/#language-detection-api)

   **Multilingual Flags (Chrome 141+, optional - for Spanish/Japanese support):**
   - [Summarization Multilingual](chrome://flags/#summarization-api-for-gemini-nano-multilingual)
   - [Prompt Multilingual Text](chrome://flags/#prompt-api-for-gemini-nano-multilingual-text)
   - [Writer Multilingual](chrome://flags/#writer-api-for-gemini-nano-multilingual)
   - [Rewriter Multilingual](chrome://flags/#rewriter-api-for-gemini-nano-multilingual)

3. **Restart Chrome** completely (not just close windows)

4. **Check Model Availability**
   - Navigate to `chrome://components`
   - Look for "Optimization Guide On Device Model"
   - Check status and version

### Model Download Failures

**Symptoms:**

- Download progress stuck
- Error: "Failed to download model"
- Insufficient space warnings

**Solutions:**

1. **Check Disk Space**
   - Ensure at least 22GB free space
   - Models are ~1-2GB each
   - Check: Settings → System → Storage

2. **Verify Internet Connection**
   - Models download on first use
   - Requires stable connection
   - Try on different network

3. **Clear Chrome Cache**

   ```bash
   # Navigate to chrome://settings/clearBrowserData
   # Select "Cached images and files"
   # Time range: "All time"
   # Click "Clear data"
   ```

4. **Manual Model Reinstall**
   - Navigate to `chrome://components`
   - Find "Optimization Guide On Device Model"
   - Click "Check for update"

### Installation and Build Issues

**Symptoms:**

- `pnpm install` fails
- Build errors
- TypeScript errors

**Solutions:**

1. **Verify Prerequisites**

   ```bash
   node --version  # Should be 22.0.0+
   pnpm --version  # Should be 8.0.0+
   ```

2. **Clean Install**

   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Clear Build Cache**

   ```bash
   pnpm clean
   pnpm build
   ```

4. **Update Dependencies**
   ```bash
   pnpm update
   ```

## Troubleshooting by API

### Summarizer API Issues

**Common Problems:**

1. **Long Text Fails to Summarize**
   - **Cause**: Text exceeds model limits
   - **Solution**: Enable chunking in Advanced Options
   - **Workaround**: Break text into smaller sections

2. **Chunking Not Working**
   - **Cause**: Incorrect configuration
   - **Solution**: Adjust chunk size and overlap settings
   - **Typical Values**: Chunk size: 4000-6000, Overlap: 200-500

3. **URL Extraction Fails**
   - **Cause**: CORS issues or invalid URL
   - **Solution**: Copy content manually or use different URL
   - **Note**: Some sites block scraping

### Translator API Issues

**Common Problems:**

1. **Language Not Detected**
   - **Cause**: Language not supported or ambiguous text
   - **Solution**: Specify source language manually
   - **Supported**: 13+ major languages

2. **Translation Quality Poor**
   - **Cause**: On-device models have limitations
   - **Solution**: Try simpler sentences or different phrasing
   - **Note**: Technical terms may not translate well

3. **Slow Translation**
   - **Cause**: Large text or model initialization
   - **Solution**: Wait for first translation, subsequent ones are faster
   - **Tip**: Break large texts into smaller chunks

### Writer API Issues

**Common Problems:**

1. **Generated Content Generic**
   - **Cause**: Insufficient context or vague prompts
   - **Solution**: Provide more specific instructions and context
   - **Tip**: Use templates and adjust parameters

2. **Template Not Working**
   - **Cause**: Invalid template format
   - **Solution**: Use provided templates as reference
   - **Note**: 18+ templates available

3. **Content Filtered**
   - **Cause**: Safety filters activated
   - **Solution**: Modify prompt to avoid flagged content
   - **Note**: Chrome AI has built-in safety measures

### Rewriter API Issues

**Common Problems:**

1. **Rewrite Not Different Enough**
   - **Cause**: Conservative rewriting settings
   - **Solution**: Adjust tone or select different rewrite type
   - **Options**: Formal, casual, professional

2. **Diff View Not Showing**
   - **Cause**: UI rendering issue
   - **Solution**: Refresh page or try different browser tab
   - **Note**: Check browser console for errors

### Proofreader API Issues

**Common Problems:**

1. **Corrections Not Highlighted**
   - **Cause**: CSS Custom Highlights not supported
   - **Solution**: Verify Chrome version (138+)
   - **Fallback**: Use list view instead

2. **Too Many Corrections**
   - **Cause**: Sensitive proofreading settings
   - **Solution**: Filter by correction type or severity
   - **Tip**: Apply corrections selectively

3. **Undo/Redo Not Working**
   - **Cause**: State management issue
   - **Solution**: Refresh page or clear browser cache
   - **Workaround**: Copy text before applying corrections

### Language Detection API Issues

**Common Problems:**

1. **Wrong Language Detected**
   - **Cause**: Ambiguous or short text
   - **Solution**: Provide longer text sample
   - **Minimum**: 50-100 characters recommended

2. **Low Confidence Scores**
   - **Cause**: Mixed language content
   - **Solution**: Adjust confidence threshold
   - **Note**: Multilingual text may have multiple results

3. **Detection Timeout**
   - **Cause**: Network or processing issue
   - **Solution**: Retry with shorter text
   - **Typical Time**: < 1 second for most texts

### Prompt API Issues

**Common Problems:**

1. **Image Upload Fails**
   - **Cause**: File size or format issue
   - **Solution**: Ensure image is < 10MB and valid format (PNG, JPG, WEBP)
   - **Supported**: PNG, JPG, JPEG, GIF, WEBP

2. **Multimodal Prompt Not Working**
   - **Cause**: Browser doesn't support multimodal
   - **Solution**: Verify Chrome 138+ and Prompt API flag enabled
   - **Note**: Feature may be experimental

3. **Conversation Context Lost**
   - **Cause**: Session not persisted
   - **Solution**: Enable conversation history in settings
   - **Note**: Check browser localStorage

## Browser Setup Issues

### Chrome Version Issues

**Problem**: Using stable Chrome instead of Canary/Dev

**Solution:**

1. Download Chrome Canary or Chrome Dev
2. Don't uninstall stable Chrome (they run side-by-side)
3. Set Canary/Dev as default browser for development
4. Links:
   - Chrome Canary: https://www.google.com/chrome/canary/
   - Chrome Dev: https://www.google.com/chrome/dev/

### Flags Not Persisting

**Problem**: Flags reset after Chrome restart

**Solution:**

1. Ensure you're restarting Chrome completely (not just closing windows)
2. Check if Chrome is in incognito mode (flags don't persist)
3. Verify you're using the correct Chrome profile
4. Try: `chrome://flags` → "Reset all to default" → Re-enable needed flags

### Model Storage Issues

**Problem**: Models don't persist between sessions

**Solution:**

1. Check Chrome isn't in incognito/guest mode
2. Verify sufficient disk space
3. Check antivirus isn't blocking Chrome
4. Navigate to `chrome://components` to verify model installation

## Build and Development Issues

### TypeScript Errors

**Problem**: Type checking fails

**Solution:**

```bash
# Update TypeScript
pnpm add -D typescript@latest

# Clear TypeScript cache
rm -rf node_modules/.cache

# Run type check
pnpm type-check
```

### Linting Errors

**Problem**: ESLint errors on build

**Solution:**

```bash
# Auto-fix linting issues
pnpm lint:fix

# If issues persist, check eslint.config.js
# Verify ESLint and plugin versions match
```

### Test Failures

**Problem**: Tests fail locally

**Solution:**

```bash
# Update test dependencies
pnpm update vitest @testing-library/react playwright

# Clear test cache
pnpm test --clearCache

# Run tests with verbose output
pnpm test --verbose
```

### Hot Module Replacement (HMR) Not Working

**Problem**: Changes not reflected in browser

**Solution:**

1. Check Vite dev server is running
2. Verify no port conflicts (default: 5173)
3. Clear browser cache
4. Restart dev server: `pnpm dev`

## Performance Issues

### Slow Page Load

**Solutions:**

- Clear browser cache
- Disable unnecessary Chrome extensions
- Check network tab in DevTools
- Verify adequate RAM (8GB+ recommended)

### Sluggish AI Responses

**Solutions:**

- Ensure 4GB+ VRAM available
- Close GPU-intensive applications
- Check Chrome Task Manager: Shift+Esc
- Verify model is cached (not downloading)

### High Memory Usage

**Solutions:**

- Close unused tabs
- Restart Chrome periodically
- Check for memory leaks in DevTools
- Use Chrome's built-in memory profiler

## Reporting Bugs

### Before Reporting

1. Search existing issues: https://github.com/[org]/chrome-ai-devbench/issues
2. Verify bug exists in latest version
3. Try reproducing in clean environment
4. Collect relevant information (see below)

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g., Windows 11, macOS 14]
- Chrome Version: [e.g., Canary 138.0.6000.0]
- Project Version: [e.g., 1.2.0]
- Node Version: [e.g., 22.0.0]

**Additional context**
Any other relevant information.

**Console Errors**
Browser console errors (if any).
```

### Where to Report

- **Bugs**: GitHub Issues with `bug` label
- **Security Issues**: See SECURITY.md
- **Questions**: GitHub Discussions

## Feature Requests

### Before Requesting

1. Check if feature already exists
2. Search existing feature requests
3. Consider if it fits project scope
4. Think about implementation complexity

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information.

**Willing to contribute?**
Are you willing to implement this feature?
```

## Additional Resources

### Useful Chrome URLs

- `chrome://version` - Chrome version info
- `chrome://flags` - Experimental features
- `chrome://components` - Component versions
- `chrome://gpu` - GPU information
- `chrome://device-log` - Device logs
- `chrome://quota-internals` - Storage quota

### External Resources

- Chrome AI Documentation: https://developer.chrome.com/
- Chrome Canary Download: https://www.google.com/chrome/canary/
- Project Repository: https://github.com/[org]/chrome-ai-devbench

## Getting More Help

If you've tried the troubleshooting steps and still need help:

1. **GitHub Discussions**: Best for questions and general help
2. **GitHub Issues**: For confirmed bugs and feature requests
3. **Community**: Check if others have similar issues
4. **Documentation**: Review technical docs for details

Thank you for using Chrome AI DevBench! We appreciate your patience and feedback.

---

**Last Updated**: October 16, 2025
**Version**: 1.0
