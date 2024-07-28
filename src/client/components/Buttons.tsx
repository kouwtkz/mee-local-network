import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";
import { DarkTheme } from "../theme";
import { Link, useLocation } from "react-router-dom";
import { BiSolidLeftArrow } from "react-icons/bi";
import { useMemo } from "react";

export function DarkThemeButton() {
  const { theme: darktheme, next } = DarkTheme.use();
  return (
    <button type="button" title="ダークテーマ切替" onClick={next}>
      {darktheme === "light" ? (
        <CgSun />
      ) : darktheme === "dark" ? (
        <CgMoon />
      ) : (
        <CgDarkMode />
      )}
    </button>
  );
}

export function BackUrlButton({
  root,
  className = "button",
  title = "一つ前へ戻る",
}: {
  title?: string;
  className?: string;
  root?: string;
}) {
  const { pathname, search } = useLocation();
  const isSearch = Boolean(search);
  const href = useMemo(
    () => (search ? pathname : pathname.replace(/[^\/]*.$/, "")),
    [pathname, isSearch]
  );
  const args = { className, title };
  if (root && href.startsWith(root))
    return (
      <Link to={href} {...args}>
        <BiSolidLeftArrow />
      </Link>
    );
  else
    return (
      <a href={href} {...args}>
        <BiSolidLeftArrow />
      </a>
    );
}
