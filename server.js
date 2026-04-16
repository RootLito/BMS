const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const path = require("path");


require("dotenv").config({ path: path.join(__dirname, ".env") });


const dev = false; 
const port = process.env.PORT || 3000;
const app = next({ dev });
const handler = app.getRequestHandler();

const userSocketMap = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: { 
      origin: "http://bms.r11.bfar.da.gov.ph",
      methods: ["GET", "POST"]
    },
    path: "/socket.io", 
  });

  const getOnlineUserIds = () => Array.from(userSocketMap.keys());

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap.set(userId, socket.id);
      io.emit("get-online-users", getOnlineUserIds());
      console.log(`User connected: ${userId}`);
    }

    socket.on("send-message", async (data) => {
      const { senderId, receiverId, content, files } = data;

      try {
        const { default: dbConnect } = await import("./lib/mongodb.js");
        const { default: Message } = await import("./models/Message.js");
        await dbConnect();

        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content: content,
          files: files || [],
        });

        const receiverSocketId = userSocketMap.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", newMessage);
        }

        socket.emit("receive-message", newMessage);
      } catch (error) {
        console.error("Socket error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      for (const [uId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) {
          userSocketMap.delete(uId);
          console.log(`User disconnected: ${uId}`);
          break;
        }
      }
      io.emit("get-online-users", getOnlineUserIds());
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Mode: ${dev ? "Development" : "Production"}`);
    console.log(`> Server listening on port ${port}`);
    console.log(`> NextAuth URL: ${process.env.NEXTAUTH_URL}`);
  });
});