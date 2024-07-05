import { Hono } from "hono";
import { CompactCode } from "./functions/StrFunctions";
import importStyles from "./styles.scss?inline";
import { ServerCommon } from "./server";

const app = new Hono<MeeBindings>({ strict: false });
const compactStyles = CompactCode(importStyles as string);
app.get("/assets/styles.css", (c) => c.body(compactStyles));

ServerCommon(app);

export default app;
