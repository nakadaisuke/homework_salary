"use client";

import { useMemo, useState } from "react";
import { Completion, DAY_LABEL, Job, Person, ROLE_LABEL, Settlement } from "@/lib/types";
import BalanceBadge from "@/components/BalanceBadge";
import CompletionHistoryTable from "@/components/CompletionHistoryTable";

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function PersonDetailClient({
  person,
  initialCompletions,
  initialSettlements,
  jobs,
}: {
  person: Person;
  initialCompletions: Completion[];
  initialSettlements: Settlement[];
  jobs: Job[];
}) {
  const [completions, setCompletions] = useState(initialCompletions);
  const [settlements, setSettlements] = useState(initialSettlements);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);
  const [completedOn, setCompletedOn] = useState(todayISO());
  const [logging, setLogging] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const unpaid = useMemo(
    () => completions.filter((c) => c.settlement_id === null),
    [completions]
  );
  const unpaidTotal = unpaid.reduce((sum, c) => sum + c.salary_yen_snapshot, 0);

  const settledGroups = useMemo(
    () =>
      settlements.map((s) => ({
        settlement: s,
        completions: completions.filter((c) => c.settlement_id === s.id),
      })),
    [settlements, completions]
  );

  function toggleJob(id: number) {
    setSelectedJobIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleLogWork() {
    if (selectedJobIds.length === 0) return;
    setLogging(true);
    setLogMessage(null);
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: person.id,
          job_ids: selectedJobIds,
          completed_on: completedOn,
        }),
      });
      if (!res.ok) {
        setLogMessage("登録に失敗しました");
        return;
      }
      const { completions: created }: { completions: Completion[] } = await res.json();
      setCompletions((prev) => [...created, ...prev]);
      const total = created.reduce((sum, c) => sum + c.salary_yen_snapshot, 0);
      setLogMessage(`${created.length}件の仕事を登録しました（+¥${total.toLocaleString()}）`);
      setSelectedJobIds([]);
    } finally {
      setLogging(false);
    }
  }

  async function handleSettle() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: person.id }),
      });
      if (!res.ok) {
        setError("精算に失敗しました");
        return;
      }
      const settlement: Settlement = await res.json();
      setSettlements((prev) => [settlement, ...prev]);
      setCompletions((prev) =>
        prev.map((c) => (c.settlement_id === null ? { ...c, settlement_id: settlement.id } : c))
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="row">
        <h1>
          {person.name} <span className="badge">{ROLE_LABEL[person.role]}</span>
        </h1>
        <BalanceBadge yen={unpaidTotal} />
      </div>

      <div className="card">
        <div className="muted" style={{ marginBottom: "0.5rem" }}>
          仕事を記録する
        </div>
        {jobs.length === 0 ? (
          <p className="muted">まだ仕事がありません。求人ボードから作成してください。</p>
        ) : (
          <>
            <div className="card-grid" style={{ gap: "0.5rem" }}>
              {jobs.map((job) => (
                <label key={job.id} className="row" style={{ cursor: "pointer" }}>
                  <span className="row" style={{ gap: "0.5rem", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={selectedJobIds.includes(job.id)}
                      onChange={() => toggleJob(job.id)}
                    />
                    <strong>{job.title}</strong>
                    <span className="badge badge-money">¥{job.salary_yen.toLocaleString()}</span>
                    {job.days_of_week.map((d) => (
                      <span key={d} className="badge">
                        {DAY_LABEL[d]}
                      </span>
                    ))}
                  </span>
                </label>
              ))}
            </div>

            <div className="row" style={{ marginTop: "0.8rem" }}>
              <input
                type="date"
                value={completedOn}
                onChange={(e) => setCompletedOn(e.target.value)}
              />
              <button
                className="button"
                disabled={logging || selectedJobIds.length === 0}
                onClick={handleLogWork}
              >
                {logging ? "登録中..." : "仕事をした！"}
              </button>
            </div>
            {logMessage && <p className="muted">{logMessage}</p>}
          </>
        )}
      </div>

      <div className="card row">
        <div>
          <div className="muted">現在の未精算残高</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>¥{unpaidTotal.toLocaleString()}</div>
        </div>
        <button className="button" disabled={pending || unpaidTotal <= 0} onClick={handleSettle}>
          {pending ? "処理中..." : "もらった！"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      <CompletionHistoryTable unpaid={unpaid} settledGroups={settledGroups} />
    </div>
  );
}
