// lib/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket'],
});

// DEBUG: Log when the client actually connects or disconnects
socket.on("connect", () => {
  console.log("✅ [lib/socket] Client connected to", SOCKET_URL, " with socket.id =", socket.id);
});
socket.on("disconnect", (reason) => {
  console.log("❌ [lib/socket] Client disconnected. Reason:", reason);
});

export default socket;
