"use client";

import Link from "next/link";
import { useState } from "react";
import { Person, ROLE_LABEL } from "@/lib/types";
import BalanceBadge from "@/components/BalanceBadge";

export default function PersonCard({
  person,
  onDelete,
}: {
  person: Person;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="card">
      <div className="row">
        <Link href={`/people/${person.id}`} className="person-link" style={{ flex: 1 }}>
          <div className="row">
            <div>
              <strong>{person.name}</strong> <span className="badge">{ROLE_LABEL[person.role]}</span>
            </div>
            <BalanceBadge yen={person.balance_yen} />
          </div>
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
    </div>
  );
}
