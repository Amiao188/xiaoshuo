export async function ensureCommunityTables(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS messages_created_at ON messages(created_at DESC)").run();
}

export async function ensureAnalyticsTable(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS daily_unique_visitors (visit_date TEXT NOT NULL, visitor_key TEXT NOT NULL, PRIMARY KEY (visit_date, visitor_key))").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS daily_unique_visitors_date ON daily_unique_visitors(visit_date DESC)").run();
}

export function chinaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
