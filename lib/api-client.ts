import { cookies, headers } from "next/headers";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const base = await getBaseUrl();
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      cookie: cookieStore.toString(),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}
