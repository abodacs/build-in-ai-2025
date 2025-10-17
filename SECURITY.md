# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Considerations for Chrome AI APIs

### Client-Side Processing

Chrome AI DevBench is designed with security and privacy as core principles:

- **On-Device Processing**: All AI processing happens locally in the browser
- **No Data Transmission**: User data never leaves the device
- **No External Servers**: No backend infrastructure to compromise
- **Browser Sandbox**: Operates within Chrome's security sandbox

### Chrome AI API Security Features

#### Summarizer API

- Input validation and sanitization
- Content length limits to prevent DoS
- Secure text processing without external calls

#### Translator API

- Validated language code inputs
- Secure on-device translation
- No third-party translation services

#### Writer API

- Template-based generation with safety constraints
- Content filtering for inappropriate outputs
- Secure prompt handling

#### Rewriter API

- Input sanitization before rewriting
- Style transfer without data leakage
- Controlled output generation

#### Proofreader API

- Grammar checking without external APIs
- CSS Custom Highlights for secure text marking
- Client-side correction suggestions

#### Language Detection API

- Confidence-based detection
- No fingerprinting or tracking
- Secure language identification

#### Prompt API

- Multimodal input validation (text + images)
- File upload security (client-side only)
- System prompt isolation
- Context window management

### Application Security Measures

#### Input Sanitization

- DOMPurify integration for HTML sanitization
- Input validation using Zod schemas
- XSS prevention through proper escaping
- Content Security Policy (CSP) enforcement

#### Prompt Injection Protection

- System prompt isolation techniques
- Input delimitation patterns
- Context separation
- Output validation

#### File Upload Security

- Client-side file validation
- Type checking (images only for Prompt API)
- Size limits (10MB maximum)
- No server uploads - all processing local

#### Content Security

- Strict Content Security Policy
- No inline scripts
- Subresource integrity for external resources
- HTTPS-only in production

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Reporting Process

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security details to the maintainers via GitHub Security Advisories
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium: Within 90 days
  - Low: Best effort basis

### Security Response Process

1. **Acknowledgment**: We'll confirm receipt of your report
2. **Investigation**: We'll investigate and validate the vulnerability
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: Coordinated disclosure after fix is deployed
5. **Credit**: We'll credit you in the security advisory (unless you prefer anonymity)

## Security Best Practices for Contributors

### Code Security

- **No Credentials**: Never commit API keys, tokens, or passwords
- **Input Validation**: Always validate and sanitize user inputs
- **Output Encoding**: Properly encode all outputs
- **Error Handling**: Don't expose sensitive information in error messages
- **Dependencies**: Keep dependencies up-to-date

### Testing Security

- Run security tests: `pnpm test`
- Check for vulnerabilities: `pnpm audit`
- Test with Chrome DevTools Security panel
- Verify CSP compliance
- Test XSS vectors

### Review Checklist

Before submitting code, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] All user inputs are validated
- [ ] Outputs are properly sanitized
- [ ] Error messages don't leak sensitive data
- [ ] Dependencies are up-to-date
- [ ] Security tests pass
- [ ] No new security warnings

## Known Security Considerations

### Chrome AI API Limitations

- **Model Availability**: APIs require Chrome 138+ with flags enabled
- **Model Download**: Initial downloads require internet connection
- **Browser Dependence**: Security relies on Chrome's implementation
- **API Evolution**: APIs are experimental and subject to change

### Application Limitations

- **Client-Side Only**: No server-side validation possible
- **Browser Storage**: LocalStorage used for non-sensitive data only
- **Model Cache**: AI models cached locally by Chrome
- **No Authentication**: Public application without user accounts

## Security Updates

Security updates are released as patch versions (e.g., 1.2.1) and announced through:

- GitHub Security Advisories
- Release notes
- README updates

Subscribe to repository notifications to stay informed about security updates.

## Responsible Disclosure

We follow responsible disclosure practices:

- 90-day disclosure timeline for non-critical issues
- Immediate disclosure for critical issues after fix deployment
- Coordinated disclosure with security researchers
- Public security advisories for confirmed vulnerabilities

## Contact

For security concerns:

- GitHub Security Advisories (preferred)
- Project maintainers via GitHub Issues (for non-sensitive questions)

Thank you for helping keep Chrome AI DevBench and its users secure!

---

**Last Updated**: October 16, 2025
**Version**: 1.0
