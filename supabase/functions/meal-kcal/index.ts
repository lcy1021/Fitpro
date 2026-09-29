// 减脂打卡 App：用 Claude 估算一顿饭的热量
// 部署步骤见 docs/ai-setup.md。需要的密钥（在 Supabase 控制台 → Edge Functions → Secrets 里设置）：
//   ANTHROPIC_API_KEY  你的 Anthropic API Key
// SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 由 Supabase 自动提供。
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT = 60; // 每个家庭每天最多调用次数，防止被滥用
const ALLOWED_ORIGINS = ["https://lcy1021.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];

const SYSTEM = `你是营养估算助手。用户会用中文描述一顿饭吃了什么，你要估算每样食物的热量。
规则：
- 数值参考《中国食物成分表》第6版的常见值；外卖和餐馆菜按国内常见一份的分量和做法估算（通常比家常菜油多）。
- 用户没说份量时，按一份/一个/一碗的常见分量估算，并在 amount 里写出你假设的分量。
- 描述里提到的每样食物都要列出，调味和做菜用油算进对应的菜里，不单独列。
- name 用简短中文（10 个字以内），amount 用中文写份量（如"1 碗约 200g""半份"），kcal 取整到 5。
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
          kcal: { type: "integer" },
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

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
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

  // 只给已经在用的家庭服务：口令下至少有一条打卡或身体记录
  const [c, m] = await Promise.all([
    db.from("checkins").select("id").eq("family", family).limit(1),
    db.from("measures").select("id").eq("family", family).limit(1),
  ]);
  if (!(c.data?.length || m.data?.length)) return reply(403, { error: "unknown_family" });

  const quota = await db.rpc("fl_ai_quota", { p_family: family, p_limit: DAILY_LIMIT });
  if (quota.error) return reply(500, { error: "quota_check_failed" });
  if (quota.data !== true) return reply(429, { error: "daily_limit" });

  try {
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    if (response.stop_reason === "refusal") return reply(422, { error: "refused" });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return reply(502, { error: "no_output" });
    const out = JSON.parse(block.text);
    const items = (Array.isArray(out.items) ? out.items : []).slice(0, 20).map((i: { name: unknown; amount: unknown; kcal: unknown }) => ({
      name: String(i.name).slice(0, 20),
      amount: String(i.amount).slice(0, 30),
      kcal: Math.max(0, Math.min(3000, Math.round(Number(i.kcal) / 5) * 5 || 0)),
    }));
    return reply(200, { items, note: String(out.note ?? "").slice(0, 100) });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return reply(429, { error: "busy" });
    if (err instanceof Anthropic.APIError) return reply(502, { error: "upstream", status: err.status });
    return reply(500, { error: "internal" });
  }
});
