# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Security issues are taken seriously and should be reported privately to give us time to address them before public disclosure.

### How to Report

If you discover a security vulnerability in Dorisio, please email us at **security@dorisio.io** with:

1. **Description** - A clear description of the vulnerability
2. **Location** - Specific file(s), component(s), or URL(s) affected
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Impact** - Explanation of the potential impact (e.g., data exposure, authentication bypass)
5. **Proof of Concept** - If applicable, provide a minimal example demonstrating the vulnerability
6. **Your Contact Information** - Name, email, and optionally PGP key for encrypted communication

### Response Timeline

- **Initial Response** - We aim to respond to security reports within 48 hours
- **Assessment** - We will evaluate the vulnerability and determine severity
- **Fix Development** - We will work on a fix based on the severity
- **Disclosure** - Once patched, we will coordinate responsible disclosure

## Security Considerations

### Wallet & Payment Security

Since Dorisio handles wallet keys and payment processing, please pay extra attention to:

- **Key Management** - Ensure private keys are never exposed in logs, error messages, or network traffic
- **Sensitive Data** - PII, API keys, and credentials should never be stored in plain text
- **Authentication** - All payment-related endpoints require proper authentication and authorization
- **Input Validation** - All user inputs, especially amounts and addresses, must be validated
- **HTTPS** - All communication with payment services must use HTTPS
- **Rate Limiting** - Payment endpoints should have rate limiting to prevent abuse

## Security Best Practices for Contributors

When contributing to Dorisio, follow these security best practices:

1. **Never commit secrets** - Use `.env` files for sensitive configuration (never commit them)
2. **Validate inputs** - Sanitize and validate all user inputs
3. **Use HTTPS** - Always use secure protocols for external communication
4. **Audit dependencies** - Regularly check for vulnerable dependencies
5. **Code review** - Request security review for sensitive changes
6. **Testing** - Write tests for security-related functionality
7. **Documentation** - Document security-related decisions and workarounds

## Dependency Updates

We regularly update dependencies to patch security vulnerabilities. Subscribe to security advisories for:

- **npm** - Monitor for advisories on packages
- **Node.js** - Follow Node.js security releases
- **React/Next.js** - Monitor upstream security updates

## Vulnerability Disclosure

Once a vulnerability is fixed and patched:

1. We will publish a security advisory
2. We will credit the reporter (unless they prefer anonymity)
3. We will provide clear upgrade instructions
4. We may coordinate with other projects if the vulnerability affects them

## Security Updates

We release security patches as needed, outside of regular release cycles. Keep Dorisio updated to ensure you have the latest security fixes.

## PGP Key

For highly sensitive reports, you may encrypt your message using our PGP key (if available). Contact us for details.

---

Thank you for helping keep Dorisio secure!
