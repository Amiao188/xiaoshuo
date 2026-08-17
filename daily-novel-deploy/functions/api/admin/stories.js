import { json, requireAdmin } from "../../_lib/auth.js";

function metadata(name) {
  const stem = name.replace(/\.txt$/i, "").trim();
  const parts = stem.split("__").map(item => item.trim());
  if (parts.length > 1) return { title: parts[0] || "未命名故事", author: parts[1] || "佚名", tag: parts[2] || "未分类" };
  const space = stem.lastIndexOf(" ");
  return space > 0 ? { title: stem.slice(0, space), author: stem.slice(space + 1), tag: "未分类" } : { title: stem || "未命名故事", author: "佚名", tag: "未分类" };
}

function contentParts(text) { return text.split(/\r?\n\s*\r?\n/).map(item => item.trim()).filter(Boolean); }

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  const rows = (await env.DB.prepare("SELECT id, title, author, tag, publish_date, minutes, status, created_at FROM stories ORDER BY publish_date DESC, created_at DESC").all()).results || [];
  return json({ stories: rows });
}

export async function onRequestPost({ request, env }) {
  const user = await requireAdmin(request, env);
  if (!user) return json({ error: "没有管理权限。" }, 403);
  const { date, files } = await request.json().catch(() => ({}));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return json({ error: "请选择发布日期。" }, 400);
  if (!Array.isArray(files) || files.length < 1 || files.length > 120) return json({ error: "每次请上传 1 到 120 个 TXT 文件。" }, 400);
  const statements = [];
  for (const file of files) {
    const content = contentParts(String(file.text || ""));
    if (!content.length) continue;
    const info = metadata(String(file.name || "未命名故事.txt"));
    const minutes = Math.max(1, Math.round(content.join("").length / 350));
    statements.push(env.DB.prepare("INSERT INTO stories (id, title, author, tag, publish_date, minutes, content_json, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)").bind(crypto.randomUUID(), info.title, info.author, info.tag, date, minutes, JSON.stringify(content), user.id));
  }
  if (!statements.length) return json({ error: "没有可发布的有效文本。" }, 400);
  await env.DB.batch(statements);
  return json({ count: statements.length });
}
