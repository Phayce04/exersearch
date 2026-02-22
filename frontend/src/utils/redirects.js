import { getUiMode } from "./appMode";

export function redirectAfterAuth(me, navigate) {
  const role = me?.role;
  const uiMode = getUiMode(role);

  if (uiMode === "user") {
    if (!me?.onboarded_at) return navigate("/onboarding");
    return navigate("/home");
  }

  if (uiMode === "owner") return navigate("/owner/home");
  if (uiMode === "admin") return navigate("/admin/dashboard");
  if (uiMode === "superadmin") return navigate("/admin/dashboard");

  // fallback
  return navigate("/home");
}
