import Swal from "sweetalert2";

/**
 * Theme-aware SweetAlert helper
 * Pass theme + colors from AdminLayout
 */
export function adminAlert({
  title,
  text,
  icon = "info",
  confirmText = "OK",
  theme,
  mainColor,
}) {
  const isDark = theme === "dark";

  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: confirmText,

    background: isDark ? "#0f0f10" : "#ffffff",
    color: isDark ? "#f3f4f6" : "#111827",

    confirmButtonColor: mainColor,

    iconColor: mainColor,

    buttonsStyling: true,

    customClass: {
      popup: "admin-swal-popup",
      title: "admin-swal-title",
      htmlContainer: "admin-swal-text",
      confirmButton: "admin-swal-confirm",
    },
  });
}

/**
 * Shortcut helpers
 */
export const alertSuccess = (opts) =>
  adminAlert({ icon: "success", confirmText: "Done", ...opts });

export const alertError = (opts) =>
  adminAlert({ icon: "error", confirmText: "Close", ...opts });

export const alertInfo = (opts) =>
  adminAlert({ icon: "info", confirmText: "OK", ...opts });

