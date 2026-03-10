import { api } from "./apiClient";

export async function updateMyPreferences(payload) {
  const res = await api.put("/users/0/preferences", payload);
  return res.data;
}