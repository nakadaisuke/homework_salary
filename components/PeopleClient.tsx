"use client";

import { useState } from "react";
import { Person, Role } from "@/lib/types";
import PersonCard from "@/components/PersonCard";
import PersonForm from "@/components/PersonForm";

export default function PeopleClient({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState(initialPeople);
  const [creating, setCreating] = useState(false);

  async function handleCreate(values: { name: string; role: Role }) {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("failed");
    const person: Person = await res.json();
    setPeople((prev) => [...prev, person]);
    setCreating(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="row">
        <h1>メンバー</h1>
        {!creating && (
          <button className="button" onClick={() => setCreating(true)}>
            ＋ メンバーをつくる
          </button>
        )}
      </div>

      {creating && (
        <div className="card">
          <PersonForm onCancel={() => setCreating(false)} onSubmit={handleCreate} />
        </div>
      )}

      <div className="card-grid">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} onDelete={handleDelete} />
        ))}
        {people.length === 0 && !creating && <p className="muted">まだメンバーがいません。</p>}
      </div>
    </div>
  );
}
