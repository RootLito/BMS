"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const newSocket = io("https://bms.r11.bfar.da.gov.ph", {
      path: "/socket.io",
      query: { userId: String(session.user.id) },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("get-online-users", (userIds) => {
      setOnlineUsers(userIds.map((id) => String(id)));
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);