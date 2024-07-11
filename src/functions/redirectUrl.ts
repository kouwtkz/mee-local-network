export function getRedirectUrl(url: string) {
  const Url = new URL(url);
  return "/login/?redirect=" +
    encodeURIComponent(Url.href.replace(Url.origin, ""))
}