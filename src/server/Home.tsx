import React from "react";

export function TopPage({ title }: { title?: string }) {
  return (
    <>
      <h1>{title}</h1>
      <div className="row">
        <ul className="links">
          <li>
            <a href="/uploader/">簡易あぷろだ</a>
          </li>
          <li>
            <a href="/logue/">めぇのつぶやき</a>
          </li>
          <li>
            <a href="/log/">ログ一覧</a>
          </li>
          <li>
            <a href="https://cottonwind.com">ホームページ</a>
          </li>
          <li>
            <a href="/setting/">せってい</a>
          </li>
          <li>
            <a href="/other/">その他</a>
          </li>
        </ul>
      </div>
    </>
  );
}

export function OtherPage({ title }: { title?: string }) {
  return (
    <>
      <h1>{title}</h1>
      <div className="row">
        <ul className="links">
          <li>
            <a href="/share/">シェアページ</a>
          </li>
          <li>
            <a href="/offline/">オフラインファイル</a>
          </li>
        </ul>
      </div>
    </>
  );
}
