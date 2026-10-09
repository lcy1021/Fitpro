// 减脂打卡 App：用 Claude 估算一顿饭的热量
// 部署步骤见 docs/ai-setup.md。在 Supabase 控制台 → Edge Functions → Secrets 里设置：
//   ANTHROPIC_API_KEY     Anthropic 官方 Key（x-api-key 方式）；用中转服务时填中转给的 Key
//   ANTHROPIC_AUTH_TOKEN  （可选）中转服务要求 "Authorization: Bearer" 时用这个代替上一项
//   ANTHROPIC_BASE_URL    （可选）中转或兼容接口地址，需兼容 Anthropic Messages API，例如 https://api.deepseek.com/anthropic
//   AI_MODEL              （可选）模型名，默认 claude-opus-5-5；中转服务的模型名不同时在这里改
//   AI_USER_AGENT         （可选）中转要求特定 User-Agent 时填（例如米醋国产模型分组要求浏览器型 UA）
// SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 由 Supabase 自动提供。
const DAILY_LIMIT = 60; // 每个家庭每天最多调用次数，防止被滥用
const ALLOWED_ORIGINS = ["https://lcy1021.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];

const SYSTEM = `你是营养估算助手。用户会用中文描述一顿饭吃了什么，你要估算每样食物的热量。
规则：
- 数值参考《中国食物成分表》第6版的常见值；外卖和餐馆菜按国内常见一份的分量和做法估算（通常比家常菜油多）。
- 用户没说份量时，按一份/一个/一碗的常见分量估算，并在 amount 里写出你假设的分量。
- 描述里提到的每样食物都要列出，调味和做菜用油算进对应的菜里，不单独列。
- name 用简短中文（10 个字以内），amount 用中文写份量（如"1 碗约 200g""半份"），kcal 取整到 5。
- 食物名称有歧义时，按常见做法估算并在 note 说明假设；无法合理估算的食物也必须列出，kcal 填 null，不能编造为 0 或漏掉。
- 描述里没有可以吃的东西时，items 返回空数组，并在 note 里说明。
- note 用一句话提醒最不确定的地方；没有就留空字符串。`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "string" },
          kcal: { type: ["integer", "null"] },
        },
        required: ["name", "amount", "kcal"],
        additionalProperties: false,
      },
    },
    note: { type: "string" },
  },
  required: ["items", "note"],
  additionalProperties: false,
};

