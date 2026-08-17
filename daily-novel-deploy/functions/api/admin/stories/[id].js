import { json, requireAdmin } from "../../../_lib/auth.js";

export async function onRequestDelete({ request, env, params }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  await env.DB.prepare("UPDATE stories SET status = 'hidden' WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
