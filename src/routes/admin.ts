import { Router, Request, Response } from 'express';
import { KeyManager } from '../services/keyManager';
import { SecurityMiddleware } from '../middleware/security';
import { claudeAuth } from '../services/claudeAuth';

export function createAdminRouter(keyManager: KeyManager, security: SecurityMiddleware): Router {
  const router = Router();

  // Admin interface (HTTPS and session required)
  router.get('/', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {
    const keys = await keyManager.listKeys();
    const activeTokenSuffix = await claudeAuth.getActiveToken();
    
    // Check if active token exists in our database
    let orphanedActiveToken = false;
    if (activeTokenSuffix) {
      orphanedActiveToken = !keys.some(key => key.oauthTokenDisplay.endsWith(activeTokenSuffix));
    }
    
    res.send(`
<!DOCTYPE html>
<html data-theme="dark">
<!-- DEBUG: activeTokenSuffix = ${activeTokenSuffix} -->
<head>
  <title>Claude Code API - Manage Keys</title>
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
      --claude-primary: #BB7CD8;
      --claude-blue: #71AAE4;
      --claude-green: #7DD3A0;
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
    .font-copernicus-admin {
      font-family: 'Playfair Display', 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
      font-size: 3rem; /* 48px for admin header */
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
    .btn-secondary {
      background-color: var(--claude-blue) !important;
      border-color: var(--claude-blue) !important;
      color: #ffffff !important;
    }
    .btn-secondary:hover {
      background-color: #5a99d3 !important;
      border-color: #5a99d3 !important;
      transform: translateY(-1px);
    }
    .btn-error {
      color: var(--claude-orange) !important;
      border-color: var(--claude-orange) !important;
      background-color: transparent !important;
    }
    .btn-error:hover {
      background-color: var(--claude-orange) !important;
      color: #ffffff !important;
    }
    .btn-ghost {
      color: var(--claude-text) !important;
    }
    .btn-ghost:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    .text-primary {
      color: var(--claude-primary) !important;
    }
    .text-error {
      color: var(--claude-orange) !important;
    }
    .navbar {
      background-color: var(--claude-card) !important;
      border-bottom: 1px solid var(--claude-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card {
      border: 1px solid var(--claude-border);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card-body {
      padding: 2rem;
    }
    .table {
      color: var(--claude-text) !important;
    }
    .table th {
      color: var(--claude-muted) !important;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom-color: var(--claude-border) !important;
      padding: 0.75rem;
    }
    .table td {
      padding: 1rem 0.75rem;
      border-bottom: 1px solid var(--claude-border);
    }
    .table-zebra tbody tr:nth-child(even) {
      background-color: rgba(255, 255, 255, 0.02) !important;
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
    .link {
      color: var(--claude-blue) !important;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }
    .link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    .opacity-70 {
      color: var(--claude-muted) !important;
    }
    .toast {
      z-index: 9999;
    }
    .alert-success {
      background-color: rgba(125, 211, 160, 0.08) !important;
      border-color: rgba(125, 211, 160, 0.2) !important;
      color: var(--claude-green) !important;
    }
    code {
      background-color: #1a1a1a !important;
      color: var(--claude-text) !important;
      border: 1px solid var(--claude-border);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
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
    /* Empty state styling */
    .opacity-50 {
      opacity: 0.5;
    }
    /* Overflow handling */
    .overflow-x-auto {
      border-radius: 0.5rem;
    }
    /* Active token styling - subtle approach */
    .token-active {
      background-color: rgba(125, 211, 160, 0.1) !important;
      border: 1px solid rgba(125, 211, 160, 0.3) !important;
    }
    .badge-success {
      background-color: rgba(125, 211, 160, 0.2) !important;
      color: var(--claude-green) !important;
      border: none;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
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
        <span class="text-sm font-styrene">${keys.length} ${keys.length === 1 ? 'key' : 'keys'}</span>
      </div>
      
      <!-- Menu items -->
      <div class="flex items-center gap-1">
        <!-- Authenticated badge -->
        <svg class="w-5 h-5" fill="var(--claude-green)" viewBox="0 0 24 24" title="Authenticated">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <a href="/auth/logout" class="font-styrene" style="color: var(--claude-green);">Logout</a>
      </div>
    </div>
  </div>

  <div class="container mx-auto p-4 max-w-6xl">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-copernicus-admin">API Key Management</h1>
      <a href="/auth/exchange" class="btn btn-secondary gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create New Key
      </a>
    </div>

    ${orphanedActiveToken ? `
    <div class="alert alert-warning mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <h3 class="font-bold">Orphaned Active Token Detected</h3>
        <div class="text-sm">
          An OAuth token ending in <code>...${activeTokenSuffix}</code> is currently active in Claude's configuration 
          but is not in your key database. This may be from a previous installation.
        </div>
        <div class="mt-2">
          <button onclick="clearActiveToken()" class="btn btn-sm btn-error">Clear Active Token</button>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">${keys.length === 0 ? '' : `
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title">Available API Keys</h2>
          <div class="badge badge-primary badge-lg">${keys.length} keys</div>
        </div>`}

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Name</th>
                <th>OAuth Token</th>
                <th>OpenAI Compliant Key</th>
                <th>Created</th>
                <th>Last Used</th>
                <th class="text-center">Revoke</th>
              </tr>
            </thead>
            <tbody id="keysTable">
              ${keys.map(key => {
                const isActive = activeTokenSuffix && key.oauthTokenDisplay.endsWith(activeTokenSuffix);
                return `
                <tr>
                  <td class="font-medium">
                    ${key.keyName}
                    ${isActive ? '<span class="badge badge-success ml-2">Active</span>' : ''}
                  </td>
                  <td>
                    <code class="text-xs bg-base-200 px-2 py-1 rounded ${isActive ? 'token-active' : ''}">
                      ${key.oauthTokenDisplay}
                    </code>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <code class="text-xs bg-base-200 px-2 py-1 rounded key-display" data-key="${key.apiKey}">
                        ${key.apiKey.substring(0, 20)}...${key.apiKey.substring(key.apiKey.length - 4)}
                      </code>
                      <button onclick="toggleKey(this)" class="btn btn-xs btn-ghost">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onclick="copyKey('${key.apiKey}')" class="btn btn-xs btn-ghost">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td class="text-sm opacity-70">${new Date(key.createdAt).toLocaleDateString()}</td>
                  <td class="text-sm opacity-70">${key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</td>
                  <td class="text-center">
                    <button onclick="deleteKey('${key.apiKey}')" class="btn btn-xs btn-error btn-outline">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
          ${keys.length === 0 ? `
            <div class="text-center py-8 opacity-50">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p class="text-muted">No API keys yet. <a href="/auth/exchange" class="link">Create your first key</a></p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  </div>

  <script>
    // Session is already validated by middleware

    async function clearActiveToken() {
      if (!confirm('This will clear the active OAuth token from Claude\'s configuration. Continue?')) {
        return;
      }
      
      try {
        const response = await fetch('/admin/clear-active-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          window.location.reload();
        } else {
          const error = await response.json();
          alert(\`Failed to clear active token: \${error.error}\`);
        }
      } catch (error) {
        alert(\`Failed to clear active token: \${error.message}\`);
      }
    }

    function toggleKey(btn) {
      const keyDisplay = btn.previousElementSibling;
      const fullKey = keyDisplay.dataset.key;
      const isShowing = keyDisplay.textContent === fullKey;
      
      if (isShowing) {
        keyDisplay.textContent = fullKey.substring(0, 20) + '...' + fullKey.substring(fullKey.length - 4);
      } else {
        keyDisplay.textContent = fullKey;
      }
    }

    function copyKey(key) {
      navigator.clipboard.writeText(key).then(() => {
        // Show toast or feedback
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = '<div class="alert alert-success"><span>API key copied!</span></div>';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      });
    }

    async function deleteKey(apiKey) {
      if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
        return;
      }

      try {
        const response = await fetch(\`/admin/keys/\${apiKey}\`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          location.reload();
        } else {
          const data = await response.json();
          alert(data.error?.message || 'Failed to delete key');
        }
      } catch (error) {
        alert('Network error. Please try again.');
      }
    }
  </script>
</body>
</html>
    `);
  });

  // Debug endpoint to test claudeAuth
  router.get('/debug/claude-auth', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {
    try {
      const activeToken = await claudeAuth.getActiveToken();
      const keys = await keyManager.listKeys();
      
      res.json({
        activeTokenSuffix: activeToken,
        activeTokenFound: !!activeToken,
        keys: keys.map(k => ({
          name: k.keyName,
          tokenSuffix: k.oauthTokenDisplay.slice(-4),
          isActive: activeToken && k.oauthTokenDisplay.endsWith(activeToken)
        }))
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Delete API key (requires session)
  router.delete('/keys/:apiKey', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {

    try {
      const deleted = await keyManager.deleteKey(req.params.apiKey);
      
      if (!deleted) {
        return res.status(404).json({
          error: {
            message: 'API key not found',
            type: 'invalid_request_error',
            code: 'key_not_found'
          }
        });
      }

      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting key:', error);
      res.status(500).json({
        error: {
          message: 'Failed to delete API key',
          type: 'api_error',
          code: 'deletion_failed'
        }
      });
    }
  });

  // Clear active OAuth token
  router.post('/clear-active-token', security.requireHttps, security.validateSession, async (req: Request, res: Response) => {
    try {
      await claudeAuth.clearActiveToken();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to clear active token:', error);
      res.status(500).json({
        error: error.message || 'Failed to clear active token'
      });
    }
  });

  return router;
}