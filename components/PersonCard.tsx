"use client";

import Link from "next/link";
import { useState } from "react";
import { Person, ROLE_LABEL } from "@/lib/types";

export default function PersonCard({
  person,
  onDelete,
}: {
  person: Person;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const lifetimeTotal = person.balance_yen + person.settled_total_yen;

  return (
    <div className="card">
      <div className="row">
        <Link href={`/people/${person.id}`} className="person-link" style={{ flex: 1 }}>
          <strong>{person.name}</strong> <span className="badge">{ROLE_LABEL[person.role]}</span>
        </Link>
        <button
          className="button button-danger button-small"
          disabled={deleting}
          onClick={async (e) => {
            e.preventDefault();
            setDeleting(true);
            try {
              await onDelete(person.id);
            } finally {
              setDeleting(false);
            }
          }}
        >
          削除
        </button>
      </div>

      <Link href={`/people/${person.id}`} className="person-link">
        <div className="row" style={{ marginTop: "0.6rem", gap: "1.5rem" }}>
          <div>
            <div className="muted">未精算</div>
            <div style={{ fontWeight: 800 }}>¥{person.balance_yen.toLocaleString()}</div>
          </div>
          <div>
            <div className="muted">受取済み合計</div>
            <div style={{ fontWeight: 800 }}>¥{person.settled_total_yen.toLocaleString()}</div>
          </div>
          <div>
            <div className="muted">生涯累計</div>
            <div style={{ fontWeight: 800 }}>¥{lifetimeTotal.toLocaleString()}</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
