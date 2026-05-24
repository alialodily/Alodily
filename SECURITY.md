# Security Policy

## 🛡️ Healthcare Context

Patient Link AI is a healthcare engagement platform handling sensitive workflows.
We treat security as a clinical safety issue, not just a software concern.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| < 1.4   | :x: Upgrade required |

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **DO NOT** disclose it on social media or public channels
3. Email the project lead directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact (especially patient safety implications)
   - Suggested remediation if known

Responses typically within 48 hours. Critical vulnerabilities are patched within 7 days.

## Security-Critical Design Principles

### PHI Handling
- Patient names, room numbers, and clinical context are anonymized before any AI API call
- "Privacy Mode" masks identifiers in all UI views
- No PHI is logged to console or persistent storage
- Audit trail uses hashed identifiers where possible

### Authentication
- Patient sessions: bedside QR + 4-digit PIN, session-bound to room
- Staff sessions: Staff ID + PIN (SSO/MFA in production)
- Idle auto-lock: 90 seconds across all authenticated views
- Session tokens expire on role change

### AI Safety Layer
- Emergency keywords detected pre-AI (chest pain, can't breathe, etc.)
- AI rebalance suggestions client-side validated before apply
- AI cannot move emergency-status rooms
- AI cannot overload nurses beyond defined threshold
- All AI actions logged in audit trail

### Network
- TLS 1.3 enforced
- API key never exposed to client (Vercel serverless function proxy)
- CORS configured for production domain only
- Rate limiting on AI endpoints

### Audit & Compliance
- Every action logged: actor, action, target, timestamp, reason
- PDPL (Saudi Personal Data Protection Law) aligned
- CBAHI documentation standards followed
- HIPAA-equivalent principles applied

## What to Report

Examples of vulnerabilities we want to know about:
- Authentication bypass
- Session hijacking
- PHI leakage in logs, API responses, or AI prompts
- Cross-site scripting (XSS) or injection
- Privilege escalation (e.g., patient accessing nurse view)
- Audit log tampering or bypass
- Emergency keyword detection bypass

## Scope

This security policy covers:
- The Patient Link AI codebase in this repository
- The Vercel serverless function (`api/claude.js`)
- The integration with the Anthropic API

This policy does NOT cover:
- The hospital's primary clinical systems
- The nurse call bell (a separate, primary system)
- Third-party services beyond Anthropic API
