import React, { Children } from "react";
import { DefaultLayout, Style } from "./layout";
import { CommonContext, CommonHono } from "./types/HonoCustomType";
import { serveStatic } from "@hono/node-server/serve-static";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { renderToString } from "react-dom/server";
import { LogPage } from "./server/LogPage";
import { TopPage } from "./server/Home";
import {
  uploaderOptions,
  UploaderPage,
  UploaderViewerPage,
} from "./server/UploaderPage";
import { LoginPage, SettingPage } from "./server/SettingPage";

const title = import.meta.env.VITE_TITLE;

function RenderMainLayout({
  children,
  script,
}: {
  children?: React.ReactNode;
  script?: string | string[];
}) {
  const scripts = script
    ? (Array.isArray(script) ? script : [script]).map((src, i) => (
        <script key={i} src={src} />
      ))
    : undefined;
  return renderToString(
    <DefaultLayout title={title} script={scripts}>
      {children}
    </DefaultLayout>
  );
}

export function ServerCommon(app: CommonHono) {
  const publicPath = import.meta.env.PROD ? "./" : "public";
  const staticPath = import.meta.env.PROD ? "../static" : "static";

  const cookieKey = "localToken";
  const cookieValue = import.meta.env.VITE_COOKIE_VALUE;
  const password = import.meta.env.VITE_LOGIN_PASSWORD;
  function getIsLogin(c: CommonContext) {
    return getCookie(c, cookieKey) === cookieValue;
  }
  app.get("/", (c) => {
    return c.html(
      RenderMainLayout({
        children: <TopPage title={title} />,
      })
    );
  });
  app.get("login", (c) => {
    return c.html(RenderMainLayout({ children: <LoginPage /> }));
  });
  app.post("login", async (c) => {
    const body = await c.req.parseBody();
    if (cookieValue && body.password === password) {
      setCookie(c, cookieKey, cookieValue);
    }
    return c.redirect("/");
  });
  app.get("logout", async (c) => {
    deleteCookie(c, cookieKey);
    return c.redirect("/setting");
  });
  app.post("uploader", async (c) => {
    const body = await c.req.parseBody();
    const file = body.uploadedfile;
    try {
      if (typeof file === "object") {
        const filename = file.name.replace(/\s+/, "_");
        const filePath = uploaderOptions.upload_dir + filename;
        await file.arrayBuffer().then((abuf) => {
          try {
            mkdirSync(uploaderOptions.upload_dir, { recursive: true });
          } catch {}
          writeFileSync(filePath, Buffer.from(abuf));
          chmodSync(filePath, "0777");
        });
        console.log(file);
      }
    } catch {}
    return c.redirect(".");
  });
  app.delete("uploader", async (c) => {
    const fd = await c.req.formData();
    const filename = fd.get("name");
    const filePath = uploaderOptions.upload_dir + filename;
    unlinkSync(filePath);
    console.log("削除しました: " + filename);
    return c.text("submit");
  });
  const uploaderScript = import.meta.env.PROD
    ? "/assets/uploader.js"
    : "/src/client/uploader.ts";
  app.get("uploader", (c) => {
    return c.html(
      RenderMainLayout({
        children: <UploaderPage c={c} />,
        script: uploaderScript,
      })
    );
  });
  app.get("uploader/viewer", (c) => {
    return c.html(
      RenderMainLayout({
        children: <UploaderViewerPage c={c} />,
        script: uploaderScript,
      })
    );
  });
  app.get("log", (c) => {
    return c.html(RenderMainLayout({ children: <LogPage /> }));
  });
  app.get("setting", (c) => {
    return c.html(
      RenderMainLayout({ children: <SettingPage isLogin={getIsLogin(c)} /> })
    );
  });

  ["private/*", "twitter/*"].forEach((path) => {
    app.get(path, async (c, next) => {
      if (getIsLogin(c)) {
        return next();
      } else {
        return c.text("401 Unauthorized", 401);
      }
    });
  });
  app.get("*", serveStatic({ root: publicPath }));
  app.get("*", serveStatic({ root: staticPath }));
  app.get("*", async (c, next) => {
    const path = c.req.path;
    const StaticAddPath = `${staticPath}${c.req.path}`;
    if (existsSync(StaticAddPath)) {
      let files = readdirSync(StaticAddPath);
      files = files.filter((f) => !/^\.|archive|\.php$/.test(f));
      return c.html(
        renderToString(
          <DefaultLayout>
            <ul>
              {files.map((file, i) => {
                let dir = path.endsWith("/") ? path : path + "/";
                let href = dir + file;
                if (/\/.[^.]+[^\/]$/.test(href)) href = href + "/";
                return (
                  <li key={i}>
                    <a href={href}>{file}</a>
                  </li>
                );
              })}
            </ul>
            <p>
              <a href="../">一つ上に戻る</a>
            </p>
            <p>
              <a href="/">トップへ戻る</a>
            </p>
          </DefaultLayout>
        )
      );
    } else {
      return next();
    }
  });
}