const BASE_URL = Deno.env.get("ANTHROPIC_BASE_URL") || undefined;
// 米醋 vip_4 不提供 Claude 通道；未显式设 AI_MODEL 时选该分组可用的国产模型。
const MODEL = Deno.env.get("AI_MODEL") || (BASE_URL?.includes("micuapi.ai") ? "deepseek-v4-pro" : "claude-opus-5-5");
const RELAY = !!BASE_URL; // 走中转时只用最基础的请求参数，兼容性更好
const VERSION = "2026-10-09-meal-format";
const URL = Deno.env.get("SUPABASE_URL") || "";
let SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
try { SERVICE = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || SERVICE; } catch { /* legacy key */ }
const adminHeaders = { apikey: SERVICE, ...(!SERVICE.startsWith("sb_secret_") ? { authorization: "Bearer " + SERVICE } : {}) };
const JSON_ONLY = `\n只输出一个完整紧凑的 JSON 对象，不要思考过程或代码块，格式：{"items":[{"name":"米饭","amount":"1 碗约 200g","kcal":230}],"note":""}。每样食物都列出；无法估算时 kcal 用 null。`;
type Result = { items: { name: string; amount: string; kcal: number | null }[]; note: string };
function normalize(value: unknown): Result | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.items) || v.items.length > 20 || (v.note !== undefined && typeof v.note !== "string")) return null;
  const items: Result["items"] = [];
  for (const item of v.items) {
    if (!item || typeof item !== "object" || typeof item.name !== "string" || !item.name.trim() || typeof item.amount !== "string") return null;
    if (item.kcal !== null && (typeof item.kcal !== "number" || !Number.isFinite(item.kcal) || item.kcal < 0 || item.kcal > 3000)) return null;
    items.push({name: item.name.trim().slice(0, 20), amount: item.amount.slice(0, 30), kcal: item.kcal === null ? null : Math.round(item.kcal / 5) * 5});
  }
  return {items, note: String(v.note || "").slice(0, 100)};
}
// Match complete objects, respecting braces inside quoted strings. Skip prose/examples with the wrong schema.
function pickJson(text: string): Result | null {
  for (let start = text.indexOf("{"); start >= 0; start = text.indexOf("{", start + 1)) {
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < text.length; end++) {
      const char = text[end];
      if (quoted) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quoted = false; continue; }
      if (char === '"') quoted = true;
      else if (char === "{") depth++;
      else if (char === "}" && --depth === 0) {
        try { const result = normalize(JSON.parse(text.slice(start, end + 1))); if (result) return result; } catch { /* next candidate */ }
        break;
      }
    }
  }
  return null;
}
async function estimate(text: string): Promise<Result | "refused" | null> {
  const base = (BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const token = Deno.env.get("ANTHROPIC_AUTH_TOKEN"), key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!token && !key) throw Object.assign(new Error("ai_not_configured"), {code: "ai_not_configured"});
  const headers: Record<string, string> = {"Content-Type": "application/json", "anthropic-version": "2023-06-01"};
  if (token) headers.authorization = "Bearer " + token;
  else headers["x-api-key"] = key!;
  const ua = Deno.env.get("AI_USER_AGENT"); if (ua) headers["User-Agent"] = ua;
  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now();
    const response = await fetch(base + (base.endsWith("/v1") ? "/messages" : "/v1/messages"), {
      method: "POST", headers, signal: AbortSignal.timeout(attempt ? 20000 : 30000),
      body: JSON.stringify({model: MODEL, max_tokens: attempt ? 6144 : 4096, system: SYSTEM + JSON_ONLY,
        ...(!RELAY ? {output_config: {effort: "low", format: {type: "json_schema", schema: SCHEMA}}} : {}),
        messages: [{role: "user", content: text + (attempt ? "\n上次回复不完整或格式无效，请重新返回完整 JSON，不要解释。" : "")}]}),
    });
    if (!response.ok) {
      const detail = await response.text();
      const code = response.status === 429 ? "busy" : [401, 403].includes(response.status) ? "bad_key" : /model_not_found|No available channel/i.test(detail) ? "model_unavailable" : "upstream";
      console.warn("meal upstream", VERSION, response.status, Date.now() - started);
      throw Object.assign(new Error(code), {code});
    }
    let raw;
    try { raw = await response.json(); } catch { raw = {}; }
    const blocks = Array.isArray(raw?.content) ? raw.content.filter((b: {type?: string; text?: unknown}) => b && b.type === "text" && typeof b.text === "string").map((b: {text: string}) => b.text) : [];
    const stop = typeof raw?.stop_reason === "string" && /^[a-z_]{1,40}$/.test(raw.stop_reason) ? raw.stop_reason : "unknown";
    console.info("meal output", VERSION, attempt + 1, stop, blocks.length, blocks.join("").length, Date.now() - started);
    if (stop === "refusal") return "refused";
    // A max_tokens response may contain a valid prefix with missing foods. Never accept it as complete.
    if (stop !== "max_tokens") {
      const result = pickJson(blocks.join("")) || pickJson(blocks.join("\n"));
      if (result) return result;
    }
  }
  return null;
}
async function admin(path: string, body?: unknown) {
  const response = await fetch(URL + path, {method: body === undefined ? "GET" : "POST", headers: {...adminHeaders, "Content-Type": "application/json"}, ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error("data_unavailable");
  return await response.json();
}

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json", "X-Meal-Version": VERSION, "Access-Control-Expose-Headers": "X-Meal-Version" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "method" });

  let family = "", text = "";
  try {
    const body = await req.json();
    family = String(body.family ?? "");
    text = String(body.text ?? "").trim();
  } catch {
    return reply(400, { error: "bad_json" });
  }
  if (!/^[A-Za-z0-9]{8,40}$/.test(family)) return reply(400, { error: "bad_family" });
  if (!text || text.length > 200) return reply(400, { error: "bad_text" });

  if (!URL || !SERVICE) return reply(503, {error: "server_not_configured"});
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
  let privateMember = false;
  if (bearer && bearer !== req.headers.get("apikey")) {
    let auth;
    try {
      const response = await fetch(URL + "/auth/v1/user", {headers: {apikey: SERVICE, authorization: "Bearer " + bearer}, signal: AbortSignal.timeout(8000)});
      if ([401, 403].includes(response.status)) return reply(401, {error: "invalid_session"});
      if (!response.ok) return reply(503, {error: "auth_unavailable"});
      auth = await response.json();
    } catch { return reply(503, {error: "auth_unavailable"}); }
    if (!auth?.id) return reply(401, {error: "invalid_session"});
    try {
      const members = await admin("/rest/v1/fl_members?select=family&user_id=eq." + encodeURIComponent(auth.id) + "&limit=1");
      if (members[0]?.family !== family) return reply(403, {error: "wrong_family"});
    } catch { return reply(503, {error: "family_check_failed"}); }
    privateMember = true;
  }
  if (!privateMember) {
    try {
      const encoded = encodeURIComponent(family);
      const [c, m] = await Promise.all([admin("/rest/v1/checkins?select=id&family=eq." + encoded + "&limit=1"), admin("/rest/v1/measures?select=id&family=eq." + encoded + "&limit=1")]);
      if (!(c.length || m.length)) return reply(403, {error: "unknown_family"});
    } catch { return reply(503, {error: "family_check_failed"}); }
  }
  // Count one user request, including at most one internal format repair. Never replay quota/network failures.
  try {
    const quota = await admin("/rest/v1/rpc/fl_ai_quota", {p_family: family, p_limit: DAILY_LIMIT});
    if (quota !== true) return reply(429, {error: "daily_limit"});
  } catch { return reply(503, {error: "quota_check_failed"}); }
  try {
    const out = await estimate(text);
    if (out === "refused") return reply(422, {error: "refused"});
    if (!out) return reply(502, {error: "no_output"});
    return reply(200, out);
  } catch (error) {
    const e = error as Error & {code?: string};
    const code = ["busy", "bad_key", "model_unavailable", "upstream", "ai_not_configured"].includes(e.code || "") ? e.code : e.name === "TimeoutError" ? "ai_timeout" : "unreachable";
    console.warn("meal failure", VERSION, code);
    return reply(code === "busy" ? 429 : code === "ai_timeout" ? 504 : 502, {error: code});
  }
});
