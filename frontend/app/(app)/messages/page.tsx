"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Message {
  id: string;
  body: string;
  sender: { email: string };
  recipient: { email: string };
  created_at: string;
}

export default function MessagesPage() {
  const [list, setList] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Message[] | { results: Message[] }>("/messages/").then((res) => {
      const data = res.data;
      setList(Array.isArray(data) ? data : data.results ?? []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Messages</h1>
      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-surface-600">No messages.</p>
      ) : (
        <div className="space-y-4">
          {list.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-surface-200 p-4">
              <p className="text-sm text-surface-500">
                {m.sender?.email} → {m.recipient?.email} · {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-surface-900">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
