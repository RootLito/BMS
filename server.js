const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
require('dotenv').config({ path: '.env.local' });

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handler = app.getRequestHandler();

// Map to track active users: { "userId": "socketId" }
const userSocketMap = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  // Initialize Socket.io with CORS
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allows connections from any origin for testing
      methods: ["GET", "POST"]
    }
  });

  // Function to get all unique online User IDs
  const getOnlineUserIds = () => Array.from(userSocketMap.keys());

  io.on("connection", (socket) => {
    // Get the userId sent from the frontend query
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== "undefined") {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket: ${socket.id}`);
      
      // BROADCAST: Tell everyone who is online right now
      io.emit("get-online-users", getOnlineUserIds());
    }

    // Handle Message Logic
    socket.on("send-message", async (data) => {
      const { senderId, receiverId, content } = data;
      try {
        const { default: dbConnect } = await import("./lib/mongodb.js");
        const { default: Message } = await import("./models/Message.js");
        await dbConnect();

        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content: content,
        });

        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", newMessage);
        }
        socket.emit("message-sent", newMessage);
      } catch (error) {
        console.error("Socket error saving message:", error);
      }
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      for (const [uId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) {
          userSocketMap.delete(uId);
          console.log(`User disconnected: ${uId}`);
          break;
        }
      }
      // BROADCAST: Update everyone's list now that someone left
      io.emit("get-online-users", getOnlineUserIds());
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server listening on port ${port}`);
  });
});