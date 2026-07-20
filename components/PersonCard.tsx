"use client";

import Link from "next/link";
import { useState } from "react";
import { Person, ROLE_LABEL } from "@/lib/types";
import PersonForm from "@/components/PersonForm";

export default function PersonCard({
  person,
  onUpdate,
  onDelete,
}: {
  person: Person;
  onUpdate: (id: number, values: Partial<Person>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const lifetimeTotal = person.balance_yen + person.settled_total_yen;

  if (editing) {
    return (
      <div className="card">
        <PersonForm
          initial={person}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(person.id, values);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row">
        <Link href={`/people/${person.id}`} className="person-link" style={{ flex: 1 }}>
          <strong>{person.name}</strong> <span className="badge">{ROLE_LABEL[person.role]}</span>
        </Link>
        <div className="row" style={{ gap: "0.4rem" }}>
          <button className="button button-secondary button-small" onClick={() => setEditing(true)}>
            編集
          </button>
          <button
            className="button button-danger button-small"
            disabled={deleting}
            onClick={async () => {
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
