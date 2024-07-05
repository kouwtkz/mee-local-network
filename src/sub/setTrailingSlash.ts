import { appendTrailingSlash } from "hono/trailing-slash";
import { CommonHono } from "../types/HonoCustomType";

export function SetTrailingSlash(app: CommonHono) {
  app.all("*", async (c, next) => {
    console.log(c.req.path, /\/.[^.]+[^\/]$/.test(c.req.path));
    if (/\/.[^.]+.$/.test(c.req.path) && !c.req.path.endsWith("/")) return next();
    else return c.text("404 Not Found", 404);
  });
  app.use(appendTrailingSlash());
}
