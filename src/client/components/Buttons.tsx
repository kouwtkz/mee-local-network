import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";
import { DarkTheme } from "../theme";

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
