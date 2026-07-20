import { Completion, Settlement } from "@/lib/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompletionHistoryTable({
  unpaid,
  settledGroups,
}: {
  unpaid: Completion[];
  settledGroups: { settlement: Settlement; completions: Completion[] }[];
}) {
  return (
    <div>
      {unpaid.length > 0 && (
        <div className="history-group">
          <div className="history-group-title">未精算</div>
          {unpaid.map((c) => (
            <div key={c.id} className="history-row">
              <span>
                {c.completed_on} {c.job_title_snapshot}
              </span>
              <span>¥{c.salary_yen_snapshot.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {settledGroups.map(({ settlement, completions }) => (
        <div key={settlement.id} className="history-group">
          <div className="history-group-title">
            {formatDateTime(settlement.settled_at)} 精算済み（¥{settlement.total_yen.toLocaleString()}）
          </div>
          {completions.map((c) => (
            <div key={c.id} className="history-row">
              <span>
                {c.completed_on} {c.job_title_snapshot}
              </span>
              <span>¥{c.salary_yen_snapshot.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ))}

      {unpaid.length === 0 && settledGroups.length === 0 && (
        <p className="muted">まだ履歴がありません。</p>
      )}
    </div>
  );
}
