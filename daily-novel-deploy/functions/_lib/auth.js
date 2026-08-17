const encoder = new TextEncoder();

export const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=UTF-8", ...headers } });

function toHex(bytes) { return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join(""); }
async function sha256(value) { return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
export const tokenHash = sha256;

export async function passwordHash(password, salt = toHex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" }, key, 256);
  return { salt, hash: toHex(bits) };
}

export function parseCookies(request) {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map(item => item.trim().split("=")).filter(([key]) => key));
}

export async function currentUser(request, env) {
  const token = parseCookies(request).novel_session;
  if (!token) return null;
  const row = await env.DB.prepare("SELECT users.id, users.email, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?").bind(await sha256(token), new Date().toISOString()).first();
  return row || null;
}

export async function requireAdmin(request, env) {
  const user = await currentUser(request, env);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function sessionResponse(user, env) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), user.id, await sha256(token), expiresAt).run();
  return json({ user: { id: user.id, email: user.email, role: user.role } }, 200, { "set-cookie": `novel_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` });
}

export const clearSession = () => json({ ok: true }, 200, { "set-cookie": "novel_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
