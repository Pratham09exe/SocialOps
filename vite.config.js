import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://fastapi.tiangolo.com https://*.googleusercontent.com https://lh3.googleusercontent.com; font-src 'self' data:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:5173 ws://127.0.0.1:5173; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
}

function securityHeadersPlugin() {
  const sanitizeMiddleware = (req, res, next) => {
    const rawUrl = req.url || ''
    // Guard against path traversal patterns in URL path and query parameters
    if (
      rawUrl.includes('..') ||
      rawUrl.includes('%2e%2e') ||
      rawUrl.includes('%2E%2E') ||
      /[?&]v=[/\\%]|node_modules.*(?:\.\.|%2f|\/\/)/i.test(rawUrl) ||
      (rawUrl.includes('?') && /%2[fF]|%5[cC]/.test(rawUrl))
    ) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'text/plain')
      res.end('Bad Request - Invalid request path or query parameters')
      return
    }

    for (const [key, val] of Object.entries(securityHeaders)) {
      res.setHeader(key, val)
    }
    next()
  }

  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use(sanitizeMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(sanitizeMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), securityHeadersPlugin()],
  server: {
    headers: securityHeaders,
    fs: {
      strict: true,
      deny: ['..', '.env', '.env.*', '*.key', '*.pem'],
    },
  },
  preview: {
    headers: securityHeaders,
  },
})
