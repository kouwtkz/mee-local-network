import React, { ReactNode } from "react";
import { stylesAddVer } from "../server/env";

const defaultStyle = <Style href={"/assets/styles.css" + stylesAddVer} />;

export function Style({
  children,
  href,
  compact = true,
}: {
  children?: any;
  href?: string;
  compact?: boolean;
}) {
  if (href) {
    return <link rel="stylesheet" href={href} />;
  } else {
    if (typeof children === "string") {
      const __html = compact ? children.replace(/\s+/g, " ") : children;
      return <style dangerouslySetInnerHTML={{ __html }} />;
    } else return <style>{children}</style>;
  }
}

export function DefaultLayout({
  title,
  meta,
  style = defaultStyle,
  script,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  meta?: React.ReactNode;
  style?: React.ReactNode;
  script?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <html lang="ja" className={className}>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{title}</title>
        {meta}
        {style}
      </head>
      <body className={bodyClassName}>
        {children}
        {script}
      </body>
    </html>
  );
}

interface AnchorProps {
  href: string;
  path: string;
  dir: string;
}

export function LinksList({
  pathes,
  root = "",
  anchor,
}: {
  pathes: string[];
  root?: string;
  anchor?: (args: AnchorProps) => ReactNode;
}) {
  return (
    <>
      <ul className="links">
        {pathes.map((path, i) => {
          let dir =
            (root.startsWith("/") ? "" : "/") +
            root +
            (root.endsWith("/") ? "" : "/");
          let href = dir + path;
          if (/\/.[^.]+[^\/]$/.test(href)) href = href + "/";
          return (
            <li key={i}>
              {anchor ? anchor({ href, path, dir }) : <a href={href}>{path}</a>}
            </li>
          );
        })}
      </ul>
      <p>
        <a href="../">一つ上に戻る</a>
      </p>
      <p>
        <a href="/">ホームへ戻る</a>
      </p>
    </>
  );
}
