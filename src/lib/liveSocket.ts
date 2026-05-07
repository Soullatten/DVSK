import { io, type Socket } from "socket.io-client";
import { auth } from "../firebase";
import { API_BASE_URL } from "../api/client";

// Strip the trailing "/api" from API_BASE_URL — the socket server is mounted
// at the root, not under /api.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socketRef: Socket | null = null;

/**
 * Connect to the backend's `/live` namespace.
 *
 * Reuses a single shared socket across the app — calling this multiple times
 * returns the same connection. Used by the order tracking page to receive
 * `order:status:updated` and `order:tracking:updated` events when admin
 * updates a customer's order in real-time.
 */
export async function connectLiveFeed(): Promise<Socket> {
  if (socketRef && socketRef.connected) return socketRef;

  let token = localStorage.getItem("dvsk_auth_token") || "";
  try {
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
  } catch {
    // Fall back to the cached token if Firebase refresh fails
  }

  const socket = io(`${SOCKET_URL}/live`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socketRef = socket;
  return socket;
}

export function disconnectLiveFeed() {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
}
