import { api } from "./apiClient";

export async function updateMyProfile(payload) {
  const res = await api.put("/user/profile", payload);
  return res.data;
}