import { apiFetch } from "@/lib/api-client";
import BoardClient from "@/components/BoardClient";
import { Job, Person } from "@/lib/types";

export default async function BoardPage() {
  const [jobsRes, peopleRes] = await Promise.all([
    apiFetch("/api/jobs"),
    apiFetch("/api/people"),
  ]);
  const jobs: Job[] = await jobsRes.json();
  const people: Person[] = await peopleRes.json();

  return <BoardClient initialJobs={jobs} people={people} />;
}
