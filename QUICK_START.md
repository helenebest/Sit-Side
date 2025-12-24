# Quick Start Guide - Fix Sign In Issue

## The Problem
The sign-in timeout error occurs because the backend server is not running. The frontend is trying to connect to `http://localhost:5000/api` but the server isn't available.

## Solution: Start the Backend Server

### Option 1: Simple Server (Recommended for Quick Testing)
This doesn't require MongoDB and works immediately:

```bash
# Navigate to the backend directory
cd backend

# Start the simple server (no database needed)
node server-simple.js
```

You should see:
```
🚀 Server running on port 5000
📱 Frontend URL: http://localhost:3000
💾 Using in-memory storage (demo mode)
🔗 Health check: http://localhost:5000/api/health
```

### Option 2: Full Server (Requires MongoDB)
If you have MongoDB installed and running:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
# OR for development with auto-reload:
npm run dev
```

## Start the Frontend

In a **new terminal window**, run:

```bash
# From the project root
npm start
```

The frontend will start on `http://localhost:3000`

## Test the Connection

1. Open your browser to `http://localhost:3000`
2. Try signing in with your credentials
3. The timeout error should be resolved!

## Default Admin Account (Simple Server Only)

If using `server-simple.js`, you can log in with:
- **Email:** `admin@sitside.com`
- **Password:** `Tenacity2301!`

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, you can:
1. Change the port in `backend/server-simple.js` (line 465)
2. Or set an environment variable: `PORT=5001 node server-simple.js`
3. Update `src/contexts/AuthContext.js` (line 14) to match the new port: change `http://localhost:5000/api` to `http://localhost:5001/api`

### Still Getting Timeout?
1. Make sure the backend server is running (check the terminal)
2. Verify the server is on port 5000: visit `http://localhost:5000/api/health` in your browser
3. Check browser console for detailed error messages
4. Make sure both frontend and backend are running simultaneously

