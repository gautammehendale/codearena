# CodeArena ⚔️

> A full-stack competitive programming platform with real-time judging, Docker sandboxed code execution, Redis-powered leaderboards, and WebSocket live updates.

[![CI/CD](https://github.com/gautammehendale/codearena/actions/workflows/ci.yml/badge.svg)](https://github.com/gautammehendale/codearena/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🚀 Features

- **Multi-Language Code Editor** — Monaco Editor (VS Code engine) supporting Python, JavaScript, Java, C++, and C
- **Docker Sandboxed Execution** — Each submission runs in an isolated container with memory/CPU limits and network disabled
- **Real-Time Judging** — WebSocket (Socket.io) pushes results instantly as each test case runs
- **Redis Leaderboard** — Sorted sets for O(log n) rank updates; live board refreshes via WebSocket
- **Bull Queue** — Redis-backed job queue processes concurrent submissions without blocking the API
- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Contest Mode** — Timed contests with live leaderboards and isolated problem sets
- **GitHub Actions CI/CD** — Automated TypeScript checks, builds, and Docker image validation on every push

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│          Next.js + TypeScript + Monaco Editor            │
│              Socket.io Client (WebSockets)               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (Node.js)                        │
│           Express REST API + Socket.io Server            │
│                                                          │
│   ┌──────────────┐   ┌────────────┐   ┌─────────────┐  │
│   │  Auth Routes │   │  Problems  │   │ Submissions │  │
│   │  JWT + bcrypt│   │  + Cache   │   │   + Queue   │  │
│   └──────────────┘   └────────────┘   └──────┬──────┘  │
│                                               │          │
│   ┌────────────────────────────────────────── ▼──────┐  │
│   │              Bull Queue (Redis)                   │  │
│   │         3 concurrent worker threads               │  │
│   └─────────────────────────┬─────────────────────────┘ │
└─────────────────────────────┼───────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────┐
│                  Judge Engine                            │
│         Docker container per submission                  │
│   • Memory limit enforced   • CPU capped at 0.5 cores   │
│   • Network disabled        • Read-only filesystem      │
│   • Timeout: configurable   • ulimit process cap        │
└────────────────────────────────────────────────────────┘
          │                             │
┌─────────▼──────┐           ┌──────────▼───────┐
│   PostgreSQL   │           │      Redis        │
│  Users, Probs  │           │  Leaderboard      │
│  Submissions   │           │  Queue, Cache     │
│  Contests      │           │  (Sorted Sets)    │
└────────────────┘           └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Monaco Editor |
| **State Management** | Zustand |
| **Real-Time** | Socket.io (WebSockets) |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL 15 |
| **Cache & Queue** | Redis 7 (ioredis + Bull) |
| **Auth** | JWT + bcrypt |
| **Judge** | Docker (sandboxed containers) |
| **DevOps** | Docker Compose, GitHub Actions |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+, Docker, Docker Compose

### 1. Clone & Configure
```bash
git clone https://github.com/gautammehendale/codearena.git
cd codearena
cp backend/.env.example backend/.env
```

### 2. Start Infrastructure
```bash
docker-compose up postgres redis -d
```

### 3. Install & Run Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Seed Database
```bash
node src/utils/seed.js
# Creates admin@codearena.dev / admin123 + 8 sample problems
```

### 5. Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### Or run everything with Docker
```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
codearena/
├── backend/
│   ├── src/
│   │   ├── routes/          # auth, problems, submissions, leaderboard, contests
│   │   ├── services/
│   │   │   ├── judge.js     # Docker sandboxed execution engine
│   │   │   ├── queue.js     # Bull queue + submission processor
│   │   │   ├── redis.js     # Leaderboard (sorted sets) + caching
│   │   │   └── socket.js    # WebSocket event handlers
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # PostgreSQL schema + init
│   │   └── utils/           # Logger, seed script
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # Navbar, Editor, UI components
│       └── lib/             # API client, Zustand store, Socket
├── .github/workflows/       # CI/CD pipeline
└── docker-compose.yml
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/problems` | List problems (filter, search, paginate) |
| GET | `/api/problems/:slug` | Get problem details |
| POST | `/api/submissions` | Submit code (queued via Bull) |
| GET | `/api/submissions/:id` | Get submission result |
| GET | `/api/leaderboard` | Global leaderboard (Redis sorted set) |
| GET | `/api/contests` | List contests |

---

## 🔒 Judge Sandbox

Each code submission runs in a Docker container with strict isolation:
```
docker run --rm
  --memory="256m"          # Memory limit
  --cpus="0.5"             # CPU cap
  --network=none           # No internet access
  --read-only              # Immutable filesystem
  --tmpfs /tmp:size=10m    # Tiny temp space
  --ulimit nproc=50:50     # Process limit
```

Supported languages: **Python 3.11**, **JavaScript (Node 20)**, **Java 17**, **C++17**, **C**

---

## 📊 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_submission` | Client → Server | Subscribe to submission updates |
| `submission_update` | Server → Client | Real-time judge result |
| `join_user` | Client → Server | Subscribe to user notifications |
| `submission_result` | Server → Client | Final verdict notification |
| `leaderboard_update` | Server → Client | Live rank changes |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

MIT © [Gautam Mehendale](https://github.com/gautammehendale)
