import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import PersonDetailClient from "@/components/PersonDetailClient";
import { Completion, Job, Person, Settlement } from "@/lib/types";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;

  const [peopleRes, completionsRes, settlementsRes, jobsRes] = await Promise.all([
    apiFetch("/api/people"),
    apiFetch(`/api/completions?person_id=${personId}`),
    apiFetch(`/api/settlements?person_id=${personId}`),
    apiFetch("/api/jobs"),
  ]);

  const people: Person[] = await peopleRes.json();
  const person = people.find((p) => String(p.id) === personId);
  if (!person) notFound();

  const completions: Completion[] = await completionsRes.json();
  const settlements: Settlement[] = await settlementsRes.json();
  const jobs: Job[] = await jobsRes.json();

  return (
    <PersonDetailClient
      person={person}
      initialCompletions={completions}
      initialSettlements={settlements}
      jobs={jobs}
    />
  );
}
