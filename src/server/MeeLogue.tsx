import React from "react";
import { CommonHono } from "@/types/HonoCustomType";
import { DefaultLayout, Style } from "@/layout/default";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { GetRawThreads } from "@/functions/MeeLogue";
import { buildAddVer, stylesAddVer } from "@/server/env";
import { LoginRedirect, Unauthorized } from "@/server/LoginCheck";

function logueLayout(title = import.meta.env.VITE_LOGUE_TITLE) {
  return renderToString(
    <DefaultLayout
      title={title}
      className="pwa"
      script={
        <script
          type="module"
          src={
            import.meta.env.PROD
              ? "/assets/MeeLogue.js" + buildAddVer
              : "/src/client/MeeLogue.tsx"
          }
        />
      }
      meta={
        <link
          rel="manifest"
          href={"/manifest/MeeLogue.json" + buildAddVer}
          crossOrigin="use-credentials"
        />
      }
      style={<Style href={"/assets/styles.css" + stylesAddVer} />}
    >
      <div id="root" />
    </DefaultLayout>
  );
}

export const logueOptions = {
  title: import.meta.env.VITE_LOGUE_TITLE ?? import.meta.env.VITE_TITLE,
  data_dir: import.meta.env.PROD ? "../data/" : "./data/",
};

const pathes = ["", "/:name"];

const app_api = new Hono<MeeBindings>({ strict: false });
{
  const app = app_api;
  app.get("get/files", (c) => {
    try {
      return c.json(readdirSync(logueOptions.data_dir));
    } catch {
      return c.json([]);
    }
  });

  function GetPostsFilename(name?: string) {
    return (name ? name + "_" : "") + "posts.json";
  }

  function ReadPosts(name?: string) {
    const filename = GetPostsFilename(name);
    let posts: MeeLoguePostRawType[] | null = null;
    try {
      posts = JSON.parse(
        readFileSync(logueOptions.data_dir + filename).toString()
      );
    } catch {}
    return posts;
  }

  function WritePosts(posts: MeeLoguePostRawType[], name?: string) {
    const filename = GetPostsFilename(name);
    try {
      writeFileSync(logueOptions.data_dir + filename, JSON.stringify(posts));
      return true;
    } catch {
      return false;
    }
  }

  pathes.forEach((n) => {
    app.get("*", Unauthorized);
    app.get("get/posts" + n, (c) => {
      const posts = ReadPosts(c.req.param("name"));
      if (!posts) return c.json(null, 400);
      else return c.json(posts);
    });
    app.get("get/posts/filter" + n, (c) => {
      const Url = new URL(c.req.url);
      const search = Object.fromEntries(Url.searchParams);
      const posts = ReadPosts(c.req.param("name"));
      if (!posts) return c.json(null, 400);
      return c.json(
        GetRawThreads({
          posts,
          ...search,
        })
      );
    });
    app.post("send/post" + n, async (c) => {
      let rawThreads = ReadPosts(c.req.param("name")) ?? [];
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
        let data: MeeLoguePostType;
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
        WritePosts(rawThreads);
        return c.json(data);
      } else {
        return c.text("本文が入力されていません", 401);
      }
    });
    app.delete("send/post" + n, async (c) => {
      let rawThreads = ReadPosts(c.req.param("name"));
      if (!rawThreads) return c.text("スレッドがありません", 400);
      const v = await c.req.parseBody();
      if ("id" in v) {
        const id = Number(v.id as string);
        rawThreads = rawThreads.filter((item) => item.id !== id);
        WritePosts(rawThreads);
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
app.get("*", LoginRedirect);
app.route("api", app_api);
pathes.forEach((n) => {
  app.get(n, async (c, next) => {
    if (/^[^\/]+\.[^\/]+$/.test(c.req.param("name") ?? "")) next();
    else return c.html(logueLayout());
  });
});

export const app_logue = app;
