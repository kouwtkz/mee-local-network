import React from "react";
import { CommonHono } from "../types/HonoCustomType";
import { DefaultLayout, Style } from "../layout";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { GetRawThreads } from "../functions/bbs";
import { buildAddVer, stylesAddVer } from "./env";

function bbs_layout(title = import.meta.env.VITE_BBS_TITLE) {
  return renderToString(
    <DefaultLayout
      title={title}
      className="pwa"
      script={
        <script
          type="module"
          src={
            import.meta.env.PROD
              ? "/assets/bbs.js" + buildAddVer
              : "/src/client/bbs.tsx"
          }
        />
      }
      meta={
        <link
          rel="manifest"
          href={"/manifest/bbs.json" + buildAddVer}
          crossOrigin="use-credentials"
        />
      }
      style={<Style href={"/assets/styles.css" + stylesAddVer} />}
    >
      <div id="root" />
    </DefaultLayout>
  );
}

export const bbsOptions = {
  title: import.meta.env.VITE_BBS_TITLE ?? import.meta.env.VITE_TITLE,
  data_dir: import.meta.env.PROD ? "../data/" : "./data/",
};

const threads_list = ["", "/:name"];

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
    let threads: ThreadsRawType[] | null = null;
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

  threads_list.forEach((n) => {
    app.get("get/threads" + n, (c) => {
      const threads = ReadThreads(c.req.param("name"));
      if (!threads) return c.json(null, 400);
      else return c.json(threads);
    });
    app.get("get/threads/filter" + n, (c) => {
      const Url = new URL(c.req.url);
      const search = Object.fromEntries(Url.searchParams);
      const threads = ReadThreads(c.req.param("name"));
      if (!threads) return c.json(null, 400);
      return c.json(
        GetRawThreads({
          threads,
          ...search,
        })
      );
    });
    app.post("send/post" + n, async (c) => {
      let rawThreads = ReadThreads(c.req.param("name")) ?? [];
      const v = await c.req.parseBody();
      const currentDate = new Date();
      const text = ((v.text as string) ?? "").replace(/^\s+|\s+$/g, "");
      if (text) {
        function newData() {
          return {
            id: rawThreads.reduce((c, a) => (c <= a.id ? a.id + 1 : c), 0),
            name: import.meta.env.VITE_USER_NAME,
            text,
            createdAt: currentDate.toISOString(),
            updatedAt: currentDate.toISOString(),
          };
        }
        let data: ThreadType;
        if (v.edit === "") {
          data = newData();
          rawThreads.push(data);
        } else {
          const id = Number(v.edit);
          const foundIndex = rawThreads.findIndex((item) => item.id === id);
          if (foundIndex >= 0) {
            const found = rawThreads[foundIndex];
            data = {
              ...found,
              text,
              updatedAt: currentDate.toISOString(),
            };
            rawThreads[foundIndex] = data;
          } else {
            data = newData();
            rawThreads.push(data);
          }
        }
        WriteThreads(rawThreads);
        return c.json(data);
      } else {
        return c.text("本文が入力されていません", 401);
      }
    });
    app.delete("send/post" + n, async (c) => {
      let rawThreads = ReadThreads(c.req.param("name"));
      if (!rawThreads) return c.text("スレッドがありません", 400);
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
threads_list.forEach((n) => {
  app.get(n, async (c, next) => {
    if (/^[^\/]+\.[^\/]+$/.test(c.req.param("name") ?? "")) next();
    else return c.html(bbs_layout());
  });
});

export const app_bbs = app;
