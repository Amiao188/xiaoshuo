import { json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const rows = (await env.DB.prepare("SELECT id, title, author, tag, publish_date, minutes, content_json FROM stories WHERE status = 'published' ORDER BY publish_date DESC, created_at DESC").all()).results || [];
  const grouped = {};
  for (const row of rows) (grouped[row.publish_date] ||= []).push({ ...row, content: JSON.parse(row.content_json) });
  const dates = Object.entries(grouped).map(([date, stories], index) => ({ date, count: stories.length, note: index === 0 ? "今天更新" : "已归档" }));
  return json({ dates, stories: grouped });
}
