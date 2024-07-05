import React from "react";
import { CommonHono } from "../types/HonoCustomType";
import { DefaultLayout, Style } from "../layout";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { existsSync, readdirSync, readFileSync } from "fs";

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
  function GetThreads({
    name,
    id,
    q,
    limit = 100,
    page = 1,
    order = "asc",
  }: {
    name: string;
    id?: number;
    q?: string;
    limit?: number;
    page?: number;
    order?: string;
  }) {
    let threads: ThreadsRawType[] = [];
    try {
      threads = JSON.parse(readFileSync(bbsOptions.data_dir + name).toString());
    } catch {}
    if (typeof id === "number") {
      const thread = threads.find((item) => item.id === id);
      threads = thread ? [thread] : [];
    }
    if (q) {
      threads = threads.filter((item) => item.text?.match(q));
    }
    if (order === "desc") {
      threads.reverse();
    }
    const length = threads.length;
    if (typeof page === "number" && typeof limit === "number") {
      threads = threads.slice((page - 1) * limit, page * limit);
    }
    return { threads, length, limit } as ThreadsResponseType;
  }
  app.get("get/threads/:name", (c) => {
    const Url = new URL(c.req.url);
    const id_str = Url.searchParams.get("id");
    const limit_str = Url.searchParams.get("limit");
    const page_str = Url.searchParams.get("p");
    return c.json(
      GetThreads({
        name: c.req.param("name"),
        id: id_str ? parseInt(id_str, 10) : undefined,
        q: Url.searchParams.get("q") ?? undefined,
        limit: limit_str ? parseInt(limit_str, 10) : undefined,
        page: page_str ? parseInt(page_str, 10) : undefined,
        order: Url.searchParams.get("order") ?? undefined,
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
