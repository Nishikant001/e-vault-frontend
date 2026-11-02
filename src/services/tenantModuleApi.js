import { del, get, patch, post, put } from "./apiClient";

export async function getMyModules() {
  return get("/modules/my-modules");
}

// SuperAdmin module-management APIs. These intentionally mirror the
// existing backend contract; no backend behavior is changed here.
export async function listModules() {
  return get("/modules");
}

export async function createModule(payload) {
  return post("/modules", payload);
}

export async function updateModule(id, payload) {
  return put(`/modules/${id}`, payload);
}

export async function getTenantModuleAssignments(tenantId) {
  return get(`/modules/tenants/${tenantId}`);
}

export async function assignModule(tenantId, moduleId) {
  return post(`/modules/tenants/${tenantId}/${moduleId}`, {});
}

export async function unassignModule(tenantId, moduleId) {
  return del(`/modules/tenants/${tenantId}/${moduleId}`);
}

export async function setModuleEnabled(tenantId, moduleId, isEnabled) {
  return patch(`/modules/tenants/${tenantId}/${moduleId}`, { isEnabled });
}
