import { json, passwordHash, sessionResponse } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { email = "", password = "" } = await request.json().catch(() => ({}));
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return json({ error: "请输入有效邮箱。" }, 400);
  if (password.length < 8) return json({ error: "密码至少需要 8 位。" }, 400);
  if (await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(normalizedEmail).first()) return json({ error: "这个邮箱已经注册。" }, 409);
  const firstUser = (await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first()).count === 0;
  const { salt, hash } = await passwordHash(password);
  const user = { id: crypto.randomUUID(), email: normalizedEmail, role: firstUser ? "admin" : "reader" };
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)").bind(user.id, user.email, hash, salt, user.role).run();
  return sessionResponse(user, env);
}
