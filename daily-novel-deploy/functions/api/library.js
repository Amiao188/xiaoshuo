import { json } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const storyId = new URL(request.url).searchParams.get("storyId");
  if (storyId) {
    const row = await env.DB.prepare("SELECT id, title, author, tag, publish_date, content_json FROM stories WHERE id = ? AND status = 'published'").bind(storyId).first();
    if (!row) return json({ error: "小说不存在或已下架。" }, 404);
    return json({ story: { ...row, content: JSON.parse(row.content_json) } });
  }
  const rows = (await env.DB.prepare("SELECT id, title, author, tag, publish_date FROM stories WHERE status = 'published' ORDER BY publish_date DESC, created_at DESC").all()).results || [];
  const grouped = {};
  for (const row of rows) (grouped[row.publish_date] ||= []).push(row);
  const dates = Object.entries(grouped).map(([date, stories], index) => ({ date, count: stories.length, note: index === 0 ? "今天更新" : "已归档" }));
  return json({ dates, stories: grouped });
}
