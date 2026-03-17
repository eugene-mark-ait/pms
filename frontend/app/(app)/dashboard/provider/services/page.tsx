"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, User } from "@/lib/api";
import SlideOverForm from "@/components/SlideOverForm";
import ServiceForm, {
  SERVICE_FORM_ID,
  SERVICE_CATEGORIES,
  type MarketplaceService,
} from "@/components/forms/ServiceForm";

export default function ProviderServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editService, setEditService] = useState<MarketplaceService | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const isProvider = user?.role_names?.includes("service_provider");

  function loadServices() {
    if (!isProvider) return;
    api
      .get<{ results?: MarketplaceService[]; count?: number }>("/marketplace/my-services/")
      .then((r) => setServices(r.data?.results ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get<User>("/auth/me/").then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("open") === "add" && isProvider) setAddDrawerOpen(true);
  }, [searchParams, isProvider]);

  useEffect(() => {
    if (!isProvider) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadServices();
  }, [isProvider]);

  async function handleDelete(service: MarketplaceService) {
    if (!confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/marketplace/services/${service.id}/`);
      loadServices();
    } catch {
      alert("Failed to delete service.");
    }
  }

  async function handleImageUpload(serviceId: string, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    setUploadingId(serviceId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await api.post(`/marketplace/services/${serviceId}/upload-image/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      loadServices();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      alert(ax.response?.data?.detail ?? "Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  function getCategoryLabel(value: string) {
    return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  if (!isProvider) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My services</h1>
        <p className="text-surface-600 dark:text-surface-400">Service provider access required.</p>
        <Link href="/dashboard/provider" className="text-primary-600 dark:text-primary-400 hover:underline">← Provider Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/provider" className="text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 text-sm">← Provider Dashboard</Link>
        </div>
        <button
          type="button"
          onClick={() => setAddDrawerOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 min-h-[44px] inline-flex items-center"
        >
          Add a New Service You Offer
        </button>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">My services</h1>
      <p className="text-surface-600 dark:text-surface-400">Create and edit the services you offer. Listings appear in the Marketplace.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600" aria-hidden />
          <span>Loading services…</span>
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50/50 dark:bg-surface-800/50 p-8 text-center">
          <p className="text-surface-500 dark:text-surface-400 text-sm">No services yet. Add your first service listing.</p>
          <button
            type="button"
            onClick={() => setAddDrawerOpen(true)}
            className="mt-3 inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Add a New Service You Offer →
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-sm hover:shadow-md transition flex flex-col"
            >
              {s.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-700 mb-3">
                  <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{s.title}</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{getCategoryLabel(s.category)}</p>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{s.service_area}</p>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2 flex-1">{s.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploadingId === s.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(s.id, f);
                      e.target.value = "";
                    }}
                  />
                  {uploadingId === s.id ? "Uploading…" : "Upload image"}
                </label>
                <button
                  type="button"
                  onClick={() => setEditService(s)}
                  className="rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SlideOverForm
        isOpen={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title="Add a New Service You Offer"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button type="button" onClick={onRequestClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={SERVICE_FORM_ID} type="submit" disabled={formSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {formSubmitting ? "Creating…" : "Create Service"}
            </button>
          </div>
        )}
      >
        <ServiceForm
          mode="create"
          onSuccess={() => {
            setAddDrawerOpen(false);
            loadServices();
          }}
          onSubmittingChange={setFormSubmitting}
          defaultContact={user?.email ?? ""}
        />
      </SlideOverForm>

      <SlideOverForm
        isOpen={editService !== null}
        onClose={() => setEditService(null)}
        title="Edit Service"
        width="md"
        footer={(onRequestClose) => (
          <div className="flex gap-3">
            <button type="button" onClick={onRequestClose} className="flex-1 py-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
              Cancel
            </button>
            <button form={SERVICE_FORM_ID} type="submit" disabled={formSubmitting} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {formSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      >
        {editService && (
          <ServiceForm
            mode="edit"
            serviceId={editService.id}
            initialData={editService}
            onSuccess={() => {
              setEditService(null);
              loadServices();
            }}
            onSubmittingChange={setFormSubmitting}
            defaultContact={user?.email ?? ""}
          />
        )}
      </SlideOverForm>
    </div>
  );
}
