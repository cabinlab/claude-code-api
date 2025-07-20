import { Router, Request, Response } from 'express';
import { KeyManager } from '../services/keyManager';
import { SecurityMiddleware } from '../middleware/security';
import { claudeAuth } from '../services/claudeAuth';
import * as crypto from 'crypto';

export function createAuthRouter(keyManager: KeyManager, security: SecurityMiddleware): Router {
  const router = Router();

  // Serve the login page (HTTPS required)
  router.get('/', security.requireHttps, (req: Request, res: Response) => {
    res.send(`
<!DOCTYPE html>
<html data-theme="dark">
<head>
  <title>Claude Code API - Admin Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Crimson+Text:wght@400;600&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
  <style>
    :root {
      --claude-bg: #1e1e1e;
      --claude-card: #252525;
      --claude-text: #e0e0e0;
      --claude-muted: #888888;
      --claude-primary: #BB7CD8;  /* Purple as primary */
      --claude-blue: #71AAE4;
      --claude-green: #7DD3A0;  /* Harmonious green */
      --claude-orange: #F69D50;
      --claude-border: #333333;
    }
    * {
      box-sizing: border-box;
    }
    body {
      background-color: var(--claude-bg);
      color: var(--claude-text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
    }
    /* Claude font definitions */
    .font-copernicus {
      font-family: 'Playfair Display', 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      font-size: 4rem; /* ~64px for better prominence */
      font-weight: 400;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .font-tiempos {
      font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      font-size: 1.125rem; /* 18px */
      font-weight: 400;
      line-height: 1.5;
    }
    .font-styrene {
      font-family: 'Inter', system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 1rem; /* 16px */
      font-weight: 500;
    }
    .bg-base-100 {
      background-color: var(--claude-card) !important;
    }
    .bg-base-200 {
      background-color: var(--claude-bg) !important;
    }
    .btn {
      font-weight: 500;
      transition: all 0.2s ease;
      border-radius: 0.5rem;
    }
    .btn-primary {
      background-color: var(--claude-primary) !important;
      border-color: var(--claude-primary) !important;
      color: #ffffff !important;
    }
    .btn-primary:hover {
      background-color: #a66cc0 !important;
      border-color: #a66cc0 !important;
      transform: translateY(-1px);
    }
    .btn-secondary, .btn-blue {
      background-color: var(--claude-blue) !important;
      border-color: var(--claude-blue) !important;
      color: #ffffff !important;
    }
    .btn-secondary:hover, .btn-blue:hover {
      background-color: #5a99d3 !important;
      border-color: #5a99d3 !important;
      transform: translateY(-1px);
    }
    .btn-ghost {
      color: var(--claude-text) !important;
    }
    .btn-ghost:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    .input, .textarea {
      background-color: var(--claude-bg) !important;
      border: 1px solid var(--claude-border) !important;
      color: var(--claude-text) !important;
      transition: all 0.2s ease;
      font-size: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
    }
    .input:focus, .textarea:focus {
      border-color: var(--claude-blue) !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(113, 170, 228, 0.1) !important;
    }
    /* Special styling for OAuth token input - using multiple selectors for maximum specificity */
    #oauthToken.input.input-bordered,
    #oauthToken[type="text"],
    input#oauthToken.input-bordered,
    input[type="text"]#oauthToken.input-bordered,
    .form-control input#oauthToken {
      border: 1px solid var(--claude-orange) !important;
      border-color: var(--claude-orange) !important;
      outline: none !important;
      box-shadow: none !important;
    }
    #oauthToken.input.input-bordered:focus,
    #oauthToken[type="text"]:focus,
    input#oauthToken.input-bordered:focus,
    input[type="text"]#oauthToken.input-bordered:focus,
    .form-control input#oauthToken:focus {
      border: 1px solid var(--claude-blue) !important;
      border-color: var(--claude-blue) !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(113, 170, 228, 0.1) !important;
    }
    /* Override DaisyUI's base input styles specifically for this field */
    .input-bordered#oauthToken {
      --tw-border-opacity: 1;
      border-color: var(--claude-orange) !important;
    }
    .input-bordered#oauthToken:focus {
      --tw-border-opacity: 1;
      border-color: var(--claude-blue) !important;
    }
    /* Firefox-specific input styling */
    input:-moz-focusring {
      outline: none !important;
      border-color: var(--claude-blue) !important;
      box-shadow: 0 0 0 3px rgba(113, 170, 228, 0.1) !important;
    }
    /* Disable Firefox autofill styling */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px var(--claude-bg) inset !important;
      -webkit-text-fill-color: var(--claude-text) !important;
      border-color: var(--claude-blue) !important;
    }
    input:-moz-autofill,
    input:-moz-autofill:hover,
    input:-moz-autofill:focus {
      background-color: var(--claude-bg) !important;
      border-color: var(--claude-blue) !important;
      box-shadow: 0 0 0 3px rgba(113, 170, 228, 0.1) !important;
    }
    .text-primary {
      color: var(--claude-primary) !important;
    }
    .text-error {
      color: var(--claude-orange) !important;
    }
    .text-success {
      color: var(--claude-green) !important;
    }
    .alert {
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid;
    }
    .alert-error {
      background-color: rgba(246, 157, 80, 0.08) !important;
      border-color: rgba(246, 157, 80, 0.2) !important;
      color: var(--claude-orange) !important;
    }
    .alert-success {
      background-color: rgba(125, 211, 160, 0.08) !important;
      border-color: rgba(125, 211, 160, 0.2) !important;
      color: var(--claude-green) !important;
    }
    .alert-info {
      background-color: rgba(187, 124, 216, 0.08) !important;
      border-color: rgba(187, 124, 216, 0.2) !important;
      color: var(--claude-primary) !important;
    }
    .navbar {
      background-color: var(--claude-card) !important;
      border-bottom: 1px solid var(--claude-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card {
      border: 1px solid var(--claude-border);
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .card-body {
      padding: 3rem 2.5rem;
    }
    .step-primary:before {
      background-color: var(--claude-primary) !important;
      content: '';
    }
    .step-primary:after {
      background-color: var(--claude-primary) !important;
    }
    .mockup-code {
      background-color: #1a1a1a !important;
      border: 1px solid var(--claude-border);
      border-radius: 0.5rem;
      font-family: 'Monaco', 'Consolas', monospace;
    }
    .mockup-code pre code {
      color: var(--claude-text) !important;
    }
    .link {
      color: var(--claude-blue) !important;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    .link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    .label-text {
      color: var(--claude-text) !important;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .label-text-alt {
      color: var(--claude-muted) !important;
      font-size: 0.75rem;
    }
    .stats {
      background-color: var(--claude-card) !important;
      border: 1px solid var(--claude-border);
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .stat {
      padding: 1.5rem;
    }
    .stat-title {
      color: var(--claude-muted) !important;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .stat-value {
      color: var(--claude-text) !important;
      font-size: 2rem;
      font-weight: 600;
    }
    .stat-desc {
      color: var(--claude-muted) !important;
      font-size: 0.875rem;
    }
    .badge {
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
    .badge-primary {
      background-color: rgba(187, 124, 216, 0.2) !important;
      color: var(--claude-primary) !important;
      border: none;
    }
    .badge-ghost {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: var(--claude-muted) !important;
    }
    .divider:before, .divider:after {
      background-color: var(--claude-border) !important;
    }
    .menu a {
      transition: background-color 0.2s ease;
      border-radius: 0.5rem;
    }
    .menu a:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--claude-bg);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--claude-border);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--claude-muted);
    }
    /* Loading animation */
    .loading {
      color: var(--claude-primary);
    }
    /* Steps color adjustments */
    .steps .step:before {
      background-color: var(--claude-border) !important;
    }
    .steps .step-primary:before {
      background-color: var(--claude-green) !important;
      color: white !important;
    }
    .steps .step-success:before {
      background-color: var(--claude-green) !important;
      color: white !important;
    }
    /* Form adjustments */
    .form-control {
      margin-bottom: 1.5rem;
    }
    /* Toast styling */
    .toast {
      z-index: 9999;
    }
    /* Table styling */
    .table th {
      color: var(--claude-muted) !important;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .table td {
      color: var(--claude-text) !important;
    }
    /* Icon colors */
    .text-primary svg {
      color: var(--claude-primary) !important;
    }
    .text-secondary svg {
      color: var(--claude-blue) !important;
    }
    .text-success svg {
      color: var(--claude-green) !important;
    }
    .text-error svg {
      color: var(--claude-orange) !important;
    }
    /* Login specific styles */
    .login-card {
      max-width: 400px;
      width: 100%;
    }
  </style>
</head>
<body class="min-h-screen bg-base-200">
  <div class="container mx-auto p-4 max-w-md flex flex-col items-center justify-center min-h-screen">
    <!-- Logo and heading outside the card -->
    <div class="text-center mb-12">
      <img src="/assets/claude-orange.png" alt="Claude" class="h-16 w-16 mx-auto mb-8"/>
      <h2 class="font-copernicus mb-2" style="color: var(--claude-text);">
        Welcome back
      </h2>
      <p class="font-tiempos text-muted">Sign in to continue to Claude Code API</p>
    </div>
    
    <!-- Login card -->
    <div class="card bg-base-100 shadow-xl login-card">
      <div class="card-body">
        <form id="loginForm" class="space-y-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Admin Password</span>
            </label>
            <input type="password" id="adminPassword" 
                   class="input input-bordered text-base" 
                   placeholder="Enter your password" 
                   autocomplete="current-password"
                   required>
          </div>
          
          <button type="submit" class="btn btn-blue w-full font-styrene" style="height: 3rem;">
            Continue
          </button>
        </form>
        
        <div id="result" class="mt-6"></div>
        
        <div class="text-center mt-6 pt-6 border-t border-gray-700">
          <a href="https://github.com/cabinlab/claude-code-api" target="_blank" class="font-styrene text-sm flex items-center justify-center gap-2 hover:opacity-80 text-primary">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Claude Code API
          </a>
        </div>
      </div>
    </div>
    
  </div>
  
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Logging in...';
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminPassword: document.getElementById('adminPassword').value
          })
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('result');
        
        if (response.ok) {
          // Redirect based on whether user has existing keys
          window.location.href = data.redirectTo || '/auth/exchange';
        } else {
          resultDiv.innerHTML = \`
            <div class="alert alert-error">
              <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>\${data.error?.message || 'Invalid password'}</span>
            </div>
          \`;
        }
      } catch (error) {
        document.getElementById('result').innerHTML = \`
          <div class="alert alert-error">
            <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Network error. Please try again.</span>
          </div>
        \`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    };
  </script>
</body>
</html>
    `);
  });

  // Handle admin login
  router.post('/login', security.requireHttps, async (req: Request, res: Response) => {
    const { adminPassword } = req.body;

    // Validate admin password
    if (!security.validateAdminPassword(adminPassword)) {
      return res.status(401).json({
        error: {
          message: 'Invalid admin password',
          type: 'authentication_error',
          code: 'invalid_password'
        }
      });
    }

    // Generate secure session token
    const sessionToken = security.generateSessionToken();
    const sessionHash = crypto.createHash('sha256')
      .update(sessionToken + security['adminPasswordHash'])
      .digest('hex');

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };

    res.cookie('sessionToken', sessionToken, cookieOptions);
    res.cookie('sessionHash', sessionHash, cookieOptions);

    // Check if user has existing API keys
    const existingKeys = await keyManager.listKeys();
    const redirectTo = existingKeys.length > 0 ? '/admin' : '/auth/exchange';

    // Login successful with redirect hint
    res.json({ 
      success: true,
      redirectTo,
      keyCount: existingKeys.length 
    });
  });

  // Serve token exchange page (requires session)
  router.get('/exchange', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {
    const existingKeys = await keyManager.listKeys();
    const activeTokenSuffix = await claudeAuth.getActiveToken();
    res.send(`
<!DOCTYPE html>
<html data-theme="dark">
<head>
  <title>Claude Code API - Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Crimson+Text:wght@400;600&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
  <style>
    :root {
      --claude-bg: #1e1e1e;
      --claude-card: #252525;
      --claude-text: #e0e0e0;
      --claude-muted: #888888;
      --claude-primary: #BB7CD8;  /* Purple as primary */
      --claude-blue: #71AAE4;
      --claude-green: #7DD3A0;  /* Harmonious green */
      --claude-orange: #F69D50;
      --claude-border: #333333;
    }
    * {
      box-sizing: border-box;
    }
    body {
      background-color: var(--claude-bg);
      color: var(--claude-text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
    }
    /* Claude font definitions */
    .font-copernicus {
      font-family: 'Playfair Display', 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      font-size: 4rem; /* ~64px for better prominence */
      font-weight: 400;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .font-tiempos {
      font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      font-size: 1.125rem; /* 18px */
      font-weight: 400;
      line-height: 1.6;
    }
    .font-styrene {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 1rem; /* 16px */
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .bg-base-100 {
      background-color: var(--claude-card) !important;
    }
    .bg-base-200 {
      background-color: var(--claude-bg) !important;
    }
    .btn {
      font-weight: 500;
      transition: all 0.2s ease;
      border-radius: 0.5rem;
    }
    .btn-primary {
      background-color: var(--claude-primary) !important;
      border-color: var(--claude-primary) !important;
      color: #ffffff !important;
    }
    .btn-primary:hover {
      background-color: #a66cc0 !important;
      border-color: #a66cc0 !important;
      transform: translateY(-1px);
    }
    .btn-secondary, .btn-blue {
      background-color: var(--claude-blue) !important;
      border-color: var(--claude-blue) !important;
      color: #ffffff !important;
    }
    .btn-secondary:hover, .btn-blue:hover {
      background-color: #5a99d3 !important;
      border-color: #5a99d3 !important;
      transform: translateY(-1px);
    }
    .btn-ghost {
      color: var(--claude-text) !important;
    }
    .btn-ghost:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    .input, .textarea {
      background-color: var(--claude-bg) !important;
      border: 1px solid var(--claude-border) !important;
      color: var(--claude-text) !important;
      transition: all 0.2s ease;
      font-size: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
    }
    .input:focus, .textarea:focus {
      border-color: var(--claude-primary) !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(187, 124, 216, 0.1) !important;
    }
    .text-primary {
      color: var(--claude-primary) !important;
    }
    .text-error {
      color: var(--claude-orange) !important;
    }
    .text-success {
      color: var(--claude-green) !important;
    }
    .alert {
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid;
    }
    .alert-error {
      background-color: rgba(246, 157, 80, 0.08) !important;
      border-color: rgba(246, 157, 80, 0.2) !important;
      color: var(--claude-orange) !important;
    }
    .alert-success {
      background-color: rgba(125, 211, 160, 0.08) !important;
      border-color: rgba(125, 211, 160, 0.2) !important;
      color: var(--claude-green) !important;
    }
    .alert-info {
      background-color: rgba(187, 124, 216, 0.08) !important;
      border-color: rgba(187, 124, 216, 0.2) !important;
      color: var(--claude-primary) !important;
    }
    .navbar {
      background-color: var(--claude-card) !important;
      border-bottom: 1px solid var(--claude-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card {
      border: 1px solid var(--claude-border);
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .card-body {
      padding: 3rem 2.5rem;
    }
    .step-primary:before {
      background-color: var(--claude-primary) !important;
      content: '';
    }
    .step-primary:after {
      background-color: var(--claude-primary) !important;
    }
    .mockup-code {
      background-color: #1a1a1a !important;
      border: 1px solid var(--claude-border);
      border-radius: 0.5rem;
      font-family: 'Monaco', 'Consolas', monospace;
    }
    .mockup-code pre code {
      color: var(--claude-text) !important;
    }
    .link {
      color: var(--claude-blue) !important;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    .link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    .label-text {
      color: var(--claude-text) !important;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .label-text-alt {
      color: var(--claude-muted) !important;
      font-size: 0.75rem;
    }
    .stats {
      background-color: var(--claude-card) !important;
      border: 1px solid var(--claude-border);
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .stat {
      padding: 1.5rem;
    }
    .stat-title {
      color: var(--claude-muted) !important;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .stat-value {
      color: var(--claude-text) !important;
      font-size: 2rem;
      font-weight: 600;
    }
    .stat-desc {
      color: var(--claude-muted) !important;
      font-size: 0.875rem;
    }
    .badge {
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
    .badge-primary {
      background-color: rgba(187, 124, 216, 0.2) !important;
      color: var(--claude-primary) !important;
      border: none;
    }
    .badge-ghost {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: var(--claude-muted) !important;
    }
    .divider:before, .divider:after {
      background-color: var(--claude-border) !important;
    }
    .menu a {
      transition: background-color 0.2s ease;
      border-radius: 0.5rem;
    }
    .menu a:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--claude-bg);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--claude-border);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--claude-muted);
    }
    /* Loading animation */
    .loading {
      color: var(--claude-primary);
    }
    /* Steps color adjustments */
    .steps .step:before {
      background-color: var(--claude-border) !important;
    }
    .steps .step-primary:before {
      background-color: var(--claude-green) !important;
      color: white !important;
    }
    .steps .step-success:before {
      background-color: var(--claude-green) !important;
      color: white !important;
    }
    /* Form adjustments */
    .form-control {
      margin-bottom: 1.5rem;
    }
    /* Toast styling */
    .toast {
      z-index: 9999;
    }
    /* Table styling */
    .table th {
      color: var(--claude-muted) !important;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .table td {
      color: var(--claude-text) !important;
    }
    /* Icon colors */
    .text-primary svg {
      color: var(--claude-primary) !important;
    }
    .text-secondary svg {
      color: var(--claude-blue) !important;
    }
    .text-success svg {
      color: var(--claude-green) !important;
    }
    .text-error svg {
      color: var(--claude-orange) !important;
    }
  </style>
</head>
<body class="min-h-screen bg-base-200">
  <!-- Navbar -->
  <div class="navbar bg-base-100 shadow-lg">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl flex items-center gap-2">
        <img src="/assets/claude-orange.png" alt="Claude" class="h-8 w-8">
        <span style="color: var(--claude-text)" class="font-styrene">Claude Code API</span>
      </a>
    </div>
    <div class="flex-none flex items-center gap-4">
      <!-- Key count badge -->
      <div class="flex items-center gap-1 px-2 py-1 rounded-md bg-base-200">
        <svg class="w-4 h-4" fill="none" stroke="var(--claude-blue)" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span class="text-sm font-styrene">${existingKeys.length} ${existingKeys.length === 1 ? 'key' : 'keys'}</span>
      </div>
      
      <!-- Menu items -->
      <div class="flex items-center gap-4">
        <a href="/admin" class="font-styrene">Manage Keys</a>
        <div class="flex items-center gap-1">
          <!-- Authenticated badge -->
          <svg class="w-5 h-5" fill="var(--claude-green)" viewBox="0 0 24 24" title="Authenticated">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <a href="/auth/logout" class="font-styrene" style="color: var(--claude-green);">Logout</a>
        </div>
      </div>
    </div>
  </div>

  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Heading outside card -->
      <div class="text-center mb-8">
        <h2 class="font-copernicus mb-2" style="color: var(--claude-text);">
          Create API Key
        </h2>
        <p class="font-tiempos text-muted mb-6">
          Generate an OpenAI-compatible key
        </p>
      </div>

      <!-- Create new key card -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
        
        <form id="tokenForm" class="space-y-6">
          <!-- OAuth Token Input with Helper -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Paste Claude Token</span>
              <span class="text-xs font-mono opacity-70">Use: claude get-token</span>
            </label>
            <input type="text" id="oauthToken" 
                   class="input input-bordered font-mono" 
                   placeholder="sk-ant-oat01-..." required>
            <label class="label">
              <span class="label-text-alt">
                <svg class="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your token is encrypted and never exposed through the API
              </span>
            </label>
          </div>
          
          <!-- API Key Name Input -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Preferred Key Name</span>
              <span class="label-text-alt badge badge-ghost">Optional</span>
            </label>
            <input type="text" id="keyName" 
                   class="input input-bordered" 
                   placeholder="my-app">
            <label class="label">
              <span class="label-text-alt">Help identify this key in your dashboard</span>
            </label>
          </div>

          <!-- Info Alert -->
          <div class="alert alert-info">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div class="text-sm">The generated API key will be OpenAI SDK compatible</div>
              <div class="text-xs opacity-70">Use it with any OpenAI client library</div>
            </div>
          </div>
          
          <button type="submit" class="btn btn-blue btn-lg w-full gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Generate API Key
          </button>
        </form>
        
        <div id="result" class="mt-4"></div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Store the active token suffix for comparison
    const activeTokenSuffix = ${activeTokenSuffix ? `'${activeTokenSuffix}'` : 'null'};
    
    // Check if the entered token is active
    function checkTokenActive() {
      const tokenInput = document.getElementById('oauthToken');
      const token = tokenInput.value;
      
      if (activeTokenSuffix && token.endsWith(activeTokenSuffix)) {
        // Token is active - show green border
        tokenInput.style.setProperty('border', '2px solid var(--claude-green)', 'important');
        tokenInput.style.setProperty('box-shadow', '0 0 0 1px var(--claude-green)', 'important');
      } else {
        // Token is not active - show orange border
        tokenInput.style.setProperty('border', '1px solid #F69D50', 'important');
        tokenInput.style.setProperty('box-shadow', 'none', 'important');
      }
    }
    
    // Add event listeners for token input
    document.getElementById('oauthToken').addEventListener('input', checkTokenActive);
    document.getElementById('oauthToken').addEventListener('paste', () => {
      setTimeout(checkTokenActive, 10); // Small delay to ensure paste is processed
    });
    
    // Override focus/blur handlers to respect active state
    document.getElementById('oauthToken').onfocus = function() {
      const token = this.value;
      if (activeTokenSuffix && token.endsWith(activeTokenSuffix)) {
        this.style.setProperty('border', '2px solid var(--claude-green)', 'important');
        this.style.setProperty('box-shadow', '0 0 0 3px rgba(125, 211, 160, 0.1)', 'important');
      } else {
        this.style.setProperty('border', '1px solid #71AAE4', 'important');
        this.style.setProperty('box-shadow', '0 0 0 3px rgba(113, 170, 228, 0.1)', 'important');
      }
    };
    
    document.getElementById('oauthToken').onblur = checkTokenActive;
    
    document.getElementById('tokenForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="loading loading-spinner loading-md"></span> Generating...';
      
      try {
        const response = await fetch('/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oauthToken: document.getElementById('oauthToken').value,
            keyName: document.getElementById('keyName').value || 'default'
          })
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('result');
        
        if (response.ok) {
          resultDiv.innerHTML = \`
            <div class="divider"></div>
            
            <div class="alert alert-success shadow-lg">
              <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="font-bold">API Key Generated Successfully!</h3>
                <div class="text-sm">Save this key - it won't be shown again</div>
              </div>
            </div>
            
            <div class="mt-6 space-y-4">
              <!-- API Key Display -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">New OpenAI API Compatible Key</span>
                  <button onclick="copyApiKey('\${data.apiKey}')" class="btn btn-xs btn-ghost gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </label>
                <div class="mockup-code">
                  <pre data-prefix="$"><code>\${data.apiKey}</code></pre>
                </div>
              </div>

              <!-- Info Box -->
              <div class="alert alert-info">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm">
                  <p>This key maps to your Claude OAuth token and can be used with any OpenAI-compatible client.</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 mt-6">
                <a href="/admin" class="btn btn-primary">Manage Keys</a>
                <button onclick="location.reload()" class="btn btn-ghost">Create Another</button>
              </div>
            </div>
          \`;
          
          // Clear form
          document.getElementById('tokenForm').reset();
        } else {
          if (response.status === 401) {
            // Session expired, redirect to login
            window.location.href = '/auth';
          } else {
            resultDiv.innerHTML = \`
              <div class="divider"></div>
              <div class="alert alert-error shadow-lg">
                <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>\${data.error?.message || 'An error occurred'}</span>
              </div>
            \`;
          }
        }
      } catch (error) {
        document.getElementById('result').innerHTML = \`
          <div class="alert alert-error">
            <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Network error. Please try again.</span>
          </div>
        \`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    };
  </script>
</body>
</html>
    `);
  });

  // Handle token exchange (requires valid session)
  router.post('/exchange', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {
    const { oauthToken, keyName } = req.body;

    // Validate OAuth token format
    if (!oauthToken || !oauthToken.startsWith('sk-ant-oat01-')) {
      return res.status(400).json({
        error: {
          message: 'Invalid OAuth token format. Expected token starting with sk-ant-oat01-',
          type: 'invalid_request_error',
          code: 'invalid_token_format'
        }
      });
    }

    try {
      // Generate and store API key
      const apiKey = await keyManager.createKey(oauthToken, keyName);
      
      // Activate the OAuth token in Claude configuration
      try {
        await claudeAuth.activateToken(oauthToken);
        console.log('OAuth token activated in Claude configuration');
      } catch (activationError) {
        // Log but don't fail the request - the API key is still valid
        console.error('Warning: Failed to activate OAuth token in Claude:', activationError);
      }
      
      res.json({
        apiKey,
        message: 'API key generated successfully'
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({
        error: {
          message: 'Failed to create API key',
          type: 'api_error',
          code: 'key_creation_failed'
        }
      });
    }
  });

  // Handle logout
  router.get('/logout', (req: Request, res: Response) => {
    res.clearCookie('sessionToken');
    res.clearCookie('sessionHash');
    res.redirect('/auth');
  });

  return router;
}