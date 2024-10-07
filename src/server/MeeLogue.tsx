import React from "react";
import { CommonHono } from "#/types/HonoCustomType";
import { DefaultLayout, Style } from "#/layout/default";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { readdirSync } from "fs";
import { buildAddVer, stylesAddVer } from "#/server/env";
import { LoginRedirect, Unauthorized } from "#/server/LoginCheck";
import { MeeSqlite } from "#/database/MeeSqlite";
import { using } from "#/functions/using";
import { setWhere } from "#/functions/find/findMee";
import { GetPostsTable, MeeLoguePostsToRaw } from "#/functions/MeeLogue";
import { Loading } from "#/layout/Loading";

function logueLayout(title = import.meta.env.VITE_LOGUE_TITLE) {
  return renderToString(
    <DefaultLayout
      title={title}
      htmlClassName="loading"
      className="pwa dummy"
      script={
        <script
          type="module"
          src={
            import.meta.env.PROD
              ? "/assets/MeeLogue.js"
              : "/src/client/MeeLogue.tsx"
          }
        />
      }
      meta={
        <>
          <script type="module" src="/logue/setSw.js" />
          <link
            rel="manifest"
            href="/manifest/MeeLogue.json"
            crossOrigin="use-credentials"
          />
        </>
      }
      style={<Style href="/assets/styles.css" />}
    >
      <Loading />
      <div id="root" />
    </DefaultLayout>
  );
}

const createEntry: MeeSqlCreateTableEntryType<MeeLoguePostTableType> = {
  id: { primary: true, type: "INTEGER" },
  name: { type: "TEXT" },
  text: { type: "TEXT" },
  createdAt: { createAt: true, unique: true },
  updatedAt: { createAt: true, unique: true },
};
async function CreateTable(db: MeeSqlite, table: string) {
  await db
    .createTable({
      table,
      entry: createEntry,
    })
    .catch(() => {});
}
interface SelectProps extends MeeSqlSelectProps<MeeLoguePostRawType> {
  db: MeeSqlite;
}
async function Select({ db, ...args }: SelectProps) {
  function _s() {
    return db.select(args);
  }
  return _s().catch(() => CreateTable(db, args.table).then(() => _s()));
}

export async function ServerPostsGetData(
  searchParams: URLSearchParams,
  db: MeeSqlite,
  table: string
) {
  const wheres: MeeSqlFindWhereType<MeeLoguePostRawType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ updatedAt: { gt: lastmod } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  return Select({ db, table, where: { AND: wheres } });
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
  pathes.forEach((n) => {
    app.get("*", Unauthorized);
    app.get("get/posts" + n, async (c) => {
      return using(new MeeSqlite(dbPath), async (db) =>
        c.json(
          await ServerPostsGetData(
            new URL(c.req.url).searchParams,
            db,
            GetPostsTable(c.req.param("name"))
          )
        )
      );
    });
    app.get("get/posts/filter" + n, async (c) => {
      const Url = new URL(c.req.url);
      const s = Url.searchParams;
      let skip: number | undefined;
      let {
        id,
        orderBy,
        take,
        where: _where,
      } = setWhere<MeeLoguePostRawType>(Url.searchParams.get("q") || "");
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
      const text = ((v.text as string) ?? "").trim();
      const name = import.meta.env.VITE_USER_NAME;
      if (text) {
        const entry: MeeLoguePostTableType = {
          name,
          text,
          updatedAt: new Date().toISOString(),
        };
        await using(new MeeSqlite(dbPath), async (db) => {
          if (v.edit === "") {
            await CreateTable(db, table);
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
          const nullEntry = MeeSqlite.fillNullEntry(createEntry);
          try {
            await db.update<MeeLoguePostRawType>({
              table,
              entry: { ...nullEntry, updatedAt: new Date().toISOString() },
              where: { id },
            });
            return c.text(String(id));
          } catch (e) {
            console.error(e);
            return c.text("データベースでの削除に失敗しました", {
              status: 500,
            });
          }
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
          if (mode === "overwrite") await db.dropTable({ table });
          await CreateTable(db, table);
          await Promise.all(
            MeeLoguePostsToRaw(posts).map((post) => {
              const entry: MeeLoguePostTableType = post;
              if (mode !== "overwrite") delete entry.id;
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
