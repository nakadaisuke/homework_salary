"use client";

import { useState } from "react";
import { DAY_LABEL, Job } from "@/lib/types";
import JobForm from "@/components/JobForm";

export default function JobCard({
  job,
  onUpdate,
  onDelete,
}: {
  job: Job;
  onUpdate: (id: number, values: Partial<Job>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="card">
        <JobForm
          initial={job}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(job.id, values);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row">
        <div>
          <strong>{job.title}</strong>{" "}
          <span className="badge badge-money">¥{job.salary_yen.toLocaleString()}</span>
        </div>
        <div className="row" style={{ gap: "0.4rem" }}>
          <button className="button button-secondary button-small" onClick={() => setEditing(true)}>
            編集
          </button>
          <button className="button button-danger button-small" onClick={() => onDelete(job.id)}>
            削除
          </button>
        </div>
      </div>

      {job.description && <p className="muted">{job.description}</p>}

      {job.days_of_week.length > 0 && (
        <div className="day-picker">
          {job.days_of_week.map((d) => (
            <span key={d} className="badge">
              {DAY_LABEL[d]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
