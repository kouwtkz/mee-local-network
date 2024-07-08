import { Hono } from "hono";
import React from "react";
import { renderToString } from "react-dom/server";

const app = new Hono<MeeBindings>({ strict: true });

app.get("/manifest/bbs.json", async (c) => {
  return c.json({
    name: "めぇのBBS",
    display: "standalone",
    scope: "/bbs/",
    start_url: "/bbs/",
    icons: [
      {
        src: "/images/top/SiteTop1812-150x150.png",
        sizes: "150x150",
        type: "image/png",
      },
    ],
  } as webManifestType);
});

const ssgApp = app;
export default ssgApp;
