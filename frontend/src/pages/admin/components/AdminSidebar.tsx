import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu, menuClasses } from "react-pro-sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { Switch } from "./components/Switch";
import { SidebarHeader } from "./components/SidebarHeader";
import { BarChart } from "./icons/BarChart";
import { Book } from "./icons/Book";
import { Calendar } from "./icons/Calendar";
import { Diamond } from "./icons/Diamond";
import { Service } from "./icons/Service";
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

const isPathActive = (pathname: string, targets: string[]) => {
  return targets.some((t) => (t === "/" ? pathname === "/" : pathname === t || pathname.startsWith(t + "/")));
};

const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [toggled, setToggled] = React.useState(false);
  const [broken, setBroken] = React.useState(false);
  const [rtl] = React.useState(false);
  const [hasImage] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>("light");

  const adminName = "Admin";
  const isDark = theme === "dark";
  const modeLabel = isDark ? "Light mode" : "Dark mode";

  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => {
    navigate(path);
    if (broken) setToggled(false); // close sidebar on mobile after click
  };

  const menuItemStyles = {
    root: { fontSize: "13px", fontWeight: 500 },
    icon: {
      color: themes[theme].menu.icon,
      [`&.${menuClasses.disabled}`]: { color: themes[theme].menu.disabled.color },
    },
    SubMenuExpandIcon: { color: hexToRgba(MAIN, 0.65) },
    subMenuContent: ({ level }: any) => ({
      backgroundColor:
        level === 0 ? hexToRgba(themes[theme].menu.menuContent, hasImage && !collapsed ? 0.4 : 1) : "transparent",
    }),
    button: {
      [`&.${menuClasses.disabled}`]: { color: themes[theme].menu.disabled.color },
      "&:hover": {
        backgroundColor: themes[theme].menu.hover.backgroundColor,
        color: themes[theme].menu.hover.color,
      },
    },
    label: ({ open }: any) => ({ fontWeight: open ? 700 : undefined }),
  };

  // Active route styles (makes the current page highlighted)
  const activeButtonStyle = {
    backgroundColor: themes[theme].menu.hover.backgroundColor,
    color: themes[theme].menu.hover.color,
    fontWeight: 750 as const,
    borderRadius: 10,
    margin: "2px 10px",
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
          {/* Header / Brand */}
          <div
            onClick={() => setCollapsed((v) => !v)}
            style={{ cursor: "pointer", userSelect: "none", paddingTop: 16, paddingBottom: 12 }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarHeader rtl={rtl} style={{ marginBottom: 12, marginTop: 0 }} />
          </div>

          {/* Main Menu */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ padding: "0 24px", marginBottom: 8 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px" }}
              >
                Admin
              </Typography>
            </div>

            <Menu menuItemStyles={menuItemStyles}>
              <MenuItem
                icon={<BarChart />}
                onClick={() => go("/admin/dashboard")}
                style={isPathActive(location.pathname, ["/admin/dashboard"]) ? activeButtonStyle : undefined}
              >
                Dashboard
              </MenuItem>

              <MenuItem
                icon={<Service />}
                onClick={() => go("/admin/owner-applications")}
                style={
                  isPathActive(location.pathname, ["/admin/owner-applications"]) ? activeButtonStyle : undefined
                }
              >
                Owner Applications
              </MenuItem>

              <SubMenu label="Manage Data" icon={<Diamond />}>
                <MenuItem
                  onClick={() => go("/admin/gyms")}
                  style={isPathActive(location.pathname, ["/admin/gyms"]) ? activeButtonStyle : undefined}
                >
                  Gyms
                </MenuItem>
                <MenuItem
                  onClick={() => go("/admin/equipments")}
                  style={isPathActive(location.pathname, ["/admin/equipments"]) ? activeButtonStyle : undefined}
                >
                  Equipments
                </MenuItem>
                <MenuItem
                  onClick={() => go("/admin/amenities")}
                  style={isPathActive(location.pathname, ["/admin/amenities"]) ? activeButtonStyle : undefined}
                >
                  Amenities
                </MenuItem>
                <MenuItem
                  onClick={() => go("/admin/users")}
                  style={isPathActive(location.pathname, ["/admin/users"]) ? activeButtonStyle : undefined}
                >
                  Users
                </MenuItem>
              </SubMenu>

              <div style={{ padding: "0 24px", marginTop: 24, marginBottom: 8 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px" }}
                >
                  Extra
                </Typography>
              </div>

              <MenuItem
                icon={<Calendar />}
                onClick={() => go("/admin/calendar")}
                style={isPathActive(location.pathname, ["/admin/calendar"]) ? activeButtonStyle : undefined}
              >
                Calendar
              </MenuItem>

              <MenuItem
                icon={<Book />}
                onClick={() => go("/admin/docs")}
                style={isPathActive(location.pathname, ["/admin/docs"]) ? activeButtonStyle : undefined}
              >
                Documentation
              </MenuItem>
            </Menu>
          </div>

          {/* Footer (moved up) */}
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
            {/* Profile / Actions */}
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
                <MenuItem onClick={() => go("/admin/settings")}>Settings</MenuItem>
                <MenuItem onClick={() => go("/admin/help")}>Help</MenuItem>

                <MenuItem
                  onClick={() => {
                    logout();
                    if (broken) setToggled(false);
                  }}
                  style={{ color: MAIN, fontWeight: 800 }}
                >
                  Logout
                </MenuItem>
              </SubMenu>
            </Menu>

            {/* Dark mode toggle */}
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
                <Switch
                  id="theme-above-profile"
                  checked={isDark}
                  onChange={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
                  label=""
                />
              </div>
            )}

            {/* Mobile open/close button */}
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
