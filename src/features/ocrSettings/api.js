// src/features/ocrSettings/api.js
// Tenant is derived server-side from the JWT; nothing here sends a tenantId.
import { get, put, post, del } from "../../services/apiClient";

export const getOcrSettings = () => get("/ocr-settings");
export const saveOcrSettings = (payload) => put("/ocr-settings", payload);
export const testOcrConnection = () => post("/ocr-settings/test", {});
export const clearOcrCredentials = () => del("/ocr-settings/credentials");
