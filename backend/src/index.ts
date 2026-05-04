import http from "http";
import app from "./app.js";
import { env } from "./env.js";
import { initSocket } from "./realtime/socket.js";

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[DVSK API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`[DVSK API] Realtime namespaces ready: /track (storefront) + /live (admin)`);
});
