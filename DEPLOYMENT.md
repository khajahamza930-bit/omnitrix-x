# OMNITRIX X — Deployment Guide

## Architecture

OMNITRIX X has two separately deployable parts:

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO

The frontend communicates with the backend using Socket.IO.

## 1. Frontend configuration

Create a frontend environment variable:

VITE_SERVER_URL=https://your-backend-domain.example

Replace the example with the actual public backend origin.

Important:
- Use HTTPS when the frontend is served over HTTPS.
- Do not include a trailing path, query, or hash.
- VITE_ variables are public and become part of the frontend build.
- Never put API keys, passwords, tokens, or private secrets in VITE_ variables.

Build the frontend:

npm install
npm run build

Deploy the generated `dist` directory using your chosen static hosting provider.

Set VITE_SERVER_URL in that provider's build environment before building.

## 2. Backend configuration

The backend is inside the `server` directory.

For a hosting provider that supports a separate service root directory:

- Root directory: server
- Install command: npm install
- Start command: npm start

Configure these environment variables in the hosting provider:

PORT=<provided automatically by the hosting provider>
CLIENT_ORIGINS=https://your-frontend-domain.example

For multiple frontend origins, separate them with commas.

Example:

CLIENT_ORIGINS=https://your-frontend-domain.example,https://preview.example

Do not include trailing slashes in the origins.

The backend already reads the hosting provider's PORT variable.

## 3. Health check

After deployment, open:

https://your-backend-domain.example/health

Expected response:

{
  "status": "ok",
  "service": "omnitrix-x-multiplayer"
}

## 4. Socket.IO requirements

The backend hosting provider must support persistent Node.js processes and WebSocket connections.

Make sure:
- WebSocket upgrades are supported.
- The service is not configured as a short-lived serverless function.
- HTTPS/WSS connections are allowed.
- The frontend uses the public backend URL.
- CLIENT_ORIGINS contains the exact deployed frontend origin.

## 5. Local development

Frontend terminal:

npm run dev

Backend terminal:

cd server
npm install
npm run dev

Local frontend: http://localhost:5173
Local backend: http://localhost:3001

The frontend automatically uses localhost:3001 in Vite development mode when VITE_SERVER_URL is not set.

## 6. Verification

Backend tests:

cd server
npm test

Frontend lint:

npm run lint

Frontend production build:

npm run build

## 7. Security notes

- Environment templates contain configuration examples, not secrets.
- Actual .env files must never be committed.
- Origin restrictions are not user authentication.
- Multiplayer currently identifies connected players by socket connection IDs.
- Production deployment does not add account authentication or persistent room storage.
- Configure production origins explicitly. Do not use wildcard origins.

## 8. Free hosting considerations

Before selecting a provider, verify that its free tier supports:

- A persistent Node.js web service.
- Socket.IO and WebSocket connections.
- The required monthly usage.

Free services may sleep after inactivity, restart, or enforce usage limits. Multiplayer connections may be interrupted during these events. Do not activate a paid upgrade without reviewing its cost.

## 9. Multiplayer room storage

Room state is currently stored in the backend process memory using a JavaScript Map.

This means:
- Restarting or redeploying the backend clears active rooms.
- Running multiple backend instances does not share room state.
- The initial deployment should use one backend instance.
- Shared storage and a Socket.IO adapter would be needed before horizontal scaling.

