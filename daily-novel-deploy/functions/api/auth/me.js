import { currentUser, json } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) { return json({ user: await currentUser(request, env) }); }
