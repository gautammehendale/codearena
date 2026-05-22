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

    const BOT_REPLIES = [
      "Good luck! 🤖", "May the best coder win!", "I've been training for this...",
      "Interesting approach 👀", "Clock is ticking ⏱️", "I'm already halfway done 😈",
      "You got this! (or maybe not 😄)", "Analyzing your code patterns...",
      "Nice try human", "I learned from 10 million LeetCode solutions 🧠",
    ];

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

        // Bot auto-reply if this is a bot battle room
        if (roomId.startsWith('battle-')) {
          const battleId = roomId.replace('battle-', '');
          const battle = await pool.query('SELECT is_bot FROM battles WHERE id=$1', [battleId]).catch(() => ({ rows: [] }));
          if (battle.rows[0]?.is_bot) {
            setTimeout(async () => {
              const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
              const botMsg = await pool.query(
                `INSERT INTO contest_chat (room_id, username, message, is_system) VALUES ($1,$2,$3,true) RETURNING *`,
                [roomId, '🤖 ArenaBot', reply]
              );
              io.to(`chat:${roomId}`).emit('new_message', botMsg.rows[0]);
            }, 800 + Math.random() * 2000);
          }
        }
      } catch (err) { logger.error('Chat error:', err); }
    });

    socket.on('join_chat', (roomId) => socket.join(`chat:${roomId}`));
    socket.on('leave_chat', (roomId) => socket.leave(`chat:${roomId}`));

    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });
}

module.exports = { setupSocketHandlers };
