## Chat-Deo Server (NestJS)

### Frontend can be found at https://github.com/isagar678/chat-nest-client

NestJS backend for the chat application. Provides auth (local, JWT, Google OAuth), real-time chat via WebSockets, group chat, file storage via Supabase Storage, and an AI chat endpoint backed by Google Gemini.

### Tech stack
- NestJS 11, TypeORM (PostgreSQL), WebSockets (socket.io)
- JWT auth + Google OAuth2
- Supabase Storage for file uploads
- Swagger decorators present (you can wire up Swagger UI if needed)

### Requirements
- Node.js LTS (>= 20)
- PostgreSQL database (use a connection URL)

### Environment variables
Create a `.env` file in `server/` with:

```env
# Server
PORT=3000

# Database
DB_URL=postgres://USER:PASSWORD@HOST:PORT/DB

# Auth / JWT
JWT_SECRET=your-strong-secret

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/redirect

# Frontend (used for OAuth redirect)
FRONTEND_URL=http://localhost:5173

# Supabase Storage (server-side service key)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI (Google Gemini)
GEMINI_API_KEY=...
```

Notes:
- Database config reads `DB_URL` and enables SSL with `rejectUnauthorized=false`. Adjust if your DB does not require SSL.
- OAuth redirect endpoint is `/auth/google/redirect`; the server redirects back to `${FRONTEND_URL}/api?access_token=...`.

### Install
```bash
npm install
```

### Run
```bash
# development (watch)
npm run start:dev

# development (single run)
npm run start

# production (build then run dist)
npm run build
npm run start:prod
```

Server listens on `http://localhost:${PORT}` (default 3000).

### Test
```bash
npm run test           # unit
npm run test:e2e       # e2e
npm run test:cov       # coverage
```

### Key endpoints
- `POST /auth/register`, `POST /auth/login`, `POST /auth/token`, `POST /auth/forgot-password`, `POST /auth/logout`
- `GET /auth/profile` (Bearer token)
- `GET /auth/google` → Google OAuth flow → `GET /auth/google/redirect`
- `POST /ai/chat` (Bearer token) — forwards prompts/messages to Gemini

### File storage
Supabase Storage bucket `chat-nest-file-bucket` is used for uploads (e.g., avatars). Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Deployment
- A `vercel.json` file is included for deploying on Vercel. Ensure all required env vars are set in the Vercel project.
- Set `FRONTEND_URL` to your deployed client URL.

### Project structure (high level)
- `src/modules/auth` — Local/JWT/Google strategies and controllers
- `src/modules/chat` — WebSocket gateway
- `src/modules/group` — Group chat management
- `src/modules/storage` — Supabase storage provider/service
- `src/modules/ai` — Gemini proxy controller
