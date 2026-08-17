import { json, requireAdmin } from "../../_lib/auth.js";
import { isAllowedTag } from "../../_lib/catalog.js";

function metadata(name) {
  const stem = name.replace(/\.txt$/i, "").trim();
  const parts = stem.split("__").map(item => item.trim());
  if (parts.length > 1) return { title: parts[0] || "未命名故事", author: parts[1] || "佚名" };
  const space = stem.lastIndexOf(" ");
  return space > 0 ? { title: stem.slice(0, space), author: stem.slice(space + 1) } : { title: stem || "未命名故事", author: "佚名" };
}

function contentParts(text) { return text.split(/\r?\n\s*\r?\n/).map(item => item.trim()).filter(Boolean); }

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  const rows = (await env.DB.prepare("SELECT id, title, author, tag, publish_date, status, created_at FROM stories ORDER BY publish_date DESC, created_at DESC").all()).results || [];
  return json({ stories: rows });
}

export async function onRequestPost({ request, env }) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "没有管理权限。" }, 403);
  const { date, files } = await request.json().catch(() => ({}));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return json({ error: "请选择发布日期。" }, 400);
  if (!Array.isArray(files) || files.length < 1 || files.length > 200) return json({ error: "每次请上传 1 到 200 个 TXT 文件。" }, 400);
  const statements = [];
  for (const file of files) {
    const content = contentParts(String(file.text || ""));
    if (!content.length) continue;
    const info = metadata(String(file.name || "未命名故事.txt"));
    const tag = String(file.tag || "").trim();
    if (!isAllowedTag(tag)) return json({ error: `《${info.title}》没有选择有效标签。` }, 400);
    // The legacy minutes column remains for database compatibility but is no longer used.
    statements.push(env.DB.prepare("INSERT INTO stories (id, title, author, tag, publish_date, minutes, content_json, status, created_by) VALUES (?, ?, ?, ?, ?, 0, ?, 'published', ?)").bind(crypto.randomUUID(), info.title, info.author, tag, date, JSON.stringify(content), user.id));
  }
  if (!statements.length) return json({ error: "没有可发布的有效文本。" }, 400);
  await env.DB.batch(statements);
  return json({ count: statements.length });
}

export async function onRequestDelete({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  const date = new URL(request.url).searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "请选择要删除的日期。" }, 400);
  const result = await env.DB.prepare("DELETE FROM stories WHERE publish_date = ?").bind(date).run();
  return json({ deleted: result.meta?.changes || 0 });
}
