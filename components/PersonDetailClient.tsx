"use client";

import { useMemo, useState } from "react";
import { Completion, Person, ROLE_LABEL, Settlement } from "@/lib/types";
import BalanceBadge from "@/components/BalanceBadge";
import CompletionHistoryTable from "@/components/CompletionHistoryTable";

export default function PersonDetailClient({
  person,
  initialCompletions,
  initialSettlements,
}: {
  person: Person;
  initialCompletions: Completion[];
  initialSettlements: Settlement[];
}) {
  const [completions, setCompletions] = useState(initialCompletions);
  const [settlements, setSettlements] = useState(initialSettlements);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
