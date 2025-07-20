# Extend the TypeScript base image from claude-code-sdk-docker
FROM ghcr.io/cabinlab/claude-code-sdk-docker:typescript

# Switch to root to install dependencies
USER root

# Install additional Node packages
WORKDIR /app
COPY package.json ./
RUN npm install

# Copy application files
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Create directories for data and certs with correct permissions
RUN mkdir -p data certs && \
    chown -R claude:claude /app && \
    chmod 755 data certs

# Generate self-signed certificates if they don't exist (as root for proper permissions)
RUN bash -c "if [ ! -f certs/cert.pem ]; then npm run generate-certs; fi" && \
    chown -R claude:claude /app/certs

# Switch back to claude user
USER claude

# Expose ports
EXPOSE 8000 8443

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV HTTPS_PORT=8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the server using tsx (already installed in base image)
CMD ["tsx", "src/server.ts"]