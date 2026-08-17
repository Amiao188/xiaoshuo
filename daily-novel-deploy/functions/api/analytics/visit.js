import { currentUser, json, parseCookies } from "../../_lib/auth.js";
import { chinaDate, ensureAnalyticsTable } from "../../_lib/extras.js";

export async function onRequestPost({ request, env }) {
  await ensureAnalyticsTable(env);
  const user = await currentUser(request, env);
  const visitorId = parseCookies(request).novel_visitor;
  if (user?.role === "admin") {
    if (/^[a-f0-9-]{36}$/i.test(visitorId || "")) await env.DB.prepare("DELETE FROM daily_unique_visitors WHERE visit_date = ? AND visitor_key = ?").bind(chinaDate(), `browser:${visitorId}`).run();
    return json({ ok: true, counted: false });
  }

  let stableVisitorId = visitorId;
  const headers = {};
  if (!user && !/^[a-f0-9-]{36}$/i.test(stableVisitorId || "")) {
    stableVisitorId = crypto.randomUUID();
    headers["set-cookie"] = `novel_visitor=${stableVisitorId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
  }
  if (user && /^[a-f0-9-]{36}$/i.test(stableVisitorId || "")) await env.DB.prepare("DELETE FROM daily_unique_visitors WHERE visit_date = ? AND visitor_key = ?").bind(chinaDate(), `browser:${stableVisitorId}`).run();
  const visitorKey = user ? `user:${user.id}` : `browser:${stableVisitorId}`;
  await env.DB.prepare("INSERT OR IGNORE INTO daily_unique_visitors (visit_date, visitor_key) VALUES (?, ?)").bind(chinaDate(), visitorKey).run();
  return json({ ok: true, counted: true }, 200, headers);
}
