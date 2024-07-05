/// <reference types="vite/client" />

import { Hono } from "hono";
import { CompactCode } from "./functions/StrFunctions.mjs";
import importStyles from "./styles.scss?inline";
import { ServerCommon } from "./server";
import { MeeBindings } from "./types/MeeBindings";

const app = new Hono<MeeBindings>({ strict: false });
const compactStyles = CompactCode(importStyles as string);
app.get("/assets/styles.css", (c) => c.body(compactStyles));

ServerCommon(app);

export default app;
