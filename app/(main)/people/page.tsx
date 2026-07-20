import { apiFetch } from "@/lib/api-client";
import PeopleClient from "@/components/PeopleClient";
import { Person } from "@/lib/types";

export default async function PeoplePage() {
  const res = await apiFetch("/api/people");
  const people: Person[] = await res.json();

  return <PeopleClient initialPeople={people} />;
}
