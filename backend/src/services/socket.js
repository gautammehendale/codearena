const logger = require('../utils/logger');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_submission', (submissionId) => {
      socket.join(`submission:${submissionId}`);
    });

    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on('join_contest', (contestId) => {
      socket.join(`contest:${contestId}`);
      logger.info(`User joined contest room: ${contestId}`);
    });

    socket.on('leave_contest', (contestId) => {
      socket.leave(`contest:${contestId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocketHandlers };
