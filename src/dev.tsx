import { Hono } from "hono";
import { CompactCode } from "./functions/StrFunctions";
import importStyles from "./styles.scss?inline";
import { ServerCommon } from "./server";
import ssgApp from "./ssg";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono<MeeBindings>({ strict: false });
const compactStyles = CompactCode(importStyles as string);
app.get("/assets/styles.css", (c) => c.body(compactStyles));
app.route("/", ssgApp);
app.get("*", serveStatic({ root: "/import/result" }));

ServerCommon(app);

export default app;
