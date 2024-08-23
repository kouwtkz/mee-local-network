import React from "react";
import { CommonHono } from "#/types/HonoCustomType";
import { DefaultLayout, Style } from "#/layout/default";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { readdirSync } from "fs";
import { buildAddVer, stylesAddVer } from "#/server/env";
import { LoginRedirect, Unauthorized } from "#/server/LoginCheck";
import { MeeSqlite } from "#/sqlite/findMeeSqlite";
import { using } from "#/functions/using";
import { setWhere } from "#/functions/findMee";

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
  const dbPath = logueOptions.data_dir + "posts.db";
  async function createPostsTable({
    table,
    db,
  }: {
    table: string;
    db: MeeSqlite;
  }) {
    return db
      .createTable<MeeLoguePostTableType>({
        table,
        entry: {
          id: { primary: true, type: "INTEGER" },
          name: { type: "TEXT" },
          text: { type: "TEXT" },
          createdAt: { type: "TEXT" },
          updatedAt: { type: "TEXT" },
        },
      })
      .catch(() => {});
  }

  function GetPostsTable(name?: string) {
    return (name ? name + "_" : "") + "posts";
  }

  pathes.forEach((n) => {
    app.get("*", Unauthorized);
    app.get("get/posts" + n, async (c) => {
      const posts = await using(new MeeSqlite(dbPath), async (db) => {
        const table = GetPostsTable(c.req.param("name"));
        if (table) {
          return db.select<MeeLoguePostRawType>({ table }).catch(async () => {
            await createPostsTable({ table, db });
            return null;
          });
        } else return null;
      });
      if (posts) return c.json(posts);
      else return c.json(null, 400);
    });
    app.get("get/posts/filter" + n, async (c) => {
      const Url = new URL(c.req.url);
      const s = Url.searchParams;
      let {
        id,
        orderBy,
        take,
        skip,
        where: _where,
      } = setWhere<MeeLoguePostRawType>(Url.searchParams.get("q"));
      const wheres = [_where];
      if (orderBy.length === 0) orderBy.push({ id: "desc" });
      if (id === undefined && s.has("id")) id = Number(s.get("id"));
      if (id) wheres.push({ id });
      if (skip === undefined && s.has("p")) {
        if (!take) take = 100;
        skip = (Number(s.get("p") ?? 1) - 1) * take;
      }
      const posts = await using(new MeeSqlite(dbPath), async (db) => {
        const table = GetPostsTable(c.req.param("name"));
        if (table) {
          return db.select<MeeLoguePostRawType>({
            table,
            where: { AND: wheres },
            orderBy,
            take,
            skip,
          });
        } else return null;
      });
      if (!posts) return c.json(null, 400);
      return c.json(posts);
    });
    app.post("send/post" + n, async (c) => {
      const table = GetPostsTable(c.req.param("name"));
      const v = await c.req.parseBody();
      const currentDate = new Date();
      const text = ((v.text as string) ?? "").trim();
      const name = import.meta.env.VITE_USER_NAME;
      const now = currentDate.toISOString();
      if (text) {
        let entry: MeeLoguePostTableType = {
          name,
          text,
          updatedAt: now,
        };
        await using(new MeeSqlite(dbPath), async (db) => {
          if (v.edit === "") {
            await createPostsTable({ table, db });
            entry.createdAt = now;
            db.insert({ table, entry });
          } else {
            const id = Number(v.edit);
            db.update({ table, entry, where: { id } });
          }
        });
        return c.json(entry);
      } else {
        return c.text("本文が入力されていません", 401);
      }
    });
    app.delete("send/post" + n, async (c) => {
      const v = await c.req.parseBody();
      if ("id" in v) {
        const id = Number(v.id as string);
        const table = GetPostsTable(c.req.param("name"));
        return await using(new MeeSqlite(dbPath), async (db) => {
          await db.delete({ table, where: { id } });
          return c.json({ id });
        }).catch((e) => c.text(e, 400));
      } else {
        return c.text("IDが入力されていません", 401);
      }
    });
    app.post("send/import" + n, async (c) => {
      const table = GetPostsTable(c.req.param("name"));
      const formData = (await c.req.parseBody()) as any;
      const file: File | undefined = formData["posts"];
      const mode = formData["mode"] ?? "overwrite";
      if (file && file.type === "application/json") {
        const posts: MeeLoguePostRawType[] = JSON.parse(await file.text());
        posts.sort((a, b) => a.id - b.id);
        await using(new MeeSqlite(dbPath), async (db) => {
          db.begin();
          if (mode === "overwrite") await db.dropTable(table);
          await createPostsTable({ table, db });
          await Promise.all(
            posts.map((post) => {
              let entry: MeeLoguePostTableType = post;
              switch (mode) {
                case "insert":
                  delete entry.id;
                  break;
              }
              return db.insert({ table, entry });
            })
          );
          db.commit();
        });
      }
      return c.text("インポートしました");
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
