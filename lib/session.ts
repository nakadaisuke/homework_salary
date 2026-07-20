import { jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
