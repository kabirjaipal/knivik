# Security Policy

## Supported Versions

This is an open-source, self-hosted project. Security fixes are applied to the latest version on the `main` branch.

| Version | Supported |
| ------- | --------- |
| latest (main) | ✅ |
| older commits | ❌ |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue, please report it privately so it can be addressed before public disclosure.

### How to Report

1. **Email**: Open a [GitHub Security Advisory](https://github.com/kabirjaipal/knivik/security/advisories/new) on this repository.
2. Include the following details:
   - A description of the vulnerability and its potential impact
   - Step-by-step reproduction instructions
   - Any proof-of-concept code or screenshots

### What to Expect

- Acknowledgment within **72 hours**
- A patch or mitigation plan within **7 days** for critical issues
- Credit in the release notes if you'd like to be recognized

## Security Best Practices for Self-Hosters

- Never commit your `.env` file — it contains secrets
- Rotate all API keys (Groq, Resend, Dodo Payments, etc.) immediately if exposed
- Use a strong, randomly-generated `BETTER_AUTH_SECRET` and `CRON_SECRET`
- Enable HTTPS and keep your PostgreSQL instance behind a firewall
- Regularly update dependencies with `npm audit`
