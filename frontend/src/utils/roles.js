export const ROLE_LEVEL = {
  user: 1,
  owner: 2,
  superadmin: 3,
};

export function roleLevel(role) {
  return ROLE_LEVEL[role] ?? 0;
}

export function allowedUiModes(role) {
  const lvl = roleLevel(role);

  const modes = [];
  if (lvl >= ROLE_LEVEL.user) modes.push("user");
  if (lvl >= ROLE_LEVEL.owner) modes.push("owner");
  if (lvl >= ROLE_LEVEL.superadmin) modes.push("superadmin");

  return modes;
}

export function defaultUiMode(role) {
  const modes = allowedUiModes(role);
  return modes[modes.length - 1] || "user";
}

export function hasAtLeastRole(userRole, requiredRole) {
  return roleLevel(userRole) >= roleLevel(requiredRole);
}
