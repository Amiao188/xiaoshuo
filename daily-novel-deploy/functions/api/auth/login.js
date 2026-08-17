import { json, passwordHash, sessionResponse } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { email = "", password = "" } = await request.json().catch(() => ({}));
  const user = await env.DB.prepare("SELECT id, email, password_hash, password_salt, role FROM users WHERE email = ?").bind(email.trim().toLowerCase()).first();
  if (!user) return json({ error: "邮箱或密码不正确。" }, 401);
  const { hash } = await passwordHash(password, user.password_salt);
  if (hash !== user.password_hash) return json({ error: "邮箱或密码不正确。" }, 401);
  return sessionResponse(user, env);
}
