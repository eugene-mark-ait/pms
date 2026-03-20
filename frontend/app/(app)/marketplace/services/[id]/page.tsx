"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, User } from "@/lib/api";
import { SERVICE_PLACEHOLDER } from "@/lib/marketplace";
import SlideOverForm from "@/components/SlideOverForm";
import ServiceRequestForm, { SERVICE_REQUEST_FORM_ID } from "@/components/forms/ServiceRequestForm";
import { SERVICE_CATEGORIES, type MarketplaceService } from "@/components/forms/ServiceForm";
import { useCursorInfiniteScroll } from "@/hooks/useCursorInfiniteScroll";

function getCategoryLabel(value: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function formatPriceRange(s: MarketplaceService): string {
  if (s.min_price != null && s.max_price != null) {
    return `KSh ${Number(s.min_price).toLocaleString("en-KE")} – ${Number(s.max_price).toLocaleString("en-KE")}`;
  }
  if (s.min_price != null) return `From KSh ${Number(s.min_price).toLocaleString("en-KE")}`;
  if (s.max_price != null) return `Up to KSh ${Number(s.max_price).toLocaleString("en-KE")}`;
  return s.price_range || "Price on request";
}

export interface ServiceReviewItem {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  reviewer_display?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [user, setUser] = useState<User | null>(null);
  const [service, setService] = useState<MarketplaceService | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>("");

  const reviewParams = ratingFilter ? { rating: ratingFilter } : {};

  const {
    items: reviews,
    loading: reviewsLoading,
    loadingMore: reviewsLoadingMore,
    hasMore: reviewsHasMore,
    error: reviewsError,
    totalCount: reviewsFilteredCount,
    refresh: refreshReviews,
    sentinelRef: reviewsSentinelRef,
  } = useCursorInfiniteScroll<ServiceReviewItem>({
    endpoint: id ? `/marketplace/services/${id}/reviews/` : "/marketplace/services/00000000-0000-0000-0000-000000000000/reviews/",
    params: reviewParams,
    pageSize: 15,
    enabled: !!id,
    parseResponse: (data) => {
      const d = data as { results?: ServiceReviewItem[]; next?: string | null; count?: number | null };
      return {
        results: Array.isArray(d?.results) ? d.results : [],
        next: d?.next ?? null,
        count: d?.count ?? undefined,
      };
    },
  });

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get<MarketplaceService>(`/marketplace/services/${id}/`)
      .then((res) => setService(res.data))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onRatingFilterChange = useCallback((value: string) => {
    setRatingFilter(value);
  }, []);

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-surface-600 dark:text-surface-400">Invalid service.</p>
        <Link href="/marketplace" className="text-primary-600 dark:text-primary-400 hover:underline">← Marketplace</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-8">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <p className="text-surface-600 dark:text-surface-400">Service not found.</p>
        <Link href="/marketplace" className="text-primary-600 dark:text-primary-400 hover:underline">← Marketplace</Link>
      </div>
    );
  }

  const rating = service.average_rating ?? 0;
  const reviewCount = service.review_count ?? 0;
  const reviewsHeadingCount =
    ratingFilter && reviewsFilteredCount != null ? reviewsFilteredCount : reviewCount;

  return (
    <div className="space-y-6">
      {requestSuccess && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span>Request sent. The provider will contact you.</span>
          <button type="button" onClick={() => setRequestSuccess(false)} className="text-emerald-600 dark:text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}
      <div>
        <Link href="/marketplace" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">← Marketplace</Link>
      </div>
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <div className="aspect-video rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-700 mb-6">
          <img
            src={service.image_url || SERVICE_PLACEHOLDER}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = SERVICE_PLACEHOLDER)}
          />
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{service.title}</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">{getCategoryLabel(service.category)}</p>
        <p className="text-surface-600 dark:text-surface-400 mt-2 font-medium">{service.provider_name ?? "Provider"}</p>
        <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">{service.service_area}</p>
        {rating > 0 && (
          <p className="mt-2 text-sm">
            <span className="text-amber-500">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span>
            <span className="ml-2 text-surface-500 dark:text-surface-400">({rating}) · {reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
          </p>
        )}
        <p className="mt-4 text-surface-700 dark:text-surface-300">{service.description}</p>
        <p className="mt-4 font-medium text-surface-900 dark:text-surface-100">{formatPriceRange(service)}</p>
        {service.availability && (
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">Availability: {service.availability}</p>
        )}
        {service.contact_info && (
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">Contact: {service.contact_info}</p>
        )}
        {user && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setRequestDrawerOpen(true)}
              className="rounded-lg bg-primary-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-700"
            >
              Request Service
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Reviews ({reviewsHeadingCount}
            {ratingFilter ? ` · ${ratingFilter}★` : ""})
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="review-rating-filter" className="text-sm text-surface-600 dark:text-surface-400 whitespace-nowrap">
              Filter by stars
            </label>
            <select
              id="review-rating-filter"
              value={ratingFilter}
              onChange={(e) => onRatingFilterChange(e.target.value)}
              className="rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>{n} stars</option>
              ))}
            </select>
          </div>
        </div>

        {reviewsError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{reviewsError}</p>
        )}
        {reviewsLoading && !reviews.length ? (
          <div className="mt-6 flex items-center gap-2 text-surface-500 dark:text-surface-400 text-sm">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
            <span>Loading reviews…</span>
          </div>
        ) : reviews.length === 0 ? (
          <p className="mt-6 text-sm text-surface-500 dark:text-surface-400">
            {ratingFilter ? "No reviews match this filter." : "No reviews yet."}
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-surface-100 dark:border-surface-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                      {"★".repeat(Math.min(5, Math.round(r.rating)))}
                      {"☆".repeat(5 - Math.min(5, Math.round(r.rating)))}
                    </span>
                    {r.reviewer_display && (
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{r.reviewer_display}</span>
                    )}
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  {r.review && (
                    <p className="mt-2 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{r.review}</p>
                  )}
                </li>
              ))}
            </ul>
            {reviewsHasMore && (
              <div ref={reviewsSentinelRef} className="min-h-[48px] flex justify-center items-center py-4">
                {reviewsLoadingMore && (
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SlideOverForm
        isOpen={requestDrawerOpen}
        onClose={() => setRequestDrawerOpen(false)}
        title="Request service"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRequestClose}
              className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
            >
              Cancel
            </button>
            <button
              form={SERVICE_REQUEST_FORM_ID}
              type="submit"
              disabled={formSubmitting}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {formSubmitting ? "Sending…" : "Send request"}
            </button>
          </div>
        )}
      >
        <ServiceRequestForm
          serviceId={id}
          onSuccess={() => {
            setRequestSuccess(true);
            setRequestDrawerOpen(false);
            router.refresh();
            refreshReviews();
          }}
          onSubmittingChange={setFormSubmitting}
        />
      </SlideOverForm>
    </div>
  );
}
