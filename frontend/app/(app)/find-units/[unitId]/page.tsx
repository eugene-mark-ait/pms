"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface VacancyDetail {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  monthly_rent: string;
  available_from: string;
  property_id: string;
  property_name: string;
  address: string;
  location: string;
  public_description?: string;
  amenities?: string;
  parking_info?: string;
  nearby_landmarks?: string;
  house_rules?: string;
  contact_preference?: string;
  rules?: { id: string; title: string; description: string }[];
  contact: {
    landlord_phone?: string | null;
    manager_phone?: string | null;
    caretaker_phone?: string | null;
  };
  first_image: string | null;
}

export default function VacancyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.unitId as string;
  const [item, setItem] = useState<VacancyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!unitId) return;
    api
      .get<VacancyDetail>(`/vacancies/discovery/${unitId}/`)
      .then((res) => setItem(res.data))
      .catch(() => setError("Vacancy not found or no longer available."))
      .finally(() => setLoading(false));
  }, [unitId]);

  if (loading) return <p className="text-surface-500 dark:text-surface-400">Loading…</p>;
  if (error || !item) return <div className="space-y-4"><p className="text-red-600 dark:text-red-400">{error || "Not found."}</p><Link href="/find-units" className="text-primary-600 dark:text-primary-400 hover:underline">← Back to search</Link></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/find-units" className="text-primary-600 dark:text-primary-400 hover:underline">← Back to search</Link>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{item.property_name} – Unit {item.unit_number}</h1>
      {item.first_image && (
        <div className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
          <img src={item.first_image} alt={item.property_name} className="w-full h-64 object-cover" />
        </div>
      )}
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between"><dt className="text-surface-500 dark:text-surface-400">Unit type</dt><dd className="font-medium text-surface-900 dark:text-surface-100">{item.unit_type}</dd></div>
        <div className="flex justify-between"><dt className="text-surface-500 dark:text-surface-400">Rent (monthly)</dt><dd className="font-medium text-surface-900 dark:text-surface-100">KSh {Number(item.monthly_rent).toLocaleString("en-KE")}</dd></div>
        <div className="flex justify-between"><dt className="text-surface-500 dark:text-surface-400">Available from</dt><dd className="font-medium text-surface-900 dark:text-surface-100">{new Date(item.available_from).toLocaleDateString()}</dd></div>
        <div className="flex justify-between"><dt className="text-surface-500 dark:text-surface-400">Address</dt><dd className="text-surface-900 dark:text-surface-100">{item.address || "—"}</dd></div>
        {item.location && <div className="flex justify-between"><dt className="text-surface-500 dark:text-surface-400">Location</dt><dd className="text-surface-900 dark:text-surface-100">{item.location}</dd></div>}
      </dl>
      {item.public_description && (
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">Description</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-wrap">{item.public_description}</p>
        </div>
      )}
      {item.amenities && (
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">Amenities</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">{item.amenities}</p>
        </div>
      )}
      {item.parking_info && (
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">Parking</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">{item.parking_info}</p>
        </div>
      )}
      {item.nearby_landmarks && (
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">Nearby landmarks</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400">{item.nearby_landmarks}</p>
        </div>
      )}
      {item.rules && item.rules.length > 0 && (
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">Property rules</h2>
          <ul className="space-y-2">
            {item.rules.map((r) => (
              <li key={r.id} className="border-l-2 border-surface-200 dark:border-surface-600 pl-3">
                <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">{r.title}</p>
                {r.description && <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5 whitespace-pre-wrap">{r.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.contact_preference && (
        <p className="text-sm text-surface-500 dark:text-surface-400">Preferred contact: {item.contact_preference}</p>
      )}
    </div>
  );
}
