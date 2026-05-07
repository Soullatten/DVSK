import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { firebaseAuth } from "../config/firebase.js";
import { prisma } from "../config/database.js";
import { env } from "../env.js";

let io: SocketServer | null = null;

interface VisitorSession {
  id: string;
  ip: string;
  userAgent: string;
  path: string;
  joinedAt: number;
}

const visitors = new Map<string, VisitorSession>();

function snapshotVisitors() {
  return Array.from(visitors.values());
}

function broadcastViewers() {
  if (!io) return;
  const count = visitors.size;
  io.of("/live").emit("viewers:count", { count, ts: Date.now() });
}

// Mirror the HTTP CORS rule: in dev, also accept localhost / 127.0.0.1 /
// private-LAN origins so phones on the same wifi can connect.
const isAllowedSocketOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (origin === "null" || origin.startsWith("file://")) return true;
  if (env.ALLOWED_ORIGINS.includes(origin)) return true;
  if (env.NODE_ENV === "production") return false;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (/^10\./.test(u.hostname)) return true;
    if (/^192\.168\./.test(u.hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(u.hostname)) return true;
    return false;
  } catch {
    return false;
  }
};

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) =>
        isAllowedSocketOrigin(origin) ? cb(null, true) : cb(new Error("Forbidden origin")),
      credentials: true,
    },
  });

  const trackNs = io.of("/track");

  trackNs.use((socket, next) => {
    const origin = socket.handshake.headers.origin;
    if (!isAllowedSocketOrigin(origin)) {
      return next(new Error("Forbidden origin"));
    }
    next();
  });

  trackNs.on("connection", (socket) => {
    const ip =
      (socket.handshake.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ||
      socket.handshake.address ||
      "unknown";
    const userAgent = (socket.handshake.headers["user-agent"] as string | undefined) || "unknown";

    const session: VisitorSession = {
      id: socket.id,
      ip,
      userAgent,
      path: "/",
      joinedAt: Date.now(),
    };
    visitors.set(socket.id, session);

    emitLiveEvent("visitor:join", session);
    broadcastViewers();

    socket.on("page:view", (data: { path?: string }) => {
      const existing = visitors.get(socket.id);
      const path = data?.path ?? "/";
      if (existing) {
        existing.path = path;
        visitors.set(socket.id, existing);
      }
      emitLiveEvent("page:view", {
        id: socket.id,
        ip,
        path,
        ts: Date.now(),
      });
    });

    socket.on("cart:add", (data: { productId?: string; productName?: string }) => {
      emitLiveEvent("cart:add", {
        id: socket.id,
        ip,
        productId: data?.productId,
        productName: data?.productName,
        ts: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      visitors.delete(socket.id);
      emitLiveEvent("visitor:leave", { id: socket.id, ip, ts: Date.now() });
      broadcastViewers();
    });
  });

  const liveNs = io.of("/live");

  liveNs.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization as string | undefined)?.split("Bearer ")[1];

      if (!token) return next(new Error("Unauthorized: no token"));

      const decoded = await firebaseAuth.verifyIdToken(token);
      const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

      if (!user) return next(new Error("Unauthorized: unknown user"));
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return next(new Error("Forbidden: admin role required"));
      }

      (socket.data as { user?: typeof user }).user = user;
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  liveNs.on("connection", (socket) => {
    socket.emit("hello", { message: "Live feed connected", ts: Date.now() });
    socket.emit("viewers:count", { count: visitors.size, ts: Date.now() });
    socket.emit("visitors:snapshot", snapshotVisitors());
  });

  return io;
}

export function emitLiveEvent(event: string, payload: unknown) {
  if (!io) return;
  io.of("/live").emit(event, payload);
}

export function getIO() {
  return io;
}
