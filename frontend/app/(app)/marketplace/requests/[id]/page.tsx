"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { SERVICE_CATEGORIES } from "@/components/forms/ServiceForm";

interface RequestDetail {
  id: string;
  service: string;
  service_title: string;
  service_category?: string;
  message: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<RequestDetail>(`/marketplace/requests/${id}/`)
      .then((res) => setRequest(res.data))
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (request?.status === "actioned" && !reviewDone) {
      setShowReview(true);
    }
  }, [request?.status, reviewDone]);

  async function submitReview() {
    if (!request?.service) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/marketplace/services/${request.service}/reviews/`, {
        rating: reviewRating,
        review: reviewComment.trim() || "",
      });
      setReviewDone(true);
      setShowReview(false);
    } catch {
      alert("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-surface-600 dark:text-surface-400">Invalid request.</p>
        <Link href="/marketplace/requests" className="text-primary-600 dark:text-primary-400 hover:underline">← My requests</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400 py-8">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <p className="text-surface-600 dark:text-surface-400">Request not found.</p>
        <Link href="/marketplace/requests" className="text-primary-600 dark:text-primary-400 hover:underline">← My requests</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/marketplace/requests" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">← My requests</Link>

      <div
        className={`rounded-xl border p-6 shadow-sm ${
          request.status === "actioned"
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20"
            : request.status === "cancelled"
            ? "border-surface-200 dark:border-surface-700 opacity-75"
            : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{request.service_title}</h1>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${
              request.status === "actioned"
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                : request.status === "cancelled"
                ? "bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            {request.status === "pending" ? "Pending" : request.status === "actioned" ? "Actioned" : "Cancelled"}
          </span>
        </div>
        {request.service_category && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {SERVICE_CATEGORIES.find((c) => c.value === request.service_category)?.label ?? request.service_category}
          </p>
        )}
        <p className="mt-4 text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{request.message}</p>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-surface-500 dark:text-surface-400">Created</dt>
            <dd className="font-medium text-surface-900 dark:text-surface-100">{format(new Date(request.created_at), "PPpp")}</dd>
          </div>
          {request.preferred_date && (
            <div>
              <dt className="text-surface-500 dark:text-surface-400">Preferred date</dt>
              <dd className="font-medium text-surface-900 dark:text-surface-100">{format(new Date(request.preferred_date), "PPP")}</dd>
            </div>
          )}
        </dl>
      </div>

      {request.status === "actioned" && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 p-6">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">How was the service?</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">Your request was actioned. Leave a review to help others.</p>
          {!reviewDone ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Rating (1–5)</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {reviewSubmitting ? "Submitting…" : "Submit review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  className="rounded-lg border border-surface-300 dark:border-surface-600 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Maybe later
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Thanks for your review.</p>
          )}
        </div>
      )}

      <Link href={`/marketplace/services/${request.service}`} className="inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline">
        View service listing →
      </Link>
    </div>
  );
}
