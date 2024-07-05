import React from "react";

export function LogPage() {
  return (
    <>
      <h1></h1>
      <ul>
        <li>
          <a href="/Miiverse/">Miiverseログ</a>
        </li>
        <li>
          <a href="/twitter/">Twitterログ</a>
        </li>
        <li>
          <a href="/private/money/">Moneyログ</a>
        </li>
        {/* <li>
          <a href="bbs">掲示板</a>
        </li> */}
      </ul>
      <a href="/">トップへ戻る</a>
    </>
  );
}