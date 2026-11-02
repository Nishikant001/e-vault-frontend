// src/features/approvalEngine/EntityComboSelector.jsx
//
// The ApprovalWorkflow model in THIS module binds a workflow to a
// (Department, Category, DocumentType) combo. That binding is DMS-specific,
// so it's deliberately isolated in its own small component rather than
// baked into WorkflowBuilder — a future "Leave Approval" module would
// swap this out for its own selector (e.g. Leave Type) and reuse
// WorkflowBuilder / ApprovalTimeline / the api client unchanged.
import { useEffect, useState } from "react";
import AppSelect from "../../components/ui/Select";
import { MasterDataApi, decodeToken } from "./api";
import { useLabels } from "../../context/MetadataContext";

export default function EntityComboSelector({ value, onChange, disabled = false }) {
  const { level1Label, level2Label, level3Label } = useLabels();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const payload = decodeToken();
    const tenantId = payload?.tenantId;
    if (!tenantId) return;
    setLoading(true);
    MasterDataApi.tenantDepartments(tenantId)
      .then((res) => setDepartments(res.data || res.departments || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!value.departmentId) { setCategories([]); return; }
    MasterDataApi.categories(value.departmentId)
      .then((res) => setCategories(res.data || res.categories || []))
      .catch(() => setCategories([]));
  }, [value.departmentId]);

  useEffect(() => {
    if (!value.categoryId) { setDocumentTypes([]); return; }
    MasterDataApi.documentTypes(value.categoryId)
      .then((res) => setDocumentTypes(res.data || res.documentTypes || []))
      .catch(() => setDocumentTypes([]));
  }, [value.categoryId]);

  const deptOf = (d) => d.Department || d.department || d;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppSelect
        label={level1Label}
        required
        disabled={disabled || loading}
        value={value.departmentId || ""}
        onChange={(e) => onChange({ departmentId: e.target.value, categoryId: "", documentTypeId: "" })}
      >
        <option value="">{loading ? "Loading…" : `Select ${level1Label.toLowerCase()}`}</option>
        {departments.map((d) => {
          const dept = deptOf(d);
          return <option key={dept.id} value={dept.id}>{dept.name}</option>;
        })}
      </AppSelect>

      <AppSelect
        label={level2Label}
        required
        disabled={disabled || !value.departmentId}
        value={value.categoryId || ""}
        onChange={(e) => onChange({ ...value, categoryId: e.target.value, documentTypeId: "" })}
      >
        <option value="">
          {value.departmentId ? `Select ${level2Label.toLowerCase()}` : `Select ${level1Label.toLowerCase()} first`}
        </option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </AppSelect>

      <AppSelect
        label={level3Label}
        required
        disabled={disabled || !value.categoryId}
        value={value.documentTypeId || ""}
        onChange={(e) => onChange({ ...value, documentTypeId: e.target.value })}
      >
        <option value="">
          {value.categoryId ? `Select ${level3Label.toLowerCase()}` : `Select ${level2Label.toLowerCase()} first`}
        </option>
        {documentTypes.map((dt) => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
      </AppSelect>
    </div>
  );
}
