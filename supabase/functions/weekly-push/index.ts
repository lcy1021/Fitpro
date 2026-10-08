// Trigger on Mondays at 09:00 Asia/Shanghai. Push copy never contains private health data.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const secret = Deno.env.get("WEEKLY_PUSH_SECRET") || "";
const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const subject = Deno.env.get("VAPID_SUBJECT") || "";
if (publicKey && privateKey && subject) webpush.setVapidDetails(subject, publicKey, privateKey);
function currentMonday() { const parts = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); const d = new Date(parts + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"}).format(d); }
Deno.serve(async req => {
  if (req.method !== "POST") return new Response("method", {status: 405});
  if (!secret || req.headers.get("x-weekly-push-secret") !== secret) return new Response("forbidden", {status: 403});
  if (!publicKey || !privateKey || !subject) return new Response("vapid_missing", {status: 503});
  const weekStart = currentMonday();
  const {data: subscriptions, error} = await db.from("fl_push_subscriptions").select("endpoint,user_id,p256dh,auth_secret").eq("enabled", true);
  if (error) return new Response("db_error", {status: 500});
  const ids = [...new Set((subscriptions || []).map(x => x.user_id))];
  const reviews = ids.length ? await db.from("fl_coach_weeks").select("user_id,body").eq("week_start", weekStart).in("user_id", ids) : {data: [], error: null};
  if (reviews.error) return new Response("db_error", {status: 500});
  const reviewed = new Set((reviews.data || []).filter(x => x.body?.reviewedAt).map(x => x.user_id));
  let sent = 0, failed = 0;
  for (const s of subscriptions || []) {
    if (reviewed.has(s.user_id)) continue;
    try {
      await webpush.sendNotification({endpoint: s.endpoint, keys: {p256dh: s.p256dh, auth: s.auth_secret}}, JSON.stringify({title: "新的一周，和健康伙伴确认计划", body: "看看这周的状态，决定是否调整计划。", url: "./"}), {TTL: 86400, urgency: "normal"});
      sent++;
    } catch (e) {
      failed++;
      if ((e as {statusCode?: number}).statusCode === 404 || (e as {statusCode?: number}).statusCode === 410) await db.from("fl_push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }
  return new Response(JSON.stringify({weekStart, sent, failed}), {headers: {"Content-Type": "application/json"}});
});
