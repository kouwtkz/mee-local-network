export function UrlSameFlag(Url: URL) {
  const host = location.origin === Url.origin;
  const pathname = host && location.pathname === Url.pathname;
  return { host, pathname };
}
