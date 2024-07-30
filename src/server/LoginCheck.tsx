import { Next } from "hono";
import { getCookie } from "hono/cookie";
import { CommonContext } from "../types/HonoCustomType";
import { getRedirectUrl } from "../functions/redirectUrl";
const cookieKey = "localToken";
const cookieValue = process.env.COOKIE_VALUE;

export function getIsLogin(c: CommonContext) {
  return (
    (import.meta.env.DEV && new URL(c.req.url).hostname === "localhost") ||
    getCookie(c, cookieKey) === cookieValue
  );
}

export async function LoginRedirect(c: CommonContext, next: Next) {
  if (getIsLogin(c)) return next();
  else return c.redirect(getRedirectUrl(c.req.url));
}

export async function Unauthorized(c: CommonContext, next: Next) {
  if (!getIsLogin(c)) return c.text("401 Unauthorized", 401);
  return next();
}
