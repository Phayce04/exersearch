// src/utils/ingredientApi.js
import axios from "axios";

const API_BASE = "https://exersearch.test";
const TOKEN_KEY = "token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const res = await axios.get(`${API_BASE}/api/v1/ingredients`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load ingredients."));
  }
}

export async function getIngredientCategories() {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/ingredients/categories`, {
      headers: authHeaders(),
      withCredentials: true,
    });
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
    const res = await axios.get(`${API_BASE}/api/v1/admin/ingredients`, {
      headers: authHeaders(),
      withCredentials: true,
      params,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to load admin ingredients."));
  }
}

export async function createIngredient(payload) {
  try {
    const res = await axios.post(`${API_BASE}/api/v1/admin/ingredients`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to create ingredient."));
  }
}

export async function updateIngredient(id, payload) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/ingredients/${id}`, payload, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to update ingredient."));
  }
}

export async function deleteIngredient(id) {
  try {
    const res = await axios.delete(`${API_BASE}/api/v1/admin/ingredients/${id}`, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to delete ingredient."));
  }
}

export async function toggleIngredient(id) {
  try {
    const res = await axios.patch(`${API_BASE}/api/v1/admin/ingredients/${id}/toggle`, null, {
      headers: authHeaders(),
      withCredentials: true,
    });
    return res.data;
  } catch (e) {
    throw new Error(apiError(e, "Failed to toggle ingredient."));
  }
}

export const API_BASE_URL = API_BASE;