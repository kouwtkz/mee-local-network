import React, { Children } from "react";
import { DefaultLayout, LinksList, Style } from "./layout/default";
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
import { app_bbs } from "./server/bbs";
import { getIsLogin, LoginRedirect } from "./server/LoginCheck";
import { app_twitter } from "./server/twitter";

const title = import.meta.env.VITE_TITLE;

interface RenderBaseLayoutProps {
  children?: React.ReactNode;
  script?: string | string[];
  dark?: string;
}
function RenderBaseLayout({ children, script, dark }: RenderBaseLayoutProps) {
  const scripts = script
    ? (Array.isArray(script) ? script : [script]).map((src, i) => (
        <script key={i} src={src} />
      ))
    : undefined;
  return renderToString(
    <DefaultLayout
      title={title}
      script={scripts}
      className={"simple" + (dark ? ` ${dark}` : "")}
    >
      {children}
    </DefaultLayout>
  );
}

interface RenderMainLayoutProps extends Omit<RenderBaseLayoutProps, "dark"> {
  c: CommonContext;
}
function RenderMainLayout({ c, ...args }: RenderMainLayoutProps) {
  return RenderBaseLayout({ ...args, dark: getCookie(c, "darktheme") });
}

export function ServerCommon(app: CommonHono) {
  const publicPath = import.meta.env.PROD ? "./" : "public";
  const staticPath = import.meta.env.PROD ? "../static" : "static";

  const cookieKey = "localToken";
  const cookieValue = import.meta.env.VITE_COOKIE_VALUE;
  const password = import.meta.env.VITE_LOGIN_PASSWORD;

  app.get("/", (c) => {
    return c.html(
      RenderMainLayout({
        children: <TopPage title={title} />,
        c,
      })
    );
  });
  app.get("login", (c) => {
    return c.html(RenderMainLayout({ c, children: <LoginPage c={c} /> }));
  });
  app.post("login", async (c) => {
    const body = await c.req.parseBody();
    if (cookieValue && body.password === password) {
      setCookie(c, cookieKey, cookieValue, { maxAge: 2592000, path: "/" });
    }
    return c.redirect((body.redirect as string) || "/");
  });
  app.get("logout", async (c) => {
    deleteCookie(c, cookieKey);
    return c.redirect("/setting");
  });
  app.get("theme/dark/:mode", (c) => {
    const mode = c.req.param("mode");
    if (mode === "system") {
      deleteCookie(c, "darktheme");
    } else {
      setCookie(c, "darktheme", mode, { maxAge: 34e6, path: "/" });
    }
    const Url = new URL(c.req.url);
    const redirect = Url.searchParams.get("redirect") ?? "/";
    return c.redirect(redirect);
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
        c,
        children: <UploaderPage c={c} />,
        script: uploaderScript,
      })
    );
  });
  app.get("uploader/viewer", (c) => {
    return c.html(
      RenderMainLayout({
        c,
        children: <UploaderViewerPage c={c} />,
        script: uploaderScript,
      })
    );
  });
  app.get("log", (c) => {
    return c.html(RenderMainLayout({ c, children: <LogPage /> }));
  });
  app.get("setting", (c) => {
    return c.html(
      RenderMainLayout({
        c,
        children: (
          <SettingPage
            isLogin={getIsLogin(c)}
            darktheme={getCookie(c, "darktheme")}
          />
        ),
      })
    );
  });

  ["private/*", "offline/*"].forEach((path) => {
    app.get(path, LoginRedirect);
  });
  app.route("/bbs", app_bbs);
  app.route("/twitter", app_twitter);

  app.get("*", serveStatic({ root: publicPath }));
  app.get("*", serveStatic({ root: staticPath }));
  app.get("*", async (c, next) => {
    const path = c.req.path;
    const StaticAddPath = `${staticPath}${path}`;
    if (existsSync(StaticAddPath)) {
      let files = readdirSync(StaticAddPath);
      files = files.filter((f) => !/^\.|archive|\.php$/.test(f));
      return c.html(
        RenderMainLayout({
          c,
          children: <LinksList root={path} pathes={files} />,
        })
      );
    } else {
      return next();
    }
  });
}
