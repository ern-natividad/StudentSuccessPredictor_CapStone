# WMSU Student Success Predictor

Monorepo with a React frontend and Express backend for authentication and password recovery.

## Project Structure

```
├── frontend/          # React + Vite application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express API server
│   ├── src/
│   ├── data/users.json
│   └── package.json
└── package.json       # Root scripts to run both apps
```

## Quick Start

```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Start frontend + backend together
npm run dev
```

- Frontend: http://localhost:5173/
- Backend API: http://localhost:3001/api/auth

Or run separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## Test Credentials

| Role    | Email / Username             | Password   |
| ------- | ---------------------------- | ---------- |
| Admin   | admin@wmsu.edu.ph or `admin` | admin123   |
| Staff   | staff@wmsu.edu.ph or `staff` | staff123   |
| Student | student@wmsu.edu.ph or `student` | student123 |

## Features

### Password Recovery (Backend)
- `POST /api/auth/forgot-password/request` — send verification code
- `POST /api/auth/forgot-password/verify` — verify 6-digit code
- `POST /api/auth/forgot-password/reset` — set new password
- In development, the verification code is returned in the API response and logged to the backend console

### Legal Pages
- `/terms-of-service` — linked from signup Terms of Service
- `/privacy-policy` — linked from signup Privacy Policy

## Build

```bash
npm run build
```

Output is written to `frontend/dist/`.

---

**Architecture Titans** — WMSU Student Success Predictor  
**Version**: 1.3.0 (React + Express)
