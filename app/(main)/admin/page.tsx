import { apiFetch } from "@/lib/api-client";
import AdminCompletionsClient from "@/components/AdminCompletionsClient";
import BoardClient from "@/components/BoardClient";
import PeopleClient from "@/components/PeopleClient";
import { Completion, Job, Person } from "@/lib/types";

export default async function AdminPage() {
  const [peopleRes, jobsRes, completionsRes] = await Promise.all([
    apiFetch("/api/people"),
    apiFetch("/api/jobs"),
    apiFetch("/api/completions"),
  ]);

  const people: Person[] = await peopleRes.json();
  const jobs: Job[] = await jobsRes.json();
  const completions: Completion[] = await completionsRes.json();
  const unpaidCompletions = completions.filter((c) => c.settlement_id === null);

  return (
    <div>
      <h1>管理者モード</h1>
      <p className="muted">仕事の内容や、間違えて登録した完了記録・メンバー情報を修正できます。</p>

      <AdminCompletionsClient initialCompletions={unpaidCompletions} people={people} />

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "2px dashed var(--border)" }} />
      <BoardClient initialJobs={jobs} heading="仕事の管理" />

      <hr style={{ margin: "2rem 0", border: "none", borderTop: "2px dashed var(--border)" }} />
      <PeopleClient initialPeople={people} heading="メンバー管理" />
    </div>
  );
}
