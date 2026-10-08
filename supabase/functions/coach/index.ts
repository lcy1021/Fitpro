// Private coaching: authenticated user only. Secrets stay on the server.
const URL = Deno.env.get("SUPABASE_URL") || "";
let SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
try { SERVICE = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || SERVICE; } catch { /* use the legacy service key */ }
const adminHeaders = {apikey: SERVICE, ...(!SERVICE.startsWith("sb_secret_") ? {authorization: "Bearer " + SERVICE} : {})};
const origins = ["https://lcy1021.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];
const modes = new Set(["interpret", "plan", "weekly", "daily"]);
const keys = new Set(["A", "B", "W", "N", "REST"]);
const meals = ["breakfast", "lunch", "snack", "dinner"];
const version = "2026-10-08-speed";
const trim = (v: unknown, n = 500) => String(v ?? "").slice(0, n);
const monday = (date: Date) => { const d = new Date(date); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const weekDates = () => { const chinaDate = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); const start = new Date(monday(new Date(chinaDate + "T12:00:00Z")) + "T12:00:00Z"); return Array.from({length: 7}, (_, i) => { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); }); };
function cors(origin: string | null) { return {"Access-Control-Allow-Origin": origin && origins.includes(origin) ? origin : origins[0], "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin"}; }
function json(text: string): Record<string, unknown> | null {
  for (let start = text.indexOf("{"); start !== -1; start = text.indexOf("{", start + 1)) {
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < text.length; end++) {
      const char = text[end];
      if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; continue; }
      if (char === '"') quoted = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) {
        try { const value = JSON.parse(text.slice(start, end + 1)); if (value && typeof value === "object" && !Array.isArray(value)) return value; } catch { /* try the next object */ }
        break;
      }
    }
  }
  return null;
}
const system = `你是减脂与健身产品里的健康伙伴。用简洁、温和的中文帮助成年人整理目标与制定低风险计划。你不能诊断疾病，不能替代医生、营养师或康复师。经期不适、近期生病、疼痛、慢性病变化时，本周训练应暂缓或降低强度；疼痛和生病时建议休息并视情况咨询专业人员。不能建议极端节食、补偿性运动或快速减重。只返回 JSON 对象，不要代码块。interpret 模式返回 {"summary":"复述理解","suggestions":{"goals":[],"focus":[],"health":[],"frequency":"","duration":"","equipment":[],"diet":""}}；plan/weekly 模式返回 {"summary":"一句解释","plan":{"days":{"YYYY-MM-DD":"REST|A|B|W|N"},"mealSwaps":{"breakfast":"具体食物和份量","lunch":"具体食物和份量","snack":"具体食物和份量","dinner":"具体食物和份量"},"reason":"一句解释"}}；daily 模式返回 {"summary":"一句解释","choice":"original|short|rest"}。日期只用用户给出的本周七天。A/B 为哑铃训练，W 为居家臀腿训练，N 为无需器械的全身训练，REST 为休息。四餐建议必须写明具体食物和大致份量，照顾用户的饮食禁忌，兼有蛋白质、蔬果和适量主食，总量大致接近输入的 targetKcal；不要声称精确热量。不提供具体医疗或药物建议。`;
const quickSystem = `你是健身产品里的健康伙伴。用简短中文整理用户的话，不诊断疾病，不提供药物建议。只返回一个紧凑的 JSON 对象，不要解释或代码块。interpret 返回 {"summary":"一句复述","suggestions":{"goals":[],"focus":[],"health":[],"frequency":"","duration":"","equipment":[],"diet":""}}；daily 返回 {"summary":"一句建议","choice":"original|short|rest"}。疼痛、生病或经期不适时应降低强度或休息。`;
Deno.serve(async req => {
  const headers = {...cors(req.headers.get("origin")), "Content-Type": "application/json", "X-Coach-Version": version, "Access-Control-Expose-Headers": "X-Coach-Version"};
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers});
  if (req.method === "OPTIONS") return new Response(null, {headers});
  if (req.method !== "POST") return reply(405, {error: "method"});
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
  if (!jwt) return reply(401, {error: "sign_in_required"});
  if (!URL || !SERVICE) return reply(503, {error: "server_not_configured"});
  const authStarted = performance.now();
  let auth: {id?: string} | null = null;
  try {
    const response = await fetch(URL + "/auth/v1/user", {headers: {apikey: SERVICE, authorization: "Bearer " + jwt}, signal: AbortSignal.timeout(8000)});
    if (response.ok) auth = await response.json();
  } catch (error) { console.warn("coach auth error", error instanceof Error ? error.name : "unknown"); }
  console.info("coach auth timing", Math.round(performance.now() - authStarted));
  if (!auth?.id) return reply(401, {error: "invalid_session"});
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, {error: "bad_json"}); }
  const mode = trim(body.mode, 20), text = trim(body.text, 800);
  if (!modes.has(mode) || !text || JSON.stringify(body).length > 10000) return reply(400, {error: "bad_input"});
  const dataStarted = performance.now();
  let member: {person?: string} | null = null;
  try {
    const response = await fetch(URL + "/rest/v1/fl_members?select=person&user_id=eq." + encodeURIComponent(auth.id) + "&limit=1", {headers: adminHeaders, signal: AbortSignal.timeout(8000)});
    if (!response.ok) return reply(503, {error: "private_schema_unavailable"});
    member = (await response.json())[0] || null;
  } catch (error) { console.warn("coach member error", error instanceof Error ? error.name : "unknown"); return reply(503, {error: "private_schema_unavailable"}); }
  const hintedPerson = trim(body.person, 10);
  const person = member?.person || (["hus", "wife"].includes(hintedPerson) ? hintedPerson : null);
  if (!person) return reply(400, {error: "person_required"});
  let quota = false;
  try {
    const response = await fetch(URL + "/rest/v1/rpc/fl_coach_quota", {method: "POST", headers: {...adminHeaders, "content-type": "application/json"}, body: JSON.stringify({p_user: auth.id, p_limit: 30}), signal: AbortSignal.timeout(8000)});
    if (!response.ok) return reply(500, {error: "quota_check_failed"});
    quota = await response.json();
  } catch (error) { console.warn("coach quota error", error instanceof Error ? error.name : "unknown"); return reply(500, {error: "quota_check_failed"}); }
  console.info("coach data timing", mode, Math.round(performance.now() - dataStarted));
  if (quota !== true) return reply(429, {error: "daily_limit"});
  const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
  const week = weekDates();
  const userProfile = profile as Record<string, unknown>;
  const weight = Number(userProfile.weight), height = Number(userProfile.height), age = Number(userProfile.age);
  const valid = weight >= 30 && weight <= 200 && height >= 130 && height <= 210 && age >= 18 && age <= 80;
  const bmr = valid ? 10 * weight + 6.25 * height - 5 * age + (person === "hus" ? 5 : -161) : 0;
  const reducing = Array.isArray(userProfile.goals) && userProfile.goals.includes("减脂");
  const targetKcal = valid ? Math.round(Math.max(person === "hus" ? 1500 : 1200, bmr * 1.35 - (reducing ? 300 : 0)) / 10) * 10 : null;
  const quick = mode === "interpret" || mode === "daily";
  const quickProfile = Object.fromEntries(["goals", "focus", "health", "healthDetail", "frequency", "duration", "equipment", "diet"].filter(key => key in userProfile).map(key => [key, userProfile[key]]));
  const prompt = JSON.stringify(quick ? {mode, text, profile: quickProfile, extra: body.extra || {}, person} : {mode, text, profile, extra: body.extra || {}, person, weekDates: week, targetKcal});
  const secret = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_AUTH_TOKEN");
  if (!secret) return reply(503, {error: "ai_not_configured"});
  const relay = Deno.env.get("ANTHROPIC_BASE_URL");
  const base = (relay || "https://api.anthropic.com").replace(/\/$/, "");
  const aiHeaders: Record<string, string> = {"content-type": "application/json", "anthropic-version": "2023-06-01"};
  if (Deno.env.get("ANTHROPIC_AUTH_TOKEN")) aiHeaders.authorization = "Bearer " + Deno.env.get("ANTHROPIC_AUTH_TOKEN");
  else aiHeaders["x-api-key"] = secret;
  try {
    let out: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < (quick ? 1 : 2); attempt++) {
      const started = performance.now();
      const response = await fetch(base + "/v1/messages", {method: "POST", headers: aiHeaders, signal: AbortSignal.timeout(quick ? 25000 : attempt ? 20000 : 35000), body: JSON.stringify({model: Deno.env.get("COACH_AI_MODEL") || Deno.env.get("AI_MODEL") || "claude-haiku-4-5", max_tokens: quick ? (mode === "daily" ? 300 : 900) : (attempt ? 3500 : 2600), system: quick ? quickSystem : system, messages: [{role: "user", content: attempt ? prompt + "\n请只返回一个完整、紧凑的 JSON 对象，不要解释或代码块。" : prompt}]})});
      console.info("coach upstream timing", mode, attempt + 1, response.status, Math.round(performance.now() - started));
      if (!response.ok) { console.warn("coach upstream status", response.status); return reply(502, {error: "ai_unavailable"}); }
      const raw = await response.json();
      const text = Array.isArray(raw.content) ? raw.content.filter((x: {type: string}) => x.type === "text").map((x: {text: string}) => x.text || "").join("\n") : "";
      out = json(text);
      const candidatePlan = out?.plan && typeof out.plan === "object" ? out.plan as Record<string, unknown> : null;
      const candidateDays = candidatePlan?.days && typeof candidatePlan.days === "object" ? candidatePlan.days as Record<string, unknown> : null;
      if ((mode === "plan" || mode === "weekly") && (!candidateDays || !week.every(date => typeof candidateDays[date] === "string") || !candidatePlan?.mealSwaps)) out = null;
      if (out && (mode !== "interpret" || typeof out.summary === "string" && out.summary.trim())) break;
      out = null;
      console.warn("coach invalid output", mode, raw.stop_reason || "unknown");
    }
    if (!out && mode === "interpret") return reply(200, {partial: true, summary: "这次没能自动整理选项，请核对卡片或重试。", suggestions: {}});
    if (!out) return reply(502, {error: "ai_invalid_output"});
    const summary = trim(out.summary, 300);
    if (mode === "interpret") {
      const s = out.suggestions && typeof out.suggestions === "object" ? out.suggestions as Record<string, unknown> : {};
      const array = (x: unknown) => Array.isArray(x) ? x.map(v => trim(v, 30)).slice(0, 6) : [];
      return reply(200, {summary, suggestions: {goals: array(s.goals), focus: array(s.focus), health: array(s.health), equipment: array(s.equipment), frequency: trim(s.frequency, 30), duration: trim(s.duration, 30), diet: trim(s.diet, 250)}});
    }
    if (mode === "daily") return reply(200, {summary, choice: ["original", "short", "rest"].includes(String(out.choice)) ? out.choice : "rest"});
    const p = out.plan && typeof out.plan === "object" ? out.plan as Record<string, unknown> : {};
    const rawDays = p.days && typeof p.days === "object" ? p.days as Record<string, unknown> : {};
    const days: Record<string, string> = {};
    const allowed = person === "hus" && Array.isArray(userProfile.equipment) && (userProfile.equipment as string[]).includes("哑铃")
      ? new Set(["A", "B", "N"])
      : new Set(["W", "N"]);
    const requested = Math.min(4, Math.max(0, Number(String((profile as Record<string, unknown>).frequency || "").match(/\d/)?.[0] || 2)));
    const health = Array.isArray((profile as Record<string, unknown>).health) ? (profile as Record<string, unknown>).health as string[] : [];
    const notes = Array.isArray((profile as Record<string, unknown>).notes) ? (profile as Record<string, unknown>).notes as string[] : [];
    const unwell = mode === "weekly" ? /疼|痛|伤|生病|经期不适|慢性病情况变化/.test(text) : health.some(x => ["经期不适", "最近生病", "身体疼痛", "疲惫或睡眠差"].includes(x)) || /疼|痛|伤|病|经期|月经|疲惫|睡眠差|没睡/.test(String(notes[1] || "") + String((profile as Record<string, unknown>).healthDetail || ""));
    let training = 0;
    for (const date of week) { const choice = String(rawDays[date]); days[date] = !unwell && keys.has(choice) && allowed.has(choice) && training < requested ? choice : "REST"; if (days[date] !== "REST") training++; }
    const rawMeals = p.mealSwaps && typeof p.mealSwaps === "object" ? p.mealSwaps as Record<string, unknown> : {};
    const mealSwaps: Record<string, string> = {};
    for (const meal of meals) mealSwaps[meal] = trim(rawMeals[meal], 100);
    return reply(200, {summary, plan: {days, mealSwaps, reason: trim(p.reason, 300)}});
  } catch (error) { console.warn("coach upstream error", mode, error instanceof Error ? error.name : "unknown");return reply(error instanceof Error && error.name === "TimeoutError" ? 504 : 502, {error: error instanceof Error && error.name === "TimeoutError" ? "ai_timeout" : "ai_unavailable"}); }
});
