import app from "./app.js";
import { env } from "./env.js";

app.listen(env.PORT, () => {
  console.log(`[DVSK API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
