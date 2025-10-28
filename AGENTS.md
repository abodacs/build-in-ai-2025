# AI Agents Documentation

This document describes the AI agents and automation tools used in the development of Chrome AI DevBench.

## Table of Contents

- [Overview](#overview)
- [Development Agents](#development-agents)
- [Chrome Built-in AI APIs](#chrome-built-in-ai-apis)
- [Code Generation](#code-generation)
- [Testing Automation](#testing-automation)
- [CI/CD Automation](#cicd-automation)
- [Usage Guidelines](#usage-guidelines)

## Overview

Chrome AI DevBench leverages various AI agents and automation tools throughout the development lifecycle to improve code quality, accelerate development, and ensure consistent patterns across the codebase.

## Development Agents

### Claude Code Integration

**Purpose**: AI-assisted development and code generation

**Capabilities**:

- Code scaffolding for new API modules
- Pattern replication across similar components
- Documentation generation
- Test case generation
- Code review assistance

**Usage**:

```bash
# Used during development for:
# - Creating new API module structures
# - Generating boilerplate code
# - Writing comprehensive tests
# - Documentation updates
```

**Best Practices**:

- Review all AI-generated code before committing
- Verify type safety and error handling
- Run full test suite after AI-assisted changes
- Maintain coding standards and patterns

### GitHub Copilot

**Purpose**: In-editor code suggestions

**Usage Patterns**:

- Component boilerplate generation
- Test case scaffolding
- TypeScript type definitions
- Common patterns and utilities

**Configuration**:

- Integrated with VS Code
- Tailored suggestions based on project context
- Custom prompt patterns for Chrome AI APIs

## Chrome Built-in AI APIs

### Using Chrome AI APIs for Development

The project demonstrates how Chrome's built-in AI APIs can be used as development tools:

#### Summarizer API

**Development Use Cases**:

- Summarizing long documentation
- Creating concise commit messages
- Generating PR descriptions
- Code comment generation

#### Writer API

**Development Use Cases**:

- Documentation drafting
- Test case descriptions
- Error message improvements
- README sections

#### Rewriter API

**Development Use Cases**:

- Refactoring code comments
- Improving documentation clarity
- Adjusting tone in user-facing messages
- Code example variations

#### Translator API

**Development Use Cases**:

- Internationalizing content
- Creating multilingual documentation
- Translating user feedback
- Global accessibility

#### Proofreader API

**Development Use Cases**:

- Documentation review
- Error message improvement
- Code comment quality
- README proofreading

#### Language Detection API

**Development Use Cases**:

- Detecting documentation language
- Identifying code comment languages
- Supporting multilingual contributions
- Automatic language tagging

#### Prompt API

**Development Use Cases**:

- Custom AI workflows
- Multimodal documentation (text + images)
- Interactive development assistance
- Context-aware code generation

## Testing Automation

### Test Generation Agents

**Unit Test Generation**:

- Automatic test case inference from implementation
- Mock generation for external dependencies
- Edge case identification
- Coverage analysis

**Integration Test Generation**:

- Component interaction testing
- Service layer integration
- API mocking strategies
- State management testing

**E2E Test Generation**:

- User flow automation
- Critical path identification
- Cross-browser test scenarios
- Visual regression tests

### Test Maintenance

**Automated Updates**:

- Test refactoring when code changes
- Mock data updates
- Coverage gap identification
- Test optimization suggestions

## CI/CD Automation

### GitHub Actions Workflows

**Current Workflow** (`.github/workflows/deploy.yml`):

```yaml
lint-and-test job:
  - Type checking (pnpm type-check)
  - Linting (pnpm lint)
  - Unit tests with coverage (pnpm test:coverage)

build-and-deploy job:
  - Production build (pnpm build:cloudflare)
  - Cloudflare Pages deployment
```

**Triggers**:

- Push to main → Production deployment
- Pull requests → Preview deployment

**Note**: Advanced features (E2E tests, security scans, bundle analysis, performance testing, Lighthouse audits) are configured locally via npm scripts but not yet integrated into the CI/CD pipeline. These are available for local development and can be added to the workflow as needed.

### Code Quality Bots

**Dependabot**:

- Automatic dependency updates
- Security vulnerability alerts
- Pull request generation

**CodeQL**:

- Security analysis
- Code scanning
- Vulnerability detection

## Usage Guidelines

### Best Practices

#### When to Use AI Agents

**Good Use Cases**:

- Boilerplate code generation
- Test case scaffolding
- Documentation writing
- Pattern replication
- Code refactoring suggestions

**Avoid for**:

- Critical security code
- Complex business logic
- API integration points
- State management logic

#### Code Review Process

1. **AI-Generated Code Review**:
   - Verify functionality
   - Check error handling
   - Validate types
   - Test edge cases
   - Review security implications

2. **Human Oversight**:
   - Architectural decisions
   - Design patterns
   - Performance considerations
   - User experience
   - Business logic validation

#### Quality Standards

All AI-generated code must meet:

- [ ] TypeScript strict mode compliance
- [ ] ESLint rules compliance
- [ ] Test coverage requirements (80%+)
- [ ] Documentation standards
- [ ] Performance benchmarks
- [ ] Security best practices

### Agent Configuration

#### Development Environment Setup

```bash
# Install AI development tools
npm install -g @anthropic/claude-code

# Configure workspace
code .vscode/settings.json
```

**Recommended VS Code Extensions**:

- GitHub Copilot
- Claude Code
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

#### Prompt Engineering

**Effective Prompts for Chrome AI Development**:

```
# Example: Generate API module hook
"Create a custom React hook for the [API-NAME] API that:
- Uses the Chrome AI [API-NAME] API
- Handles availability checking
- Implements error recovery
- Includes TypeScript types
- Follows the existing pattern in useSummarizer.ts"
```

**Component Generation Prompt**:

```
"Generate a PlaygroundTab component for [API-NAME] that:
- Uses shadcn/ui components
- Follows the Summarizer PlaygroundTab pattern
- Includes configuration, input, and results sections
- Has proper TypeScript types
- Implements error boundaries"
```

### Monitoring and Metrics

#### AI Usage Tracking

**Metrics to Monitor**:

- AI-generated code percentage
- Code review time savings
- Test generation efficiency
- Documentation completeness
- Pattern consistency

**Quality Metrics**:

- Bug rate in AI-generated code
- Test pass rate
- Code coverage
- Performance impact
- Security vulnerability rate

## Future AI Integration

### Planned Enhancements

1. **Intelligent Code Review**:
   - Automated PR review
   - Pattern consistency checking
   - Performance regression detection

2. **Smart Documentation**:
   - Auto-generated API docs
   - Usage example generation
   - Interactive tutorials

3. **Advanced Testing**:
   - AI-powered test case generation
   - Mutation testing
   - Property-based testing

4. **Development Assistance**:
   - Real-time code suggestions
   - Architecture recommendations
   - Performance optimization hints

## Contributing with AI Agents

### Guidelines for Contributors

**When using AI assistance**:

1. **Disclose AI Usage**:
   - Mention in PR description if AI tools were used
   - Highlight AI-generated sections
   - Explain validation steps taken

2. **Validation Required**:
   - Run full test suite
   - Perform manual testing
   - Review for security implications
   - Check performance impact

3. **Maintain Standards**:
   - Follow project coding standards
   - Adhere to architectural patterns
   - Ensure documentation quality
   - Verify accessibility compliance

### Reporting Issues

If AI-generated code causes issues:

1. Document the AI tool used
2. Describe the prompt or context
3. Explain the unexpected behavior
4. Provide reproduction steps
5. Suggest manual fixes if known

## Release Documentation Update Process

### After Each Release

When creating a new release, the following documentation must be updated to maintain accuracy and consistency:

#### 1. CHANGELOG.md (Critical)

**Update Steps**:

- Add new version entry with release date (format: `## [X.Y.Z] - YYYY-MM-DD`)
- Move items from `[Unreleased]` section to new version
- Document all changes in categories:
  - **Added**: New features
  - **Changed**: Changes in existing functionality
  - **Deprecated**: Soon-to-be removed features
  - **Removed**: Removed features
  - **Fixed**: Bug fixes
  - **Security**: Security updates
- Update "Last Updated" date at bottom
- Follow [Keep a Changelog](https://keepachangelog.com/) format

#### 2. README.md

**Update Steps**:

- Update version badge (if exists)
- Update feature list if new APIs added
- Update screenshots if UI changed
- Verify all links still work
- Update browser requirements if changed
- Update installation instructions if needed

#### 3. package.json

**Update Steps**:

- Update `version` field
- Update dependencies if needed
- Review and update `engines` requirements
- Update `description` if scope changed

#### 4. SECURITY.md

**Update Steps**:

- Update "Supported Versions" table
- Add newly supported version
- Mark old versions as unsupported if needed
- Add any new security considerations
- Document new security features
- Update "Last Updated" date

#### 5. SUPPORT.md

**Update Steps**:

- Add new common issues discovered
- Update troubleshooting steps
- Add new API-specific sections
- Update Chrome version requirements
- Update browser compatibility information
- Update "Last Updated" date

#### 6. ARCHITECTURE.md

**Update Steps**:

- Document architectural changes
- Update directory structure if changed
- Add new design patterns introduced
- Update technology stack versions
- Update diagrams if structure changed
- Update "Last Updated" date

#### 7. AGENTS.md (This File)

**Update Steps**:

- Document new AI tools or agents used
- Update agent configurations
- Add new usage patterns
- Update "Last Updated" date

### Release Checklist

Before tagging a new release:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with all changes since last release
- [ ] Review and update `README.md` for accuracy
- [ ] Update `SECURITY.md` supported versions table
- [ ] Review `SUPPORT.md` for new common issues
- [ ] Check `ARCHITECTURE.md` for architectural changes
- [ ] Update "Last Updated" dates in all modified files
- [ ] Run full test suite: `pnpm test`
- [ ] Run type check: `pnpm type-check`
- [ ] Run lint: `pnpm lint`
- [ ] Build successfully: `pnpm build`
- [ ] Test production build: `pnpm preview`
- [ ] Create git tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] Verify CI/CD deployment successful
- [ ] Create GitHub Release with changelog excerpt
- [ ] Announce release (if applicable)

### Automated Updates

Some updates can be automated:

- Version bumping: `npm version [major|minor|patch]`
- Changelog generation: Consider using `standard-version` or `semantic-release`
- Dependency updates: Dependabot handles PRs automatically

### Version Number Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes, incompatible API changes
- **Minor (0.X.0)**: New features, backward-compatible
- **Patch (0.0.X)**: Bug fixes, backward-compatible

### Documentation Date Format

Use consistent date format across all documentation:

- **Full dates**: `October 16, 2025` or `2025-10-16`
- **Last Updated**: Always include at bottom of versioned documents
- **CHANGELOG dates**: Use ISO format `YYYY-MM-DD`

## Resources

### Learning Resources

- Chrome AI API Documentation
- Claude Code Documentation
- GitHub Copilot Best Practices
- AI-Assisted Development Patterns

### Project-Specific

- Existing API module patterns
- Service layer architecture
- Testing strategies
- Component composition patterns

---

**Document Version**: 1.0
**Last Updated**: October 16, 2025
**Maintainers**: Chrome AI DevBench Team

For questions about AI agents in development, please open a GitHub Discussion.
