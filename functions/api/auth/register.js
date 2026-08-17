import { json, passwordHash, sessionResponse } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { username = "", password = "" } = await request.json().catch(() => ({}));
  const normalizedUsername = username.trim().toLowerCase();
  const length = Array.from(normalizedUsername).length;
  if (length < 2 || length > 14 || !/^[\u4e00-\u9fffA-Za-z0-9_-]+$/.test(normalizedUsername)) return json({ error: "用户名只能使用中文、字母、数字、下划线或横线，长度为 2 到 14 位。" }, 400);
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return json({ error: "密码至少 8 位，并且同时包含字母和数字。" }, 400);
  if (await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(normalizedUsername).first()) return json({ error: "这个用户名已经被使用。" }, 409);
  const firstUser = (await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first()).count === 0;
  const { salt, hash } = await passwordHash(password);
  // The existing email column acts as the account identifier so current accounts remain valid.
  const user = { id: crypto.randomUUID(), email: normalizedUsername, role: firstUser ? "admin" : "reader" };
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)").bind(user.id, user.email, hash, salt, user.role).run();
  return sessionResponse(user, env);
}
