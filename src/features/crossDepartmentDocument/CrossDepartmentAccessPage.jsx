import React, { useEffect, useState, useCallback } from "react";
import RequestDocumentAccess from "./RequestDocumentAccess";
import ManageDocumentRequestFlow from "./ManageDocumentRequestFlow";
import {
  getDocumentAccessRequests,
  getTemporaryShareViewUrl,
  getTemporaryShareDownloadUrl,
} from "./api";
import { get, decodeToken, getCurrentTenantId, API_BASE_URL, authHeaders } from "../../services/apiClient";
const ALL_TABS = [
  { key: "request", label: "Request Access" },
  { key: "mine", label: "My Requests" },
  { key: "manage", label: "Manage Requests" },
  { key: "shared", label: "Shared With Me" },
];

// Sirf ye roles hi doosre department ke requests manage/mask/send kar
// sakte hain. Baaki koi bhi role (Uploader, Viewer, Approver, Auditor)
// ko "Manage Requests" tab dikhna hi nahi chahiye.
const DEPARTMENT_OWNER_ROLES = new Set([
  "SuperAdmin",
  "TenantAdmin",
  "DeptHead",
  "Manager",
  "BranchManager",
]);

function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    DOCUMENT_SELECTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    SHARED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    REVOKED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    EXPIRED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status || "PENDING"}
    </span>
  );
}

function RequestsTable({ requests, loading, mode, onManage, openManageId, onManageUpdated, onViewShare, onDownloadShare }) {  if (loading) {
    return <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>;
  }
  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        No requests to show.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Document Reference</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Status</th>
            {mode === "manage" && <th className="px-4 py-3">Action</th>}
            {mode === "shared" && <th className="px-4 py-3">Access</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <React.Fragment key={r.id}>
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                  {r.documentReference}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-300">
                  {r.reason || "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                {mode === "manage" && (
                  <td className="px-4 py-3">
                    {r.status === "REJECTED" || r.status === "SHARED" || r.status === "REVOKED" ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onManage(r.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Open
                      </button>
                    )}
                  </td>
                )}
                                           {mode === "shared" && (
                  <td className="px-4 py-3">
                    {r.shareId && r.shareStatus !== "REVOKED" && r.shareStatus !== "EXPIRED" ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onViewShare(r.shareId)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadShare(r.shareId)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                        {r.shareExpiresAt && (
                          <span className="text-xs text-gray-400">
                            Expires: {new Date(r.shareExpiresAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : r.shareId && r.shareStatus === "EXPIRED" ? (
                      <span className="text-xs text-gray-400">Access expired</span>
                    ) : r.shareId && r.shareStatus === "REVOKED" ? (
                      <span className="text-xs text-red-400">Access revoked</span>
                    ) : (
                      <span className="text-xs text-gray-400">Not shared yet</span>
                    )}
                  </td>
                )}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CrossDepartmentAccessPage() {
  const [activeTab, setActiveTab] = useState("request");
  const [departments, setDepartments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
    const [currentUserId] = useState(() => decodeToken()?.id ?? null);

  const currentUserRole = decodeToken()?.role ?? null;
  const canManageRequests = DEPARTMENT_OWNER_ROLES.has(currentUserRole);

  const TABS = ALL_TABS.filter(
    (tab) => tab.key !== "manage" || canManageRequests
  );

  useEffect(() => {
    if (activeTab === "manage" && !canManageRequests) {
      setActiveTab("request");
    }
  }, [activeTab, canManageRequests]);

  const loadDepartments = useCallback(async () => {
    try {
      const tenantId = getCurrentTenantId();
      if (!tenantId) return;
      const res = await get(`/departments/tenant/${tenantId}`);
      const list = res?.data || res || [];
      setDepartments(Array.isArray(list) ? list : []);
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocumentAccessRequests();
      const list = res?.data || res || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);
    // Authenticated view/download for recipient temporary shares.
  // A plain <a href> never sends the JWT, so the backend's
  // authMiddleware rejects it with 401 "Authorization token missing".
  // We fetch with the Authorization header ourselves and turn the
  // response into a blob URL instead.
  const handleViewShare = useCallback(async (shareId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${getTemporaryShareViewUrl(shareId)}`,
        { headers: authHeaders(false) }
      );
      if (!res.ok) throw new Error("Unable to open the shared document.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Revoke a bit later so the new tab has time to actually load it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      alert(err?.message || "Unable to open the shared document.");
    }
  }, []);

  const handleDownloadShare = useCallback(async (shareId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}${getTemporaryShareDownloadUrl(shareId)}`,
        { headers: authHeaders(false) }
      );
      if (!res.ok) throw new Error("Unable to download the shared document.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.message || "Unable to download the shared document.");
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (activeTab !== "request") {
      loadRequests();
    }
  }, [activeTab, loadRequests]);

  const myRequests = requests.filter((r) => String(r.requesterUserId) === String(currentUserId));
  const sharedWithMe = requests.filter(
    (r) => String(r.requesterUserId) === String(currentUserId) && r.status === "SHARED"
  );

  return (
    <div className="w-full">
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "request" && (
        <RequestDocumentAccess
          departments={departments}
          onSuccess={() => {
            setActiveTab("mine");
          }}
        />
      )}

      {activeTab === "mine" && (
        <RequestsTable requests={myRequests} loading={loading} mode="mine" currentUserId={currentUserId} />
      )}

      {activeTab === "manage" && (
        <ManageDocumentRequestFlow />
      )}

            {activeTab === "shared" && (
        <RequestsTable
          requests={sharedWithMe}
          loading={loading}
          mode="shared"
          currentUserId={currentUserId}
          onViewShare={handleViewShare}
          onDownloadShare={handleDownloadShare}
        />
      )}
    </div>
  );
}
