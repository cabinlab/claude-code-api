#!/bin/bash

# Generate self-signed certificates for development

CERT_DIR="certs"
DAYS_VALID=365

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate
openssl req -new -x509 -key "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem" -days $DAYS_VALID \
  -subj "/C=US/ST=State/L=City/O=Claude Code API/CN=localhost"

echo "✅ Self-signed certificates generated in $CERT_DIR/"
echo "   - key.pem  (private key)"
echo "   - cert.pem (certificate)"
echo ""
echo "⚠️  These are for development only. Do not use in production!"