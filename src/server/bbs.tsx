import React from "react";
import { CommonHono } from "../types/HonoCustomType";
import { DefaultLayout, Style } from "../layout";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { existsSync, readdirSync, readFileSync } from "fs";
import { GetRawThreads } from "../functions/bbs";

function bbs_layout(title = import.meta.env.VITE_TITLE) {
  return renderToString(
    <DefaultLayout
      title={title}
      script={
        <script
          type="module"
          src={import.meta.env.PROD ? "/assets/bbs.js" : "/src/client/bbs.tsx"}
        />
      }
      style={<Style href="/assets/styles.css" />}
    >
      <div id="root" />
    </DefaultLayout>
  );
}

export const bbsOptions = {
  title: "簡易BBS",
  data_dir: import.meta.env.PROD ? "../data/" : "./data/",
};

const app_api = new Hono<MeeBindings>();
{
  const app = app_api;
  app.get("get/files", (c) => {
    try {
      return c.json(readdirSync(bbsOptions.data_dir));
    } catch {
      return c.json([]);
    }
  });
  function ReadThreads(name?: string) {
    let threads: ThreadsRawType[] = [];
    try {
      threads = JSON.parse(
        readFileSync(bbsOptions.data_dir + name ?? "").toString()
      );
    } catch {}
    return threads;
  }

  app.get("get/threads/:name", (c) => {
    return c.json(ReadThreads(c.req.param("name")));
  });
  app.get("get/threads/filter/:name", (c) => {
    const Url = new URL(c.req.url);
    const search = Object.fromEntries(Url.searchParams);
    return c.json(
      GetRawThreads({
        threads: ReadThreads(c.req.param("name")),
        ...search,
      })
    );
  });
  app.get("*", (c) => {
    return c.notFound();
  });
}

const app = new Hono<MeeBindings>();
app.route("api", app_api);
app.get("*", (c) => {
  return c.html(bbs_layout());
});

export const app_bbs = app;
