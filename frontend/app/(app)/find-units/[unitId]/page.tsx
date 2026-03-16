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

  const { contact } = item;
  const hasContact = contact?.landlord_phone || contact?.manager_phone || contact?.caretaker_phone;

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
      <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
        <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">Contact</h2>
        {hasContact ? (
          <ul className="space-y-2 text-sm">
            {contact.landlord_phone && <li><span className="text-surface-500 dark:text-surface-400">Landlord:</span> <a href={`tel:${contact.landlord_phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">{contact.landlord_phone}</a></li>}
            {contact.manager_phone && <li><span className="text-surface-500 dark:text-surface-400">Manager:</span> <a href={`tel:${contact.manager_phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">{contact.manager_phone}</a></li>}
            {contact.caretaker_phone && <li><span className="text-surface-500 dark:text-surface-400">Caretaker:</span> <a href={`tel:${contact.caretaker_phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">{contact.caretaker_phone}</a></li>}
          </ul>
        ) : (
          <p className="text-surface-500 dark:text-surface-400">Contact details are not shared for this listing. You can visit the property or inquire through the platform.</p>
        )}
      </div>
    </div>
  );
}
