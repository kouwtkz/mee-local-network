import React from "react";

export function SettingPage({ isLogin = false }: { isLogin?: boolean }) {
  return (
    <>
      <h1>せってい</h1>
      <ul>
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
      <a href="/">トップへ戻る</a>
    </>
  );
}

export function LoginPage() {
  return (
    <>
      <h1>ログイン</h1>
      <form action="/login" method="POST">
        <input type="password" name="password" placeholder="パスワード" />
        {/* <label className="form-check-label">
          <input
            id="remember"
            type="checkbox"
            name="remember"
            value="1"
            className="form-check-input"
          />
          次回から省略
        </label> */}
        <button type="submit">送信</button>
      </form>
    </>
  );
}
