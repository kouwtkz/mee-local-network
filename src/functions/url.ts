export function UrlSameFlag(Url: URL) {
  const host = location.origin === Url.origin;
  const pathname = host && location.pathname === Url.pathname;
  return { host, pathname };
}

export function getRelativeUrl(link: string, trailingSlash?: boolean, href: string = location.href) {
  const Url = new URL(link, href);
  if (trailingSlash && !Url.pathname.endsWith("/")) Url.pathname = Url.pathname + "/";
  return Url;
}
