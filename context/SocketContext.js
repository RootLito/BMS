"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Only connect if the user is authenticated and has an ID
    if (status === "authenticated" && session?.user?.id) {
      const newSocket = io("http://localhost:3000", {
        query: { userId: session.user.id },
      });

      setSocket(newSocket);

      newSocket.on("get-online-users", (users) => {
        setOnlineUsers(users);
      });

      // Cleanup on logout or unmount
      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [session, status]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);