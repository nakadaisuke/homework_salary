import { apiFetch } from "@/lib/api-client";
import BoardClient from "@/components/BoardClient";
import { Job } from "@/lib/types";

export default async function BoardPage() {
  const jobsRes = await apiFetch("/api/jobs");
  const jobs: Job[] = await jobsRes.json();

  return <BoardClient initialJobs={jobs} />;
}
