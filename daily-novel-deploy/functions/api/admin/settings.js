import { json, requireAdmin } from "../../_lib/auth.js";
import { getSupportQr, removeSupportQr, setSupportQr } from "../../_lib/settings.js";

const MAX_IMAGE_BYTES = 1024 * 1024;
const imagePattern = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  return json({ supportQr: await getSupportQr(env) });
}

export async function onRequestPut({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  const { imageData } = await request.json().catch(() => ({}));
  const match = imagePattern.exec(String(imageData || ""));
  if (!match) return json({ error: "请上传 PNG、JPG、WebP 或 GIF 格式的收款码。" }, 400);
  const imageBytes = Math.floor(match[2].length * 3 / 4);
  if (imageBytes > MAX_IMAGE_BYTES) return json({ error: "收款码图片不能超过 1 MB。" }, 400);
  await setSupportQr(env, imageData);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  await removeSupportQr(env);
  return json({ ok: true });
}
