"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import JobCard from "@/components/JobCard";
import JobForm from "@/components/JobForm";

export default function BoardClient({
  initialJobs,
  heading = "職業Book",
}: {
  initialJobs: Job[];
  heading?: string;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [creating, setCreating] = useState(false);

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

  return (
    <div>
      <div className="row">
        <h1>{heading}</h1>
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

      <div className="card-grid-board">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}
        {jobs.length === 0 && !creating && <p className="muted">まだ仕事がありません。</p>}
      </div>
    </div>
  );
}
