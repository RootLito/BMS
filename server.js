const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
require("dotenv").config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handler = app.getRequestHandler();

const userSocketMap = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const getOnlineUserIds = () => Array.from(userSocketMap.keys());

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap.set(userId, socket.id);
      io.emit("get-online-users", getOnlineUserIds());
    }

    socket.on("send-message", async (data) => {
      // 1. Destructure 'files' from the incoming data
      const { senderId, receiverId, content, files } = data;

      try {
        const { default: dbConnect } = await import("./lib/mongodb.js");
        const { default: Message } = await import("./models/Message.js");
        await dbConnect();

        // 2. Create message in DB including the files array
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content: content,
          files: files || [], // Ensure it defaults to empty array if no files
        });

        // 3. Find receiver's socket
        const receiverSocketId = userSocketMap.get(receiverId);

        if (receiverSocketId) {
          // Emit the full DB object to receiver
          io.to(receiverSocketId).emit("receive-message", newMessage);
        }

        // 4. Emit to sender's other tabs/devices
        socket.emit("receive-message", newMessage);
      } catch (error) {
        console.error("Socket error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      for (const [uId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) {
          userSocketMap.delete(uId);
          break;
        }
      }
      io.emit("get-online-users", getOnlineUserIds());
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server listening on port ${port}`);
  });
});
