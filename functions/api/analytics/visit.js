import { json } from "../../_lib/auth.js";
import { chinaDate, ensureAnalyticsTable } from "../../_lib/extras.js";

export async function onRequestPost({ env }) {
  await ensureAnalyticsTable(env);
  await env.DB.prepare("INSERT INTO daily_visits (visit_date, visits) VALUES (?, 1) ON CONFLICT(visit_date) DO UPDATE SET visits = visits + 1").bind(chinaDate()).run();
  return json({ ok: true });
}
