# Netlify Configuration Backup

This file contains backups of Netlify-specific files that were removed. You can restore these files if you decide to use Netlify again.

## File: netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

# Headers for security and caching
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

# Allow caching of static assets (JS, CSS, images)
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.svg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.woff"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# API routes - redirect to Netlify function
# serverless-http will handle the full path automatically
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200

# SPA routing - send all non-API routes to index.html for client-side routing
# This must be last to catch all other routes
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## File: netlify/functions/api.js

```javascript
const serverless = require('serverless-http');
const app = require('../../api/index');

exports.handler = serverless(app);
```

## How to Restore

If you want to use Netlify again:

1. **Create the netlify.toml file:**
   ```bash
   # Copy the netlify.toml content above into a new file
   ```

2. **Create the netlify/functions directory:**
   ```bash
   mkdir -p netlify/functions
   ```

3. **Create netlify/functions/api.js:**
   ```bash
   # Copy the netlify/functions/api.js content above into the file
   ```

4. **Make sure serverless-http is installed:**
   ```bash
   npm install serverless-http
   ```

## Notes

- The `netlify.toml` file configures Netlify to use the serverless function wrapper
- The `netlify/functions/api.js` file wraps your `api/index.js` with serverless-http for Netlify compatibility
- Your main API code in `api/index.js` works with both Vercel and Netlify
- These files are only needed for Netlify deployments, not Vercel





