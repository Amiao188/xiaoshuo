import { json } from "../_lib/auth.js";
import { getSupportQr } from "../_lib/settings.js";

export async function onRequestGet({ env }) {
  return json({ supportQr: await getSupportQr(env) });
}
