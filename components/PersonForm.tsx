"use client";

import { useState } from "react";
import { Role, ROLE_LABEL } from "@/lib/types";

export default function PersonForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: { name: string; role: Role }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("child");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("なまえを入力してください");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), role });
    } catch {
      setError("保存に失敗しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">なまえ</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="role">やくわり</label>
      <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>

      {error && <p className="error-text">{error}</p>}

      <div className="row">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "保存中..." : "保存する"}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  );
}
