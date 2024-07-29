import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { ServerCommon } from "./server";
const app = new Hono<MeeBindings>({ strict: false });

ServerCommon(app);

if (import.meta.env.PROD) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 80;
  console.log(`listening on port ${port}`);
  console.log(`Server started at http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
