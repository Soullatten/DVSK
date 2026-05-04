import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export function useStorefrontTracker() {
  const location = useLocation();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/track`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    socketRef.current?.emit("page:view", { path: location.pathname });
  }, [location.pathname]);
}

export function emitCartAdd(productId: string, productName?: string) {
  // Best-effort fire-and-forget; uses a singleton socket via the existing window scope.
  // Components can call this directly when they add to cart.
  const url = `${SOCKET_URL}/track`;
  const w = window as unknown as { __dvskTrackerSocket?: Socket };
  if (!w.__dvskTrackerSocket || !w.__dvskTrackerSocket.connected) {
    w.__dvskTrackerSocket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
  }
  w.__dvskTrackerSocket.emit("cart:add", { productId, productName });
}
