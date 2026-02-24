import axios from "axios";

export const API_BASE_URL = "https://exersearch.test/api/v1";   

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});