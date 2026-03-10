// src/utils/ingredientApi.js
import { api } from "./apiClient";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://exersearch.test";

function apiError(e, fallback = "Request failed.") {
  return (
    e?.response?.data?.message ||
    (e?.response?.data ? JSON.stringify(e.response.data, null, 2) : null) ||
    e?.message ||
    fallback
  );
}

/* ---------------------------
 * PUBLIC (optional)
 * --------------------------- */

export async function getIngredients(params = {}) {
  try {
    const res = await api.get("/ingredients", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load ingredients."));
  }
}

export async function getIngredientCategories() {
  try {
    const res = await api.get("/ingredients/categories");
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load categories."));
  }
}

/* ---------------------------
 * ADMIN
 * --------------------------- */

export async function getAdminIngredients(params = {}) {
  try {
    const res = await api.get("/admin/ingredients", { params });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load admin ingredients."));
  }
}

export async function createIngredient(payload) {
  try {
    const res = await api.post("/admin/ingredients", payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create ingredient."));
  }
}

export async function updateIngredient(id, payload) {
  try {
    const res = await api.patch(`/admin/ingredients/${id}`, payload);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update ingredient."));
  }
}

export async function deleteIngredient(id) {
  try {
    const res = await api.delete(`/admin/ingredients/${id}`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete ingredient."));
  }
}

export async function toggleIngredient(id) {
  try {
    const res = await api.patch(`/admin/ingredients/${id}/toggle`);
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to toggle ingredient."));
  }
}