require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const contestRoutes = require('./routes/contests');
const hintRoutes = require('./routes/hints');
const battleRoutes = require('./routes/battles');
const skillRoutes = require('./routes/skills');
const badgeRoutes = require('./routes/badges');
const chatRoutes = require('./routes/chat');
const { initDB } = require('./models/db');
const { runMigrations } = require('./models/migrations');
const { initRedis } = require('./services/redis');
const { initQueue } = require('./services/queue');
const { setupSocketHandlers } = require('./services/socket');
const { setupBattleScheduler } = require('./services/battleScheduler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/hints', hintRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await initDB();
  await runMigrations();
  await initRedis();
  await initQueue(io);
  setupSocketHandlers(io);
  setupBattleScheduler(io);
  server.listen(PORT, () => logger.info(`CodeArena server running on port ${PORT}`));
}

start().catch(err => { logger.error('Failed to start server:', err); process.exit(1); });
