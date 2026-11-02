// src/Pages/TenantAdmin/UserAssignment/treeDataSource.js
//
// Lazy-loading tree data source consumed by <TreeSelect>.
//
//   DEPARTMENT     → Department (selectable) → Category → Document Type   (children shown for context)
//   CATEGORY       → Department (expand-only) → Category (selectable) → Document Type (context)
//   DOCUMENT_TYPE  → Department (expand-only) → Category (expand-only) → Document Type (selectable)
//
// CHANGE vs old version: the full hierarchy is now always browsable. Nodes
// below the selectable level are shown as non-selectable "inherited" rows,
// so the tree matches the "Grants everything under …" wording of each level.

import { fetchTenantDepartments, fetchCategories, fetchDocumentTypes } from "./userAssignmentApi";

function deptNode(d, selectable) {
  return { key: `dept-${d.id}`, id: d.id, label: d.name, type: "DEPARTMENT", selectable, hasChildren: true, meta: d };
}
function catNode(c, selectable) {
  return { key: `cat-${c.id}`, id: c.id, label: c.name, type: "CATEGORY", selectable, hasChildren: true, meta: c };
}
function dtNode(dt, selectable) {
  return { key: `dt-${dt.id}`, id: dt.id, label: dt.name, type: "DOCUMENT_TYPE", selectable, hasChildren: false, meta: dt };
}

export function createTreeDataSource(level, tenantId) {
  return {
    level,

    async getRoots() {
      const depts = await fetchTenantDepartments(tenantId);
      const selectable = level === "DEPARTMENT";
      return depts
        .map((d) => deptNode(d, selectable))
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    async getChildren(node) {
      if (node.type === "DEPARTMENT") {
        const cats = await fetchCategories({ departmentId: node.id });
        const selectable = level === "CATEGORY";
        return cats.map((c) => catNode(c, selectable)).sort((a, b) => a.label.localeCompare(b.label));
      }
      if (node.type === "CATEGORY") {
        const dts = await fetchDocumentTypes({ categoryId: node.id });
        const selectable = level === "DOCUMENT_TYPE";
        return dts.map((dt) => dtNode(dt, selectable)).sort((a, b) => a.label.localeCompare(b.label));
      }
      return [];
    },

    async searchAll(query) {
      const q = query.trim().toLowerCase();
      const depts = await fetchTenantDepartments(tenantId);
      const deptById = new Map(depts.map((d) => [d.id, d]));

      if (level === "DEPARTMENT") {
        return depts.filter((d) => d.name.toLowerCase().includes(q)).map((d) => deptNode(d, true));
      }

      const cats = await fetchCategories({});
      if (level === "CATEGORY") {
        const matched = cats.filter((c) => c.name.toLowerCase().includes(q));
        return groupByDepartment(matched, deptById, (c) => c.departmentId, (c) => catNode(c, true));
      }

      const dts = await fetchDocumentTypes({});
      const catById = new Map(cats.map((c) => [c.id, c]));
      const matched = dts.filter((dt) => dt.name.toLowerCase().includes(q));

      const byDept = new Map();
      matched.forEach((dt) => {
        const cat = catById.get(dt.categoryId) || dt.Category;
        const deptId = cat?.departmentId;
        if (!byDept.has(deptId)) byDept.set(deptId, new Map());
        const catBucket = byDept.get(deptId);
        if (!catBucket.has(dt.categoryId)) catBucket.set(dt.categoryId, { cat, dts: [] });
        catBucket.get(dt.categoryId).dts.push(dt);
      });

      return Array.from(byDept.entries()).map(([deptId, catBucket]) => ({
        ...deptNode(deptById.get(deptId) || { id: deptId, name: "Unknown Department" }, false),
        _preloadedChildren: Array.from(catBucket.values()).map(({ cat, dts: dd }) => ({
          ...catNode(cat || { id: 0, name: "Unknown Category" }, false),
          _preloadedChildren: dd.map((dt) => dtNode(dt, true)),
        })),
      }));
    },
  };
}

function groupByDepartment(items, deptById, getDeptId, toNode) {
  const byDept = new Map();
  items.forEach((item) => {
    const deptId = getDeptId(item);
    if (!byDept.has(deptId)) byDept.set(deptId, []);
    byDept.get(deptId).push(item);
  });
  return Array.from(byDept.entries()).map(([deptId, list]) => ({
    ...deptNode(deptById.get(deptId) || { id: deptId, name: "Unknown Department" }, false),
    _preloadedChildren: list.map(toNode),
  }));
}