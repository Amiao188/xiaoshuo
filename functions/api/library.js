import { json } from "../_lib/auth.js";
import { TAGS } from "../_lib/catalog.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const storyId = url.searchParams.get("storyId");
  if (storyId) {
    const row = await env.DB.prepare("SELECT id, title, author, tag, publish_date, content_json FROM stories WHERE id = ? AND status = 'published'").bind(storyId).first();
    if (!row) return json({ error: "小说不存在或已下架。" }, 404);
    return json({ story: { ...row, content: JSON.parse(row.content_json) } });
  }
  const date = url.searchParams.get("date");
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "日期格式不正确。" }, 400);
    const stories = (await env.DB.prepare("SELECT id, title, author, tag, publish_date FROM stories WHERE status = 'published' AND publish_date = ? ORDER BY created_at DESC").bind(date).all()).results || [];
    return json({ stories }, 200, { "cache-control": "public, max-age=30, s-maxage=60" });
  }
  const tag = url.searchParams.get("tag");
  if (tag) {
    if (!TAGS.includes(tag)) return json({ error: "小说类型不正确。" }, 400);
    const stories = (await env.DB.prepare("SELECT id, title, author, tag, publish_date FROM stories WHERE status = 'published' AND tag = ? ORDER BY publish_date DESC, created_at DESC").bind(tag).all()).results || [];
    return json({ stories }, 200, { "cache-control": "public, max-age=30, s-maxage=60" });
  }
  const [dateRows, featuredRows] = await env.DB.batch([
    env.DB.prepare("SELECT publish_date AS date, COUNT(*) AS count FROM stories WHERE status = 'published' GROUP BY publish_date ORDER BY publish_date DESC"),
    env.DB.prepare("SELECT id, title, author, tag, publish_date FROM stories WHERE status = 'published' ORDER BY publish_date DESC, created_at DESC LIMIT 3")
  ]);
  const dates = (dateRows.results || []).map((row, index) => ({ ...row, note: index === 0 ? "今天更新" : "已归档" }));
  return json({ dates, featured: featuredRows.results || [] }, 200, { "cache-control": "public, max-age=30, s-maxage=60" });
}
