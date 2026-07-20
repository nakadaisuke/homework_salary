"use client";

import { useState } from "react";
import { DAY_LABEL, Job, Person } from "@/lib/types";
import JobForm from "@/components/JobForm";

export default function JobCard({
  job,
  people,
  onUpdate,
  onDelete,
  onComplete,
}: {
  job: Job;
  people: Person[];
  onUpdate: (id: number, values: Partial<Job>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onComplete: (personId: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [personId, setPersonId] = useState<string>(people[0] ? String(people[0].id) : "");
  const [completing, setCompleting] = useState(false);

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
        <div className="row" style={{ gap: "0.3rem" }}>
          {job.days_of_week.map((d) => (
            <span key={d} className="badge">
              {DAY_LABEL[d]}
            </span>
          ))}
        </div>
      )}

      {people.length > 0 && (
        <div className="row" style={{ marginTop: "0.6rem" }}>
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="button"
            disabled={completing || !personId}
            onClick={async () => {
              setCompleting(true);
              try {
                await onComplete(Number(personId));
              } finally {
                setCompleting(false);
              }
            }}
          >
            {completing ? "登録中..." : "完了！"}
          </button>
        </div>
      )}
    </div>
  );
}
