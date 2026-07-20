"use client";

import { useState } from "react";
import { Completion, Person } from "@/lib/types";

export default function AdminCompletionsClient({
  initialCompletions,
  people,
}: {
  initialCompletions: Completion[];
  people: Person[];
}) {
  const [completions, setCompletions] = useState(initialCompletions);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function personName(id: number) {
    return people.find((p) => p.id === id)?.name ?? `#${id}`;
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/completions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "削除に失敗しました");
        return;
      }
      setCompletions((prev) => prev.filter((c) => c.id !== id));
      setConfirmingId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2>仕事の完了記録を削除</h2>
      <p className="muted">
        「もらった！」で精算する前の記録のみ削除できます。間違えて「仕事をした！」を押してしまった場合はここで取り消してください。
      </p>

      {error && <p className="error-text">{error}</p>}

      {completions.length === 0 ? (
        <p className="muted">未精算の完了記録はありません。</p>
      ) : (
        <div className="card-grid" style={{ gap: "0.5rem" }}>
          {completions.map((c) => (
            <div key={c.id} className="card row">
              <span>
                {c.completed_on} {personName(c.person_id)} 「{c.job_title_snapshot}」
                <span className="badge badge-money" style={{ marginLeft: "0.5rem" }}>
                  ¥{c.salary_yen_snapshot.toLocaleString()}
                </span>
              </span>
              {confirmingId === c.id ? (
                <span className="row" style={{ gap: "0.4rem" }}>
                  <button
                    className="button button-danger button-small"
                    disabled={deletingId === c.id}
                    onClick={() => handleDelete(c.id)}
                  >
                    {deletingId === c.id ? "削除中..." : "本当に削除する"}
                  </button>
                  <button
                    className="button button-secondary button-small"
                    onClick={() => setConfirmingId(null)}
                  >
                    やめる
                  </button>
                </span>
              ) : (
                <button
                  className="button button-danger button-small"
                  onClick={() => setConfirmingId(c.id)}
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
