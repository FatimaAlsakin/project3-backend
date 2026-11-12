const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function groupFor(userId) {
  const user = await User.findById(userId).select("teamId");
  return user?.teamId
    ? { group: `team:${user.teamId}`, teamId: user.teamId }
    : { group: `user:${userId}`, teamId: null };
}

function roomFor(group, caseId) {
  return `${group}:case:${caseId}`;
}

async function noteRoomFor(userId, caseId) {
  const { group } = await groupFor(userId);
  return roomFor(group, caseId);
}

function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinCase", async ({ caseId } = {}) => {
      if (!caseId || !mongoose.isValidObjectId(caseId)) return;
      try {
        socket.join(`case:${caseId}`);
        socket.join(await noteRoomFor(socket.user._id, caseId));
        socket.to(`case:${caseId}`).emit("userJoined", { socketId: socket.id });
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("leaveCase", async ({ caseId } = {}) => {
      if (!caseId || !mongoose.isValidObjectId(caseId)) return;
      try {
        socket.leave(`case:${caseId}`);
        socket.leave(await noteRoomFor(socket.user._id, caseId));
        socket.to(`case:${caseId}`).emit("userLeft", { socketId: socket.id });
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });
}

module.exports = registerSocketHandlers;
module.exports.groupFor = groupFor;
module.exports.roomFor = roomFor;
module.exports.noteRoomFor = noteRoomFor;
