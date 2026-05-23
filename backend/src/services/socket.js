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

    // Varied bot replies — context-aware based on what was said
    const getBotReply = async (userMessage) => {
      if (process.env.GROQ_API_KEY) {
        try {
          const Groq = require('groq-sdk');
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
          const res = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are ArenaBot, a competitive 1v1 coding battle AI. You are snarky, excited, and competitive. Reply in ONE short sentence max (under 15 words). React to what the human said. Be varied — never give the same reply twice. Examples: trash talk, encouragement, snarky comments about coding, battle references.' },
              { role: 'user', content: `Human said in the coding battle chat: "${userMessage}". Reply as ArenaBot.` }
            ],
            max_tokens: 40,
            temperature: 1.0,
          });
          return res.choices[0].message.content.replace(/^"|"$/g, '').trim();
        } catch {}
      }
      // Fallback pool — varied, never the same twice
      const fallbacks = [
        "My algorithms are already 3 steps ahead 😈", "Talk less, code more 💪",
        "Bold words for someone who hasn't submitted yet 👀", "I was trained on Stack Overflow, good luck beating that!",
        "This battle is MINE 🏆", "Ohhhh you think you're fast? Let's see 👁️",
        "My complexity is O(you_lose) 😂", "Clock's ticking human... tick tick tick ⏱️",
        "Challenge accepted! May the best algorithm win ⚔️", "I eat dynamic programming for breakfast 🧠",
        "Is that your final approach? 👀", "Interesting... but my approach is more elegant 😏",
        "You got this! (but also I'm winning 🤖)", "The heap is strong with this problem...",
        "First to submit wins. Clock's at zero in my head already! 🔥",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    };

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
              const reply = await getBotReply(message);
              const botMsg = await pool.query(
                `INSERT INTO contest_chat (room_id, username, message, is_system) VALUES ($1,$2,$3,true) RETURNING *`,
                [roomId, '🤖 ArenaBot', reply]
              );
              io.to(`chat:${roomId}`).emit('new_message', botMsg.rows[0]);
            }, 600 + Math.random() * 1500);
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
