import { CreateThemeState } from "./state/ThemeSetter";

export const { Theme: DarkTheme, ThemeState: DarkThemeState } =
  CreateThemeState(
    "darktheme",
    ["light", "dark"]
  );
