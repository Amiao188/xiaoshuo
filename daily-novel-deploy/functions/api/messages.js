import { currentUser, json } from "../_lib/auth.js";
import { ensureCommunityTables } from "../_lib/extras.js";

export async function onRequestGet({ env }) {
  await ensureCommunityTables(env);
  const rows = (await env.DB.prepare("SELECT messages.id, messages.body, messages.created_at, users.email AS author FROM messages JOIN users ON users.id = messages.user_id ORDER BY messages.created_at DESC LIMIT 80").all()).results || [];
  return json({ messages: rows });
}

export async function onRequestPost({ request, env }) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "请先登录后再留言。" }, 401);
  const { body = "" } = await request.json().catch(() => ({}));
  const message = String(body).trim();
  if (!message || message.length > 500) return json({ error: "留言需要 1 到 500 个字符。" }, 400);
  await ensureCommunityTables(env);
  await env.DB.prepare("INSERT INTO messages (id, user_id, body) VALUES (?, ?, ?)").bind(crypto.randomUUID(), user.id, message).run();
  return json({ ok: true });
}
