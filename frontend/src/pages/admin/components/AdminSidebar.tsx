import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu, menuClasses } from "react-pro-sidebar";
import { Switch } from "./components/Switch";
import { SidebarHeader } from "./components/SidebarHeader";
import { Diamond } from "./icons/Diamond";
import { BarChart } from "./icons/BarChart";
import { Global } from "./icons/Global";
import { Book } from "./icons/Book";
import { Calendar } from "./icons/Calendar";
import { ShoppingCart } from "./icons/ShoppingCart";
import { Service } from "./icons/Service";
import { Badge } from "./components/Badge";
import { Typography } from "./components/Typography";
import { logout } from "../../../utils/auth";

const AVATAR_SRC = "/arellano.png";
const MAIN = "#d23f0b";

type Theme = "light" | "dark";

const themes = {
  light: {
    sidebar: { backgroundColor: "#ffffff", color: "#607489" },
    menu: {
      menuContent: "#fbfcfd",
      icon: MAIN,
      hover: { backgroundColor: "#ffe7df", color: "#3a3f45" },
      disabled: { color: "#9fb6cf" },
    },
  },
  dark: {
    sidebar: { backgroundColor: "#0b2948", color: "#8ba1b7" },
    menu: {
      menuContent: "#082440",
      icon: MAIN,
      hover: { backgroundColor: "#3a160c", color: "#ffffff" },
      disabled: { color: "#3e5e7e" },
    },
  },
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [toggled, setToggled] = React.useState(false);
  const [broken, setBroken] = React.useState(false);
  const [rtl, setRtl] = React.useState(false);
  const [hasImage, setHasImage] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>("light");

  const adminName = "Admin";
  const isDark = theme === "dark";
  const modeLabel = isDark ? "Light mode" : "Dark mode";

  const menuItemStyles = {
    root: { fontSize: "13px", fontWeight: 400 },
    icon: {
      color: themes[theme].menu.icon,
      [`&.${menuClasses.disabled}`]: { color: themes[theme].menu.disabled.color },
    },
    SubMenuExpandIcon: { color: hexToRgba(MAIN, 0.65) },
    subMenuContent: ({ level }: any) => ({
      backgroundColor:
        level === 0
          ? hexToRgba(themes[theme].menu.menuContent, hasImage && !collapsed ? 0.4 : 1)
          : "transparent",
    }),
    button: {
      [`&.${menuClasses.disabled}`]: { color: themes[theme].menu.disabled.color },
      "&:hover": {
        backgroundColor: themes[theme].menu.hover.backgroundColor,
        color: themes[theme].menu.hover.color,
      },
    },
    label: ({ open }: any) => ({ fontWeight: open ? 650 : undefined }),
  };

  return (
    <div style={{ display: "flex", height: "100vh", direction: rtl ? "rtl" : "ltr", overflow: "hidden" }}>
      <Sidebar
        collapsed={collapsed}
        toggled={toggled}
        onBackdropClick={() => setToggled(false)}
        onBreakPoint={setBroken}
        image="https://user-images.githubusercontent.com/25878302/144499035-2911184c-76d3-4611-86e7-bc4e8ff84ff5.jpg"
        rtl={rtl}
        breakPoint="md"
        backgroundColor={hexToRgba(themes[theme].sidebar.backgroundColor, hasImage ? 0.9 : 1)}
        rootStyles={{
          color: themes[theme].sidebar.color,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <div
            onClick={() => setCollapsed((v) => !v)}
            style={{ cursor: "pointer", userSelect: "none", paddingTop: 16, paddingBottom: 12 }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarHeader rtl={rtl} style={{ marginBottom: 12, marginTop: 0 }} />
          </div>

          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ padding: "0 24px", marginBottom: 8 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px" }}
              >
                General
              </Typography>
            </div>

            <Menu menuItemStyles={menuItemStyles}>
              <SubMenu
                label="Charts"
                icon={<BarChart />}
                suffix={
                  <Badge variant="danger" shape="circle">
                    6
                  </Badge>
                }
              >
                <MenuItem>Pie charts</MenuItem>
                <MenuItem>Line charts</MenuItem>
                <MenuItem>Bar charts</MenuItem>
              </SubMenu>

              <SubMenu label="Maps" icon={<Global />}>
                <MenuItem>Google maps</MenuItem>
                <MenuItem>Open street maps</MenuItem>
              </SubMenu>

              <SubMenu label="Components" icon={<Diamond />}>
                <MenuItem>Grid</MenuItem>
                <MenuItem>Layout</MenuItem>
                <SubMenu label="Forms">
                  <MenuItem>Input</MenuItem>
                  <MenuItem>Select</MenuItem>
                  <SubMenu label="More">
                    <MenuItem>CheckBox</MenuItem>
                    <MenuItem>Radio</MenuItem>
                  </SubMenu>
                </SubMenu>
              </SubMenu>

              <SubMenu label="E-commerce" icon={<ShoppingCart />}>
                <MenuItem>Product</MenuItem>
                <MenuItem>Orders</MenuItem>
                <MenuItem>Credit card</MenuItem>
              </SubMenu>
            </Menu>

            <div style={{ padding: "0 24px", marginBottom: 8, marginTop: 32 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px" }}
              >
                Extra
              </Typography>
            </div>

            <Menu menuItemStyles={menuItemStyles}>
              {/* ✅ removed green "New" badge */}
              <MenuItem icon={<Calendar />}>Calendar</MenuItem>
              <MenuItem icon={<Book />}>Documentation</MenuItem>
            </Menu>
          </div>

          {/* FOOTER (moved upward via bottom: 60) */}
          <div
            style={{
              marginTop: "auto",
              position: "sticky",
              bottom: 60,
              padding: collapsed ? "4px 10px" : "8px 14px",
              borderTop: `1px solid ${hexToRgba("#000000", theme === "light" ? 0.08 : 0.18)}`,
              background: themes[theme].sidebar.backgroundColor,
              overflow: "hidden",
            }}
          >
            {/* Profile */}
            <Menu
              menuItemStyles={menuItemStyles}
              rootStyles={{
                width: "100%",
                overflow: "hidden",
                ["." + menuClasses.button]: { width: "100%", justifyContent: "flex-start", overflow: "hidden" },
                ["." + menuClasses.label]: {
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                  overflow: "hidden",
                },
              }}
            >
              <SubMenu
                rootStyles={{ width: "100%", overflow: "hidden" }}
                label={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", overflow: "hidden" }}>
                    <img
                      src={AVATAR_SRC}
                      alt="profile"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && (
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 750,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {adminName}
                        </span>
                      </div>
                    )}
                  </div>
                }
                icon={
                  collapsed ? (
                    <img
                      src={AVATAR_SRC}
                      alt="profile"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : undefined
                }
              >
                <MenuItem>Settings</MenuItem>
                <MenuItem>Help</MenuItem>
                <MenuItem
                  onClick={logout}
                  style={{ color: "#d23f0b", fontWeight: 700 }}
                >
                  Logout
                </MenuItem>
              </SubMenu>
            </Menu>

            {/* Dark mode toggle (NOTE: switch may still be green depending on your Switch component) */}
            {!collapsed && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 10,
                  border: `1px solid ${hexToRgba(MAIN, theme === "light" ? 0.18 : 0.35)}`,
                  background: hexToRgba(MAIN, theme === "light" ? 0.06 : 0.18),
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: theme === "light" ? "#3a3f45" : "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {modeLabel}
                </span>

                {/* ✅ If your Switch supports props, pass MAIN colors.
                    If it doesn't, you'll need to edit Switch component CSS to remove green. */}
                <Switch
                  id="theme-above-profile"
                  checked={isDark}
                  onChange={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
                  label=""
                />
              </div>
            )}

            {broken && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setToggled((v) => !v)}
                  style={{
                    width: "100%",
                    border: `1px solid ${hexToRgba(MAIN, theme === "light" ? 0.25 : 0.35)}`,
                    cursor: "pointer",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: hexToRgba(MAIN, theme === "light" ? 0.06 : 0.18),
                    color: theme === "light" ? "#3a3f45" : "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {toggled ? "Close Menu" : "Open Menu"}
                </button>
              </div>
            )}
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;
