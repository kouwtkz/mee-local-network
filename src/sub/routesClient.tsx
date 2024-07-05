import React from "react";
import { renderToString } from "react-dom/server";
import { RoutingList } from "../routes/client/RoutingList";
import { CommonHono } from "../types/HonoCustomType";
import { DefaultLayout } from "../layout";

export function RoutesClient(app: CommonHono) {
  RoutingList.forEach((path) => {
    app.get(path, (c) => {
      return c.html(
        renderToString(
          <DefaultLayout
            script={
              <script
                type="module"
                src={
                  import.meta.env.PROD ? "/assets/client.js" : "/src/client.tsx"
                }
              />
            }
          >
            <div id="root" />
          </DefaultLayout>
        )
      );
    });
  });
}
