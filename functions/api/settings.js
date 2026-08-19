import { json } from "../_lib/auth.js";
import { getDeveloperNote, getSupportQr } from "../_lib/settings.js";

export async function onRequestGet({ env }) {
  return json({ developerNote: await getDeveloperNote(env), hasSupportQr: Boolean(await getSupportQr(env)) });
}
