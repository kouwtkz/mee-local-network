import React from "react";
import { CommonContext } from "../types/HonoCustomType";

export function SettingPage({
  darktheme,
  isLogin = false,
}: {
  darktheme?: string;
  isLogin?: boolean;
}) {
  return (
    <>
      <h1>せってい</h1>
      <ul className="links">
        <li>
          {darktheme === "light" ? (
            <a href="/theme/dark/dark?redirect=/setting/">ダークテーマに切替</a>
          ) : darktheme === "dark" ? (
            <a href="/theme/dark/system?redirect=/setting/">
              システムのテーマに切替
            </a>
          ) : (
            <a href="/theme/dark/light?redirect=/setting/">
              ライトテーマに切替
            </a>
          )}
        </li>
        {isLogin ? (
          <li>
            <a href="/logout/">ログアウト</a>
          </li>
        ) : (
          <li>
            <a href="/login/">ログイン</a>
          </li>
        )}
      </ul>
      <a href="/">ホームへ戻る</a>
    </>
  );
}

export function LoginPage({ c }: { c: CommonContext }) {
  const Url = new URL(c.req.url);
  return (
    <>
      <h1>ログイン</h1>
      <form action="/login" method="POST">
        <input type="password" name="password" placeholder="パスワード" />
        <input
          type="hidden"
          name="redirect"
          defaultValue={Url.searchParams.get("redirect") ?? ""}
        />
        <button type="submit">送信</button>
      </form>
    </>
  );
}
