import { json, requireAdmin } from "../../_lib/auth.js";
import { ensureCommunityTables } from "../../_lib/extras.js";

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  await ensureCommunityTables(env);
  await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
