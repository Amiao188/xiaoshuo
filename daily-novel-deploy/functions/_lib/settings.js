export async function ensureSiteSettingsTable(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}

export async function getSupportQr(env) {
  return getSetting(env, "support_qr");
}

export async function setSupportQr(env, value) {
  await setSetting(env, "support_qr", value);
}

export async function removeSupportQr(env) {
  await removeSetting(env, "support_qr");
}

export async function getDeveloperNote(env) {
  return getSetting(env, "developer_note");
}

export async function setDeveloperNote(env, value) {
  await setSetting(env, "developer_note", value);
}

export async function removeDeveloperNote(env) {
  await removeSetting(env, "developer_note");
}

async function getSetting(env, key) {
  await ensureSiteSettingsTable(env);
  const row = await env.DB.prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?").bind(key).first();
  return row?.setting_value || null;
}

async function setSetting(env, key, value) {
  await ensureSiteSettingsTable(env);
  await env.DB.prepare("INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP").bind(key, value).run();
}

async function removeSetting(env, key) {
  await ensureSiteSettingsTable(env);
  await env.DB.prepare("DELETE FROM site_settings WHERE setting_key = ?").bind(key).run();
}
