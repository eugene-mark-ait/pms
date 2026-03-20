"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULT_PAGE_SIZE = 20;

export interface UseInfiniteScrollOptions<T> {
  /** API path, e.g. "/properties/" */
  endpoint: string;
  /** Optional query params (excluding page). */
  params?: Record<string, string | number>;
  /** Page size for each request. */
  pageSize?: number;
  /** Only start fetching when this is true (e.g. user role check). */
  enabled?: boolean;
  /** Transform API response: (data) => { results, next, count }. Default expects PaginatedResponse. */
  parseResponse?: (data: unknown) => { results: T[]; next: string | null; count?: number };
}

export interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  /** Attach to a scroll sentinel div; typed for JSX ref compatibility. */
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  endpoint,
  params = {},
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  parseResponse,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef(1);

  const defaultParse = useCallback((data: unknown) => {
    const d = data as { results?: T[]; next?: string | null; count?: number };
    return {
      results: Array.isArray(d?.results) ? d.results : [],
      next: d?.next ?? null,
      count: d?.count,
    };
  }, []);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const isFirst = page === 1;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get<unknown>(endpoint, {
          params: { page, page_size: pageSize, ...params },
        });
        const parse = parseResponse ?? defaultParse;
        const { results, next } = parse(res.data);
        if (append) {
          setItems((prev) => (page === 1 ? results : [...prev, ...results]));
        } else {
          setItems(results);
        }
        setNextUrl(next ?? null);
        nextPageRef.current = page + 1;
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = ax.response?.status;
        const detail = ax.response?.data?.detail;
        if (status === 401) setError("Please log in again.");
        else if (status === 403) setError("You don’t have permission to view this.");
        else if (status === 404) setError("Not found.");
        else if (typeof detail === "string" && detail) setError(detail);
        else if (status && status >= 500) setError("Server error. Please try again later.");
        else setError("Failed to load. Check your connection and try again.");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint, pageSize, params, defaultParse, parseResponse]
  );

  const loadMore = useCallback(() => {
    if (nextUrl && !loadingMore && !loading) {
      fetchPage(nextPageRef.current, true);
    }
  }, [nextUrl, loadingMore, loading, fetchPage]);

  const refresh = useCallback(() => {
    nextPageRef.current = 1;
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setItems([]);
      return;
    }
    nextPageRef.current = 1;
    fetchPage(1, false);
  }, [enabled, endpoint, pageSize, JSON.stringify(params)]);

  // IntersectionObserver: when sentinel is visible, load more
  useEffect(() => {
    if (!enabled || !nextUrl || loadingMore || loading) return;
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
  }, [enabled, nextUrl, loadingMore, loading, loadMore]);

  return {
    items,
    loading,
    loadingMore,
    hasMore: !!nextUrl,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}
