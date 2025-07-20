import express from 'express';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import cookieParser from 'cookie-parser';

import { KeyManager } from './services/keyManager';
import { ClaudeService } from './services/claude';
import { SecurityMiddleware } from './middleware/security';
import { createAuthRouter } from './routes/auth';
import { createAdminRouter } from './routes/admin';
import { createApiRouter } from './routes/api';

// Configuration
const PORT = process.env.PORT || 8000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Admin password (in production, use a strong password from environment)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

async function startServer() {
  // Initialize services
  const keyManager = new KeyManager();
  await keyManager.initialize();
  
  const claudeService = new ClaudeService();
  const security = new SecurityMiddleware(keyManager, ADMIN_PASSWORD_HASH);

  // Create Express app
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Serve static assets
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  // CORS headers for API compatibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Routes
  app.use('/auth', createAuthRouter(keyManager, security));
  app.use('/admin', createAdminRouter(keyManager, security));
  app.use('/v1', createApiRouter(claudeService, security));

  // Root redirect
  app.get('/', (req, res) => {
    res.redirect('/auth');
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: 'The requested endpoint does not exist',
        type: 'invalid_request_error',
        code: 'endpoint_not_found'
      }
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        message: 'An unexpected error occurred',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  });

  // Start HTTP server
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`🚀 HTTP API server running on http://localhost:${PORT}`);
    console.log(`📝 OpenAI-compatible endpoint: http://localhost:${PORT}/v1`);
  });

  // Start HTTPS server if certificates exist
  const certPath = path.join('certs', 'cert.pem');
  const keyPath = path.join('certs', 'key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };

    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
      console.log(`🔑 Token exchange: https://localhost:${HTTPS_PORT}/auth`);
      console.log(`👤 Admin panel: https://localhost:${HTTPS_PORT}/admin`);
    });
  } else {
    console.log('⚠️  No SSL certificates found. HTTPS server not started.');
    console.log('   Run "npm run generate-certs" to create self-signed certificates.');
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});