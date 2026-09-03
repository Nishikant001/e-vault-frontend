// src/Pages/Audit/useAuditLogs.js
//
// Data-fetching hook for the Audit List/Timeline view. Owns filter state,
// pagination, debounced search, and talks to auditApi.js. Kept separate
// from the presentational components so AuditList.jsx stays about layout.

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuditLogs } from "./auditApi";

export const PAGE_SIZE = 25;

const DEFAULT_FILTERS = {
  module: "",
  action: "",
  status: "",
  userId: "",
  tenantId: "",
  fromDate: "",
  toDate: "",
};

export default function useAuditLogs({ role } = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFiltersState] = useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: PAGE_SIZE });

  // Debounce free-text search input before it hits the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = useCallback((key, value) => {
    setFiltersState((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setFiltersState(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search || Object.values(filters).some((v) => v !== "" && v !== null && v !== undefined)
    );
  }, [search, filters]);

  const activeQuery = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      module: filters.module || undefined,
      action: filters.action || undefined,
      status: filters.status || undefined,
      userId: filters.userId || undefined,
      tenantId: role === "SuperAdmin" ? filters.tenantId || undefined : undefined,
      dateFrom: filters.fromDate || undefined,
      dateTo: filters.toDate || undefined,
    }),
    [page, search, filters, role]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const { data, pagination: p } = await fetchAuditLogs(activeQuery);
        setEntries(data);
        setPagination(p);
      } catch (err) {
        setError(err.message || "Failed to load audit logs.");
        setEntries([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeQuery]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery]);

  return {
    entries,
    loading,
    refreshing,
    error,
    page,
    setPage,
    pagination,
    searchInput,
    setSearchInput,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeQuery,
    refresh: () => load(true),
  };
}
