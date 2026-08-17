import { json, requireAdmin } from "../../_lib/auth.js";
import { ensureAnalyticsTable } from "../../_lib/extras.js";

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  await ensureAnalyticsTable(env);
  const days = (await env.DB.prepare("SELECT visit_date, COUNT(*) AS visitors FROM daily_unique_visitors GROUP BY visit_date ORDER BY visit_date DESC LIMIT 30").all()).results || [];
  return json({ days });
}
