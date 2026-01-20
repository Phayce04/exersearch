export type Theme = "light" | "dark";

export type AdminOutletContext = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};
