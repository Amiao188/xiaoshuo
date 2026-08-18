export async function ensureSiteSettingsTable(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}

export async function getSupportQr(env) {
  await ensureSiteSettingsTable(env);
  const row = await env.DB.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'support_qr'").first();
  return row?.setting_value || null;
}

export async function setSupportQr(env, value) {
  await ensureSiteSettingsTable(env);
  await env.DB.prepare("INSERT INTO site_settings (setting_key, setting_value, updated_at) VALUES ('support_qr', ?, CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP").bind(value).run();
}

export async function removeSupportQr(env) {
  await ensureSiteSettingsTable(env);
  await env.DB.prepare("DELETE FROM site_settings WHERE setting_key = 'support_qr'").run();
}
