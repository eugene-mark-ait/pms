/**
 * Cursor-based infinite scroll for marketplace APIs.
 * Uses cursor (or page for offset-style APIs) from response to fetch next page.
 */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULT_PAGE_SIZE = 20;

export interface UseCursorInfiniteScrollOptions<T> {
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  pageSize?: number;
  enabled?: boolean;
  /** Parse API response. Return { results, next } where next is cursor string or page number. */
  parseResponse?: (data: unknown) => { results: T[]; next: string | null };
}

export interface UseCursorInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function useCursorInfiniteScroll<T>({
  endpoint,
  params = {},
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  parseResponse,
}: UseCursorInfiniteScrollOptions<T>): UseCursorInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextRef = useRef<string | null>(null);

  const defaultParse = useCallback((data: unknown) => {
    const d = data as { results?: T[]; next?: string | null };
    return {
      results: Array.isArray(d?.results) ? d.results : [],
      next: d?.next ?? null,
    };
  }, []);

  const buildParams = useCallback(
    (cursorOrPage: string | null) => {
      const p: Record<string, string | number> = { page_size: pageSize };
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") p[k] = v;
      });
      if (cursorOrPage) {
        const num = parseInt(cursorOrPage, 10);
        if (!Number.isNaN(num)) p["page"] = num;
        else p["cursor"] = cursorOrPage;
      }
      return p;
    },
    [pageSize, params]
  );

  const fetchPage = useCallback(
    async (cursorOrPage: string | null, append: boolean) => {
      const isFirst = !cursorOrPage;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get<unknown>(endpoint, { params: buildParams(cursorOrPage) });
        const parse = parseResponse ?? defaultParse;
        const { results, next } = parse(res.data);
        if (append) {
          setItems((prev) => (isFirst ? results : [...prev, ...results]));
        } else {
          setItems(results);
        }
        setNextCursor(next ?? null);
        nextRef.current = next ?? null;
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = ax.response?.status;
        const detail = ax.response?.data?.detail;
        if (status === 401) setError("Please log in again.");
        else if (status === 403) setError("You don't have permission.");
        else if (typeof detail === "string" && detail) setError(detail);
        else setError("Failed to load.");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint, buildParams, defaultParse, parseResponse]
  );

  const loadMore = useCallback(() => {
    if (nextRef.current && !loadingMore && !loading) {
      fetchPage(nextRef.current, true);
    }
  }, [loadingMore, loading, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(null, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setItems([]);
      setNextCursor(null);
      return;
    }
    fetchPage(null, false);
  }, [enabled, endpoint, pageSize, JSON.stringify(params)]);

  useEffect(() => {
    if (!enabled || !nextRef.current || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, nextCursor, loadingMore, loading, loadMore]);

  return {
    items,
    loading,
    loadingMore,
    hasMore: !!nextCursor,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}
