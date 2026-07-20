export type Role = "father" | "mother" | "child";

export const ROLE_LABEL: Record<Role, string> = {
  father: "父",
  mother: "母",
  child: "子ども",
};

export const DAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

export interface Person {
  id: number;
  name: string;
  role: Role;
  balance_yen: number;
}

export interface Job {
  id: number;
  title: string;
  salary_yen: number;
  description: string | null;
  days_of_week: number[];
  is_active: boolean;
}

export interface Completion {
  id: number;
  person_id: number;
  job_id: number;
  job_title_snapshot: string;
  salary_yen_snapshot: number;
  completed_on: string;
  settlement_id: number | null;
  created_at: string;
}

export interface Settlement {
  id: number;
  person_id: number;
  total_yen: number;
  settled_at: string;
}
