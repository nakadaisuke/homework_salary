"use client";

import { useState } from "react";
import { DAY_LABEL, Job } from "@/lib/types";

interface JobFormValues {
  title: string;
  salary_yen: number;
  description: string;
  days_of_week: number[];
}

export default function JobForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Job;
  onSubmit: (values: JobFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [salary, setSalary] = useState(String(initial?.salary_yen ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [days, setDays] = useState<number[]>(initial?.days_of_week ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const salaryYen = Number(salary);
    if (!title.trim() || !Number.isFinite(salaryYen) || salaryYen < 0) {
      setError("タイトルと給与（0以上の数字）を入力してください");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        salary_yen: Math.round(salaryYen),
        description: description.trim(),
        days_of_week: days,
      });
    } catch {
      setError("保存に失敗しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">タイトル</label>
      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label htmlFor="salary">給与（円）</label>
      <input
        id="salary"
        type="number"
        min={0}
        step={1}
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
        required
      />

      <label htmlFor="description">説明</label>
      <textarea
        id="description"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label>働く曜日</label>
      <div className="day-picker">
        {DAY_LABEL.map((label, i) => (
          <span
            key={i}
            className="day-chip"
            data-active={days.includes(i)}
            onClick={() => toggleDay(i)}
          >
            {label}
          </span>
        ))}
      </div>

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
