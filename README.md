# CodeArena ⚔️

> A full-stack competitive programming platform — practice 30 curated problems, battle 1v1 in real-time, earn badges, and climb live leaderboards.

🌐 **Live:** [codearena-nine-sooty.vercel.app](https://codearena-nine-sooty.vercel.app)

[![CI/CD](https://github.com/gautammehendale/codearena/actions/workflows/ci.yml/badge.svg)](https://github.com/gautammehendale/codearena/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Built by Gautam Mehendale with some assistance from Claude (Anthropic) for boilerplate and debugging.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Monaco Code Editor** | VS Code engine — Python, JavaScript, Java, C++, C |
| **Safe Code Execution** | Docker-sandboxed + Judge0 CE cloud execution in production |
| **Real-Time Judging** | WebSocket streams results live as each test case runs |
| **1v1 Battle Mode** | Every 30 mins — enroll, get matched, choose difficulty, race to solve |
| **AI Hint Assistant** | Groq Llama 3.3 70B — 3 progressive logic-only hints per problem |
| **AI Problem Generator** | Groq auto-generates new battle-exclusive problems to keep pool fresh |
| **Redis Leaderboard** | O(log n) rank updates via sorted sets — live WebSocket refresh |
| **First Blood Badge** | First user to solve a problem earns special badge + 100 pts |
| **Skill Heatmap** | Profile shows strong/weak topics based on solve history |
| **Streak System** | Daily solve streaks with milestone badges at 7/30/100 days |
| **Admin Dashboard** | Protected `/admin` shows all users, activity, submissions |
| **Google OAuth** | Sign in with Google + JWT email/password auth |
| **Google Analytics** | GA4 tracking across all pages |
| **Timed Contests** | Monthly contests with problem reveals and isolated leaderboards |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│       Next.js 14 + TypeScript + Tailwind + Monaco Editor   │
│              Socket.io Client · Zustand State               │
└───────────────────────┬────────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼────────────────────────────────────┐
│                  Backend (Node.js + Express)                 │
│                                                             │
│  Auth · Problems · Submissions · Battles · Hints · Stats   │
│                         │                                   │
│          Bull Queue (3 concurrent workers)                  │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────────┐    │
│  │              Code Execution Layer                    │    │
│  │  Production: Judge0 CE API (cloud, no key needed)   │    │
│  │  Local Dev:  Docker sandbox (isolated containers)   │    │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                              │
┌──────────▼──────┐            ┌──────────▼──────────┐
│   PostgreSQL    │            │       Redis          │
│  (Neon cloud)   │            │   (Upstash cloud)    │
│  Users, Probs,  │            │  Leaderboard (sets)  │
│  Submissions,   │            │  Job Queue, Cache    │
│  Battles, Chat  │            │  Hint tracking       │
└─────────────────┘            └──────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Monaco Editor |
| **State** | Zustand (persisted) |
| **Real-Time** | Socket.io WebSockets |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL 15 (Neon) |
| **Cache & Queue** | Redis 7 — ioredis + Bull (Upstash) |
| **Auth** | JWT + bcrypt + Google OAuth (Passport.js) |
| **Code Execution** | Judge0 CE (production) · Docker sandbox (local) |
| **AI** | Groq Llama 3.3 70B — hints + problem generation |
| **DevOps** | Vercel (frontend) · Render (backend) · GitHub Actions CI/CD |
| **Analytics** | Google Analytics 4 |

---

## ⚡ Quick Start (Local)

### Prerequisites
Node.js 20+, Docker Desktop

### 1. Clone & configure
```bash
git clone https://github.com/gautammehendale/codearena.git
cd codearena
cp backend/.env.example backend/.env
# Fill in: JWT_SECRET, GROQ_API_KEY, GOOGLE_CLIENT_ID/SECRET
```

### 2. Start infrastructure
```bash
docker-compose up postgres redis -d
```

### 3. Backend
```bash
cd backend && npm install && npm run dev
```

### 4. Seed database (30 problems + admin + battle problems)
```bash
node src/utils/seed.js
node src/utils/generateProblems.js
node src/utils/seedBattleProblems.js
# Admin: admin@codearena.dev / admin123
```

### 5. Frontend
```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:3000**

---

## 📁 Project Structure

```
codearena/
├── backend/src/
│   ├── routes/           # auth, problems, submissions, battles,
│   │                     # leaderboard, contests, hints, skills,
│   │                     # badges, chat, stats
│   ├── services/
│   │   ├── judge.js          # Docker sandbox engine
│   │   ├── judge0.js         # Judge0 CE cloud execution
│   │   ├── queue.js          # Bull queue + submission processor
│   │   ├── redis.js          # Leaderboard + caching
│   │   ├── socket.js         # WebSocket handlers + bot chat
│   │   ├── battleScheduler.js# Every-30-min battle automation
│   │   └── problemGenerator.js# Groq AI problem generation
│   ├── models/           # PostgreSQL schema + migrations
│   └── utils/            # seed.js, curateProblems.js,
│                         # seedBattleProblems.js
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx          # Homepage with live stats
│   │   ├── problems/[slug]/  # Problem + Monaco + draggable results
│   │   ├── battles/[id]/     # 1v1 arena with chat + progress bars
│   │   ├── leaderboard/      # Redis-powered live rankings
│   │   ├── contests/         # Monthly timed contests
│   │   ├── profile/          # Skill heatmap + badges + history
│   │   └── admin/            # User activity dashboard
│   ├── components/ui/
│   │   ├── Navbar.tsx        # Active-state nav with admin link
│   │   ├── RunResultPanel.tsx# Shared expandable test results
│   │   └── WakeUpBanner.tsx  # Render free-tier wake indicator
│   └── lib/
│       ├── api.ts            # Axios + in-memory cache
│       ├── store.ts          # Zustand auth (hydration-safe)
│       └── socket.ts         # Socket.io singleton
├── .github/workflows/ci.yml  # TypeScript + build + Docker checks
└── docker-compose.yml
```

---

## ⚔️ 1v1 Battle System

```
:30 past hour  →  Enrollment opens (30 mins before)
:55 past hour  →  Auto-matchmaking runs
:58 past hour  →  Lobby: both players choose Easy/Medium/Hard
:00 next hour  →  Battle starts — exclusive problem revealed

First to solve → wins (+50 pts)
15-second tie window → draw if opponent also solves (+25 pts each)
Odd players → matched with ArenaBot (Groq-powered chat responses)
After battle → problem released to public problems pool
Replacement → Groq auto-generates new battle-exclusive problem
```

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (email or Google OAuth) |
| POST | `/api/auth/login` | Login + JWT |
| GET | `/api/auth/google` | Google OAuth redirect |
| GET | `/api/problems` | List problems (filter/search) |
| POST | `/api/submissions` | Submit code → Bull queue |
| POST | `/api/submissions/run` | Run 2 sample cases (sync) |
| GET | `/api/submissions/last/:id` | Last submission for code restore |
| GET | `/api/leaderboard` | Redis sorted-set rankings |
| POST | `/api/hints` | Groq AI hint (max 3/problem) |
| GET | `/api/battles/schedule` | Next battle timing |
| POST | `/api/battles/enroll` | Enroll for next battle |
| GET | `/api/battles/active` | User's current battle |
| GET | `/api/skills/heatmap` | Per-topic solve stats |
| GET | `/api/stats/public` | Platform stats (users, problems, solved) |
| GET | `/api/stats/admin/users` | Admin: all users + activity |

---

## 🔒 Code Execution Security (Local)

```
docker run --rm
  --memory="256m"       # Memory limit
  --cpus="0.5"          # CPU cap
  --network=none        # No internet
  --read-only           # Immutable filesystem
  --tmpfs /tmp:size=10m # Minimal temp space
  --ulimit nproc=50:50  # Process limit
```

Production uses **Judge0 CE** (community instance, no API key required).

---

## 📊 WebSocket Events

| Event | Description |
|-------|-------------|
| `submission_update` | Real-time judge result per test case |
| `battle_start` | Battle begins — problem revealed |
| `battle_progress` | Opponent's test case count (not their code) |
| `battle_tie_window` | 15s countdown after first solve |
| `battle_end` | Winner declared |
| `enrollment_update` | Live enrolled player count |
| `badge_earned` | Real-time badge notification |
| `new_message` | Battle chat (with bot replies) |

---

## 📄 License

MIT © [Gautam Mehendale](https://github.com/gautammehendale)
