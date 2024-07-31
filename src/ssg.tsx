import { Hono } from "hono";
import React from "react";
import { renderToString } from "react-dom/server";

const app = new Hono<MeeBindings>({ strict: true });

app.get("/manifest/MeeLogue.json", async (c) => {
  return c.json({
    name: import.meta.env.DEV
      ? "開発中"
      : import.meta.env.VITE_BBS_TITLE ?? import.meta.env.VITE_TITLE,
    display: "standalone",
    scope: "/logue/",
    start_url: "/logue/",
    icons: [
      {
        src: "/images/top/SiteTop1812-150x150.png",
        sizes: "150x150",
        type: "image/png",
      },
    ],
    share_target: {
      action: "/logue/",
      params: {
        title: "name",
        text: "description",
        url: "link",
      },
    },
  } as webManifestType);
});

const ssgApp = app;
export default ssgApp;
