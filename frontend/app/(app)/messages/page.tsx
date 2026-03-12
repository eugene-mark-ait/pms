"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EmptyState from "@/components/EmptyState";

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
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Messages</h1>
      {loading ? (
        <p className="text-surface-500 dark:text-surface-400">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {list.map((m) => (
            <div key={m.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {m.sender?.email} → {m.recipient?.email} · {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-surface-900 dark:text-surface-100">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
