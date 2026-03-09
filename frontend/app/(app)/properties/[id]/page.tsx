"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface PropertyDetail {
  id: string;
  name: string;
  address: string;
  units: { id: string; unit_number: string }[];
  rules: { id: string; title: string }[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    api.get<PropertyDetail>(`/properties/${params.id}/`).then((res) => setProperty(res.data)).catch(() => setProperty(null)).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-surface-500">Loading…</p>;
  if (!property) return <p className="text-surface-600">Property not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties" className="text-surface-500 hover:text-surface-700">← Properties</Link>
      </div>
      <h1 className="text-2xl font-bold text-surface-900">{property.name}</h1>
      <p className="text-surface-600">{property.address}</p>
      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Units</h2>
        <ul className="space-y-1">
          {property.units?.map((u) => (
            <li key={u.id}>
              <Link href={`/units?property=${property.id}`} className="text-primary-600 hover:underline">
                Unit {u.unit_number}
              </Link>
            </li>
          ))}
          {(!property.units || property.units.length === 0) && <li className="text-surface-500">No units</li>}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Rules</h2>
        <ul className="list-disc pl-6 space-y-1">
          {property.rules?.map((r) => <li key={r.id}>{r.title}</li>)}
          {(!property.rules || property.rules.length === 0) && <li className="text-surface-500">No rules</li>}
        </ul>
      </section>
    </div>
  );
}
