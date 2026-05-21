const { pool } = require('../models/db');
const logger = require('../utils/logger');

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy'];
const censor = (t) => BAD_WORDS.reduce((s, w) => s.replace(new RegExp(w, 'gi'), '*'.repeat(w.length)), t);

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_submission', (id) => socket.join(`submission:${id}`));
    socket.on('join_user', (id) => socket.join(`user:${id}`));
    socket.on('join_contest', (id) => socket.join(`contest:${id}`));
    socket.on('leave_contest', (id) => socket.leave(`contest:${id}`));
    socket.on('join_battle', (id) => socket.join(`battle:${id}`));
    socket.on('leave_battle', (id) => socket.leave(`battle:${id}`));
    socket.on('join_battles', () => socket.join('battles'));

    // Real-time chat
    socket.on('chat_message', async ({ roomId, message, userId, username }) => {
      if (!message?.trim() || !roomId || message.length > 300) return;
      const censored = censor(message.trim());
      try {
        const result = await pool.query(
          `INSERT INTO contest_chat (room_id, user_id, username, message) VALUES ($1,$2,$3,$4) RETURNING *`,
          [roomId, userId, username, censored]
        );
        io.to(`chat:${roomId}`).emit('new_message', result.rows[0]);
      } catch (err) { logger.error('Chat error:', err); }
    });

    socket.on('join_chat', (roomId) => socket.join(`chat:${roomId}`));
    socket.on('leave_chat', (roomId) => socket.leave(`chat:${roomId}`));

    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });
}

module.exports = { setupSocketHandlers };
