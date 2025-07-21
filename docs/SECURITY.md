# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Claude Code API, please **DO NOT** create a public GitHub issue. Instead, please report it responsibly by emailing: security@cabinlab.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Features

### Authentication & Authorization

#### Admin Interface
- **HTTPS Required**: Admin endpoints enforce HTTPS with automatic redirection
- **Session Management**: HTTP-only, secure cookies with SameSite protection
- **Password Hashing**: Bcrypt with appropriate work factor
- **Session Timeout**: 24-hour expiration for admin sessions

#### API Authentication
- **Bearer Tokens**: OpenAI-compatible format for client compatibility
- **Token Isolation**: OAuth tokens never exposed through API
- **Key Rotation**: Easy revocation and regeneration of API keys

### Data Protection

#### Token Storage
- **Encrypted at Rest**: OAuth tokens stored with encryption
- **Memory Protection**: Tokens cleared from environment after use
- **No Logging**: Sensitive data excluded from logs

#### API Key Management
```json
{
  "sk-xxxx": {
    "oauthToken": "encrypted-token",
    "keyName": "app-name",
    "createdAt": "timestamp",
    "lastUsed": "timestamp"
  }
}
```

### Network Security

#### HTTPS/TLS
- **Self-Signed Certs**: Development environment
- **Production Ready**: Supports standard TLS certificates
- **Secure Headers**: HSTS, X-Frame-Options, CSP

#### Rate Limiting
- **Default**: 100 requests/minute per IP
- **Configurable**: Adjust based on usage patterns
- **Memory-Based**: Resets on server restart

### Input Validation

#### Request Validation
```typescript
// Example validation
if (!request.messages || !Array.isArray(request.messages)) {
  return res.status(400).json({
    error: {
      message: 'Invalid request format',
      type: 'invalid_request_error',
      code: 'invalid_messages'
    }
  });
}
```

#### Token Format Validation
- OAuth tokens must match: `sk-ant-oat01-*`
- API keys follow OpenAI format: `sk-*`
- Strong randomness for key generation

## Security Best Practices

### For Administrators

1. **Strong Admin Password**
   - Use a unique, complex password
   - Store securely (password manager)
   - Change regularly

2. **OAuth Token Management**
   - Generate tokens only when needed
   - Revoke unused tokens
   - Monitor token usage

3. **SSL Certificates**
   - Use proper certificates in production
   - Keep certificates up-to-date
   - Implement certificate pinning if needed

### For Developers

1. **Environment Variables**
   ```bash
   # Never commit .env files
   echo ".env" >> .gitignore
   
   # Use strong passwords
   ADMIN_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Docker Security**
   ```dockerfile
   # Run as non-root user
   USER claude
   
   # Minimal attack surface
   FROM ghcr.io/cabinlab/claude-code-sdk-docker:typescript
   ```

3. **Code Security**
   - Never log sensitive data
   - Validate all inputs
   - Use parameterized queries
   - Handle errors gracefully

### For Users

1. **API Key Protection**
   - Treat API keys as passwords
   - Use environment variables
   - Rotate keys regularly
   - Monitor usage

2. **Network Security**
   - Use HTTPS in production
   - Implement firewall rules
   - Use VPN for sensitive environments

## Security Headers

The application sets these security headers:

```typescript
// Prevent clickjacking
res.setHeader('X-Frame-Options', 'DENY');

// Prevent MIME type sniffing
res.setHeader('X-Content-Type-Options', 'nosniff');

// Enable XSS protection
res.setHeader('X-XSS-Protection', '1; mode=block');

// Referrer policy
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
```

## Vulnerability Disclosure

### Known Limitations

1. **Rate Limiting**: In-memory storage resets on restart
2. **Session Storage**: Not distributed across instances
3. **File Storage**: Local JSON file for keys

### Mitigation Strategies

1. **Production Deployment**
   - Use external rate limiting (nginx, Cloudflare)
   - Implement distributed session storage
   - Consider database for key storage

2. **Monitoring**
   - Log authentication attempts
   - Monitor API usage patterns
   - Alert on suspicious activity

## Security Checklist

### Before Deployment

- [ ] Change default admin password
- [ ] Generate production SSL certificates
- [ ] Review firewall rules
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
- [ ] Review Docker permissions
- [ ] Audit dependencies

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Rotate admin password quarterly
- [ ] Review API key usage
- [ ] Check for security advisories
- [ ] Test backup/restore procedures
- [ ] Audit access logs

## Compliance

### Data Privacy
- No user data collection
- No analytics or tracking
- Local storage only
- GDPR compliant by design

### Logging
- Security events logged
- No PII in logs
- Configurable log levels
- Structured logging format

## Contact

For security concerns, contact: security@cabinlab.com

For general support, use GitHub Issues.

## Updates

This security policy is reviewed quarterly and updated as needed. Last update: January 2024.