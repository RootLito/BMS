import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/context/SocketContext"; 
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "BFAR Messaging System",
  description:
    "Internal communication for the Bureau of Fisheries and Aquatic Resources",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="h-full w-full bg-gray-100 text-gray-900">
        <SessionProvider>
          <SocketProvider>{children}</SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
