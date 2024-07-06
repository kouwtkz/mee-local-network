import React from "react";
import { CommonHono } from "../types/HonoCustomType";
import { DefaultLayout, Style } from "../layout";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
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

const app_api = new Hono<MeeBindings>({ strict: false });
{
  const app = app_api;
  app.get("get/files", (c) => {
    try {
      return c.json(readdirSync(bbsOptions.data_dir));
    } catch {
      return c.json([]);
    }
  });

  function GetThreadsFilename(name?: string) {
    return (name ? name + "_" : "") + "threads.json";
  }

  function ReadThreads(name?: string) {
    const filename = GetThreadsFilename(name);
    let threads: ThreadsRawType[] = [];
    try {
      threads = JSON.parse(
        readFileSync(bbsOptions.data_dir + filename).toString()
      );
    } catch {}
    return threads;
  }

  function WriteThreads(threads: ThreadsRawType[], name?: string) {
    const filename = GetThreadsFilename(name);
    try {
      writeFileSync(bbsOptions.data_dir + filename, JSON.stringify(threads));
      return true;
    } catch {
      return false;
    }
  }

  ["", "/:name"].forEach((n) => {
    app.get("get/threads" + n, (c) => {
      return c.json(ReadThreads(c.req.param("name")));
    });
    app.get("get/threads/filter" + n, (c) => {
      const Url = new URL(c.req.url);
      const search = Object.fromEntries(Url.searchParams);
      return c.json(
        GetRawThreads({
          threads: ReadThreads(c.req.param("name")),
          ...search,
        })
      );
    });
    app.post("send/post" + n, async (c) => {
      let rawThreads = ReadThreads(c.req.param("name"));
      const v = await c.req.parseBody();
      const currentDate = new Date();
      const data: ThreadType = {
        id: rawThreads.reduce((c, a) => (c <= a.id ? a.id + 1 : c), 0),
        name: import.meta.env.VITE_USER_NAME,
        text: v.text as string,
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString(),
      };
      if (v.text) {
        rawThreads.push(data);
        WriteThreads(rawThreads);
        return c.json(data);
      } else {
        return c.text("本文が入力されていません", 401);
      }
    });
    app.delete("send/post" + n, async (c) => {
      let rawThreads = ReadThreads(c.req.param("name"));
      const v = await c.req.parseBody();
      if ("id" in v) {
        const id = Number(v.id as string);
        rawThreads = rawThreads.filter((item) => item.id !== id);
        WriteThreads(rawThreads);
        return c.json({ id });
      } else {
        return c.text("IDが入力されていません", 401);
      }
    });
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
