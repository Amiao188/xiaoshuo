import { clearSession, parseCookies, tokenHash } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const token = parseCookies(request).novel_session;
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await tokenHash(token)).run().catch(() => null);
  return clearSession();
}
