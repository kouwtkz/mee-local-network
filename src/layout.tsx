import React from "react";
import { stylesAddVer } from "./server/env";

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
