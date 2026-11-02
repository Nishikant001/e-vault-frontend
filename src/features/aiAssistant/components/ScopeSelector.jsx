// src/features/aiAssistant/components/ScopeSelector.jsx
import { useEffect, useState } from "react";
import { AppSelect, AppSearch as SearchInput } from "../../../components/ui";
import { MasterDataApi, DocumentPickerApi } from "../api";
import { decodeToken } from "../../../services/apiClient";
import { useLabels } from "../../../context/MetadataContext";

const SCOPE_OPTIONS = [
  { value: "ALL", label: "All Documents" },
  { value: "DOCUMENT", label: "Current Document" },
  { value: "FOLDER_DEPARTMENT", label: "Department" },
  { value: "FOLDER_CATEGORY", label: "Category" },
  { value: "FOLDER_DOCTYPE", label: "Document Type" },
  { value: "FOLDER", label: "Entire Folder" },
];

export default function ScopeSelector({ scope, onChange, presetDocumentId = null }) {
  const { level1Label, level2Label, level3Label } = useLabels();
  const [mode, setMode] = useState(presetDocumentId ? "DOCUMENT" : scope?.scopeType === "FOLDER" ? "FOLDER" : scope?.scopeType || "ALL");
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [folder, setFolder] = useState({ departmentId: "", categoryId: "", documentTypeId: "" });
  const [docQuery, setDocQuery] = useState("");
  const [docResults, setDocResults] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(presetDocumentId ? { id: presetDocumentId } : null);

  useEffect(() => {
    const tenantId = decodeToken()?.tenantId;
    if (!tenantId) return;
    MasterDataApi.departments(tenantId)
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!folder.departmentId) return setCategories([]);
    MasterDataApi.categories(folder.departmentId)
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, [folder.departmentId]);

  useEffect(() => {
    if (!folder.categoryId) return setDocumentTypes([]);
    MasterDataApi.documentTypes(folder.categoryId)
      .then((res) => setDocumentTypes(res.data || []))
      .catch(() => setDocumentTypes([]));
  }, [folder.categoryId]);

  useEffect(() => {
    if (mode !== "DOCUMENT" || !docQuery.trim()) return setDocResults([]);
    const handle = setTimeout(() => {
      DocumentPickerApi.search({ q: docQuery, pageSize: 8 })
        .then((res) => setDocResults(res.data || []))
        .catch(() => setDocResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [mode, docQuery]);

  const commit = (nextMode, extra = {}) => {
    setMode(nextMode);
    if (nextMode === "ALL") {
      onChange({ scopeType: "ALL", label: "All Documents" });
    } else if (nextMode === "DOCUMENT") {
      if (extra.doc) {
        onChange({ scopeType: "DOCUMENT", scopeDocumentIds: [extra.doc.id], label: extra.doc.originalFileName || extra.doc.name });
      }
    } else if (nextMode.startsWith("FOLDER")) {
      const f = extra.folder || folder;
      const scopeFolderJson = {
        departmentId: f.departmentId || undefined,
        categoryId: f.categoryId || undefined,
        documentTypeId: f.documentTypeId || undefined,
      };
      const labelParts = [];
      if (f.departmentId) labelParts.push(departments.find((d) => String(d.id) === String(f.departmentId))?.name || level1Label);
      if (f.categoryId) labelParts.push(categories.find((c) => String(c.id) === String(f.categoryId))?.name || level2Label);
      if (f.documentTypeId) labelParts.push(documentTypes.find((t) => String(t.id) === String(f.documentTypeId))?.name || level3Label);
      onChange({ scopeType: "FOLDER", scopeFolderJson, label: labelParts.join(" / ") || "Folder" });
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex flex-wrap gap-1.5">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => commit(opt.value)}
            className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors ${
              mode === opt.value
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {opt.label
              .replace("Department", level1Label)
              .replace("Category", level2Label)
              .replace("Document Type", level3Label)}
          </button>
        ))}
      </div>

      {mode === "DOCUMENT" && (
        <div className="relative">
          <SearchInput
            placeholder="Search for a document by name…"
            value={selectedDoc?.originalFileName || docQuery}
            onChange={(val) => {
              setSelectedDoc(null);
              setDocQuery(val);
            }}
          />
          {docResults.length > 0 && !selectedDoc && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-auto">
              {docResults.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setDocQuery("");
                    setDocResults([]);
                    commit("DOCUMENT", { doc });
                  }}
                >
                  {doc.originalFileName || doc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode.startsWith("FOLDER") && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <AppSelect
            value={folder.departmentId}
            onChange={(e) => {
              const next = { departmentId: e.target.value, categoryId: "", documentTypeId: "" };
              setFolder(next);
              commit(mode, { folder: next });
            }}
          >
            <option value="">{level1Label}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </AppSelect>
          {mode !== "FOLDER_DEPARTMENT" && (
            <AppSelect
              value={folder.categoryId}
              disabled={!folder.departmentId}
              onChange={(e) => {
                const next = { ...folder, categoryId: e.target.value, documentTypeId: "" };
                setFolder(next);
                commit(mode, { folder: next });
              }}
            >
              <option value="">{level2Label}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </AppSelect>
          )}
          {mode === "FOLDER_DOCTYPE" && (
            <AppSelect
              value={folder.documentTypeId}
              disabled={!folder.categoryId}
              onChange={(e) => {
                const next = { ...folder, documentTypeId: e.target.value };
                setFolder(next);
                commit(mode, { folder: next });
              }}
            >
              <option value="">{level3Label}</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </AppSelect>
          )}
        </div>
      )}
    </div>
  );
}
