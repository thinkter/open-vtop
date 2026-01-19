# Open-VTOP

An open-source VTOP client with automatic session management.

## Features

- 🚀 **Automatic Session Initialization**: VTOP session cookies and CSRF tokens are automatically established when the server starts
- 🔄 **Background Processing**: Session setup happens in the background, no need to hit any endpoints first
- 📊 **Session Monitoring**: Check session status in real-time via the web interface

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Then open http://localhost:3000

### Production

```bash
npm run build
npm start
```

## How It Works

When the server starts, it automatically:

1. **Establishes cookies** - Gets `SERVERID` and `JSESSIONID` cookies from VTOP
2. **Retrieves CSRF token** - Extracts the `_csrf` token from `/vtop/openPage`
3. **Completes prelogin setup** - POSTs to `/vtop/prelogin/setup` with flag=VTOP
4. **Maintains session state** - Stores cookies and tokens for subsequent requests

All of this happens in the background using Node.js's native fetch API.

## API Endpoints

- `GET /api/session/status` - View current session status (cookies, CSRF, etc.)
- `POST /api/session/refresh` - Manually refresh the VTOP session

## Session Manager

The session manager (`src/session-manager.ts`) is a singleton that:
- Initializes automatically on server startup
- Stores cookies and CSRF tokens
- Can be imported and used by other modules
- Supports manual refresh when needed

```typescript
import { sessionManager } from "./session-manager.js";

// Check if initialized
const isReady = sessionManager.isInitialized();

// Get CSRF token
const csrf = sessionManager.getCsrf();

// Get cookies as header string
const cookies = sessionManager.getCookies();

// Manually refresh
await sessionManager.refresh();
```
