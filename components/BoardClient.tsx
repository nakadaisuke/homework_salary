"use client";

import { useState } from "react";
import { Job, Person } from "@/lib/types";
import JobCard from "@/components/JobCard";
import JobForm from "@/components/JobForm";

export default function BoardClient({
  initialJobs,
  people,
}: {
  initialJobs: Job[];
  people: Person[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCreate(values: Omit<Job, "id" | "is_active">) {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("failed");
    const job: Job = await res.json();
    setJobs((prev) => [...prev, job]);
    setCreating(false);
  }

  async function handleUpdate(id: number, values: Partial<Job>) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("failed");
    const job: Job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === id ? job : j)));
  }

  async function handleDelete(id: number) {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function handleComplete(job: Job, personId: number) {
    const res = await fetch("/api/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: personId, job_id: job.id }),
    });
    if (!res.ok) {
      showToast("登録に失敗しました");
      return;
    }
    const person = people.find((p) => p.id === personId);
    showToast(`${person?.name ?? "だれか"}に¥${job.salary_yen.toLocaleString()}加算しました`);
  }

  return (
    <div>
      <div className="row">
        <h1>求人ボード</h1>
        {!creating && (
          <button className="button" onClick={() => setCreating(true)}>
            ＋ 仕事をつくる
          </button>
        )}
      </div>

      {creating && (
        <div className="card">
          <JobForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />
        </div>
      )}

      {people.length === 0 && (
        <p className="muted">
          まだメンバーが登録されていません。「メンバー」ページから追加してください。
        </p>
      )}

      <div className="card-grid">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            people={people}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onComplete={(personId) => handleComplete(job, personId)}
          />
        ))}
        {jobs.length === 0 && !creating && <p className="muted">まだ仕事がありません。</p>}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
