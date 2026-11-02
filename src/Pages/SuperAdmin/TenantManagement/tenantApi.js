import { API_BASE_URL } from "../../../services/apiClient";

export const API = API_BASE_URL;

export function getToken() {
  return localStorage.getItem("accessToken") || "";
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}