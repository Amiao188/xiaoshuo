import { getSupportQr } from "../_lib/settings.js";

export async function onRequestGet({ env }) {
  const value = await getSupportQr(env);
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value || "");
  if (!match) return new Response(null, { status: 404 });
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new Response(bytes, { headers: { "content-type": match[1], "cache-control": "no-store" } });
}
