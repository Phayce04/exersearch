import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu, menuClasses } from "react-pro-sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import type { Theme } from "../admin.types";
import { MAIN, adminThemes } from "../AdminLayout";

import { SidebarHeader } from "./components/SidebarHeader";
import { BarChart } from "./icons/BarChart";
import { Book } from "./icons/Book";
import { Calendar } from "./icons/Calendar";
import { Diamond } from "./icons/Diamond";
import { Service } from "./icons/Service";
import { Typography } from "./components/Typography";

type Props = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>; // kept for compatibility

  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  toggled: boolean;
  setToggled: React.Dispatch<React.SetStateAction<boolean>>;

  broken: boolean;
  setBroken: React.Dispatch<React.SetStateAction<boolean>>;
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

const AdminSidebar: React.FC<Props> = ({
  theme,
  collapsed,
  setCollapsed,
  toggled,
  setToggled,
  broken,
  setBroken,
}) => {
  const rtl = false;

  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === "dark";
  const t = adminThemes[theme].app;

  const hoverBg = isDark ? hexToRgba(MAIN, 0.22) : hexToRgba(MAIN, 0.12);

  const go = (path: string) => {
    navigate(path);
    if (broken) setToggled(false);
  };

  const menuItemStyles = {
    root: { fontSize: "13px", fontWeight: 500 },
    icon: {
      color: MAIN,
      [`&.${menuClasses.disabled}`]: { opacity: 0.45 },
    },
    SubMenuExpandIcon: { color: hexToRgba(MAIN, 0.65) },
    subMenuContent: ({ level }: any) => ({
      backgroundColor: level === 0 ? t.soft : "transparent",
    }),
    button: {
      [`&.${menuClasses.disabled}`]: { opacity: 0.5 },
      "&:hover": {
        backgroundColor: hoverBg,
        color: t.text,
      },
    },
    label: ({ open }: any) => ({ fontWeight: open ? 700 : undefined }),
  };

  const activeButtonStyle = {
    backgroundColor: hoverBg,
    color: t.text,
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
        rtl={rtl}
        breakPoint="md"
        backgroundColor={t.bg}
        rootStyles={{
          color: t.text,
          height: "100vh",
          overflow: "hidden",
          borderRight: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Brand (still clickable if you want) */}
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
                style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px", color: t.mutedText }}
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
                style={isPathActive(location.pathname, ["/admin/owner-applications"]) ? activeButtonStyle : undefined}
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
                  style={{ opacity: collapsed ? 0 : 0.75, letterSpacing: "0.5px", color: t.mutedText }}
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

          {/* Optional mobile button (you can delete; burger already controls mobile overlay) */}
          {broken && (
            <div style={{ padding: collapsed ? "10px 10px" : "12px 14px", borderTop: `1px solid ${t.border}`, background: t.soft2 }}>
              <button
                onClick={() => setToggled((v) => !v)}
                style={{
                  width: "100%",
                  border: `1px solid ${t.border}`,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: t.soft,
                  color: t.text,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {toggled ? "Close Menu" : "Open Menu"}
              </button>
            </div>
          )}
        </div>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;
