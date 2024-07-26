import React from "react";
import { DefaultLayout, Style } from "../layout/default";
import { renderToString } from "react-dom/server";
import { Hono } from "hono";
import { buildAddVer, stylesAddVer } from "./env";
import { LoginRedirect } from "./LoginCheck";

function Layout() {
  return renderToString(
    <DefaultLayout
      title="Twitterログ"
      script={
        <>
          <script
            type="module"
            src={
              import.meta.env.PROD
                ? "/assets/twitter.js" + buildAddVer
                : "/src/client/twitter.tsx"
            }
          />
          <script src="/twitter/def.js" />
          <script src="/assets/user/regist.js" />
        </>
      }
      style={<Style href={"/assets/styles.css" + stylesAddVer} />}
    >
      <div id="root" />
    </DefaultLayout>
  );
}

const pathes = ["", "/dm", "/dm/:name"];

const app = new Hono<MeeBindings>();
app.get("*", LoginRedirect);
pathes.forEach((n) => {
  app.get(n, async (c) => c.html(Layout()));
});

export const app_twitter = app;
