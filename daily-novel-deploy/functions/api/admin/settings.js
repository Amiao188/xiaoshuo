import { json, requireAdmin } from "../../_lib/auth.js";
import { getDeveloperNote, getSupportQr, removeDeveloperNote, removeSupportQr, setDeveloperNote, setSupportQr } from "../../_lib/settings.js";

const MAX_IMAGE_BYTES = 1024 * 1024;
const imagePattern = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  return json({ developerNote: await getDeveloperNote(env), supportQr: await getSupportQr(env) });
}

export async function onRequestPut({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  const { imageData, developerNote } = await request.json().catch(() => ({}));
  if (typeof developerNote !== "undefined") {
    const note = String(developerNote).trim();
    if (note.length > 1000) return json({ error: "开发者有话说最多 1000 字。" }, 400);
    if (note) await setDeveloperNote(env, note);
    else await removeDeveloperNote(env);
  }
  if (typeof imageData !== "undefined") {
    const match = imagePattern.exec(String(imageData || ""));
    if (!match) return json({ error: "请上传 PNG、JPG、WebP 或 GIF 格式的收款码。" }, 400);
    const imageBytes = Math.floor(match[2].length * 3 / 4);
    if (imageBytes > MAX_IMAGE_BYTES) return json({ error: "收款码图片不能超过 1 MB。" }, 400);
    await setSupportQr(env, imageData);
  }
  if (typeof imageData === "undefined" && typeof developerNote === "undefined") return json({ error: "没有需要保存的内容。" }, 400);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!await requireAdmin(request, env)) return json({ error: "没有管理权限。" }, 403);
  await removeSupportQr(env);
  return json({ ok: true });
}
