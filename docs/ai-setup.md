# 开启 AI 估算热量

「记一下实际吃了什么」默认用 App 内置的食物库识别。开启 AI 后，弹窗里会多一个「🤖 让 AI 估算这一顿」按钮：食物库认不出、或者吃的东西比较复杂时，点一下让 Claude 按整句话估算。

**大约 10 分钟，只需要做一次。** API Key 只存在 Supabase 的密钥设置里，不会出现在页面和公开仓库中。

## 网络：手机不用直连 Claude

```
手机 ──(国内能访问)──> Supabase 服务器（东京/新加坡）──> Claude 官方接口 或 你配置的中转
```

- **手机只连 Supabase**（和现在同步数据走的是同一条路），不需要能访问 Anthropic。真正调用 Claude 的是 Supabase 的服务器。
- Supabase 的函数默认会在**离用户最近的节点**运行，从国内访问可能被分到香港节点，而 Claude 官方接口不对香港开放。所以 App 会用 `config.js` 里的 `AI_REGION` 把函数**固定在你的项目所在地区**（默认东京 `ap-northeast-1`）。
- 如果官方接口还是连不上，或者你想用国内的 Claude 中转服务，按下面「用第三方中转」配置即可，不用改代码。

## 费用

- 每次估算通常调用一次配置的 AI 模型；仅当回复格式异常或截断时，内部最多补做一次格式修复。两次合计只计一次家庭每日限额，上游调用费用按实际请求计算。
- 每个家庭每天最多 60 次（在 `supabase/functions/meal-kcal/index.ts` 的 `DAILY_LIMIT` 改），超过当天就不能再用，防止被滥用。
- 想更省钱，可以在 Secrets 里加 `AI_MODEL` = `claude-haiku-4-5`，不用改代码（估算质量会差一些）。

## 步骤

### 1. 拿一个 Anthropic API Key

1. 打开 https://console.anthropic.com ，登录后进入 **API Keys** → **Create Key**，名字填 `duofit`。
2. 复制生成的 Key（`sk-ant-` 开头），**不要发给任何人，也不要写进代码或提交到 GitHub**。
3. 在 **Billing** 里充一点余额（最低档就够用很久）。

### 2. 建限额表

Supabase 控制台 → **SQL Editor** → **New query**，把 [`supabase-ai-setup.sql`](../supabase-ai-setup.sql) 全部粘贴进去 → **Run**，看到 `Success` 即可。

### 3. 保存 API Key（官方或中转二选一）

Supabase 控制台 → **Edge Functions** → **Secrets**（或 Project Settings → Edge Functions）→ 新增：

- Name：`ANTHROPIC_API_KEY`
- Value：第 1 步复制的 Key

用第三方中转时，见下面「用第三方中转」，改填中转的地址和 Key。

### 4. 部署函数

Supabase 控制台 → **Edge Functions** → **Deploy a new function** → **Via Editor**：

1. 函数名填 `meal-kcal`（必须一模一样）。
2. 把 [`supabase/functions/meal-kcal/index.ts`](../supabase/functions/meal-kcal/index.ts) 的全部内容粘贴进去，替换默认代码 → **Deploy**。
3. 部署完进入函数的 **Settings**（或 Details），把 **Enforce JWT Verification / Verify JWT** 关掉并保存。函数自行校验用户身份和家庭归属；旧版客户端校验家庭记录。

> 用命令行部署也可以：`supabase functions deploy meal-kcal --no-verify-jwt`。

### 5. 确认地区

Supabase 控制台 → **Project Settings** → **General**，看 **Region**：

- 东京（Northeast Asia / Tokyo）→ `ap-northeast-1`（默认值，不用改）
- 新加坡（Southeast Asia / Singapore）→ 把 `config.js` 里的 `AI_REGION` 改成 `ap-southeast-1`

### 6. 打开开关

把 `config.js` 里的 `AI_KCAL: false` 改成 `AI_KCAL: true`（或者告诉 Claude "AI 估算已经部署好了"，让它改完推送）。

## 用第三方中转

中转服务需要**兼容 Anthropic Messages API**（接口路径是 `/v1/messages`，一般标注"支持 Claude Code""Anthropic 格式"）。只兼容 OpenAI 格式的不行。

在 Supabase → Edge Functions → **Secrets** 里设置（不用改代码，改完立即生效）：

| Name | 填什么 | 说明 |
|---|---|---|
| `ANTHROPIC_BASE_URL` | 中转地址，例如 `https://api.example.com` | 不要带 `/v1/messages`；设了这一项就会走中转 |
| `ANTHROPIC_API_KEY` | 中转给你的 Key | 中转用 `x-api-key` 认证时填这个 |
| `ANTHROPIC_AUTH_TOKEN` | 中转给你的 Key | 中转要求 `Authorization: Bearer` 时改填这个（和上一项二选一） |
| `AI_MODEL` | 中转分组实际支持的模型名 | 米醋地址未填此项时默认 `deepseek-v4-pro`；其他地址未填时默认 `claude-opus-5-5`。显式填了不支持的模型仍会报错 |

走中转时，函数只请求一次，在提示词里要求模型直接输出 JSON；中转不需要支持结构化输出参数。

**选中转的注意事项**：你写的那句"吃了什么"会经过中转服务商的服务器。只发送饮食描述，不含体重等其他数据，但还是建议选口碑好的服务商。

## 用米醋的国产模型（如 DeepSeek）

米醋的 Claude 分组只接受 Claude Code 客户端的请求，这个 App 用不了；国产模型分组 `vip_4` 可以外接调用。

1. 在米醋「令牌」里新建一个 Key，**分组选 `vip_4`**。
2. 在 Supabase → Edge Functions → **Secrets** 里设置：

| Name | Value |
|---|---|
| `ANTHROPIC_BASE_URL` | `https://www.micuapi.ai` |
| `ANTHROPIC_AUTH_TOKEN` | `vip_4` 分组的 Key（米醋要求 Bearer 认证） |
| `AI_MODEL` | `deepseek-v4-pro`（也可以用 `deepseek-v4-flash`，更快更便宜） |
| `AI_USER_AGENT` | `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0` |

- **删掉** `ANTHROPIC_API_KEY`（和 `ANTHROPIC_AUTH_TOKEN` 只能留一个）。
- `AI_USER_AGENT` 是米醋文档对国产模型分组的要求（见 docs.micuapi.ai/new/external-ua），不填会被拒（403）。
- 模型名以米醋「模型广场」里 `vip_4` 分组显示的为准。

## 用 DeepSeek 官方（国内直接可用）

DeepSeek 官方提供兼容 Anthropic 格式的接口，不需要中转，费用也很低。

1. 打开 https://platform.deepseek.com ，注册登录，在 **API Keys** 里创建一个 Key，并充一点余额。
2. 在 Supabase → Edge Functions → **Secrets** 里设置：

| Name | Value |
|---|---|
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/anthropic` |
| `ANTHROPIC_API_KEY` | DeepSeek 的 Key |
| `AI_MODEL` | `deepseek-v4-pro` |

- 如果之前设过 `ANTHROPIC_AUTH_TOKEN`，删掉它。
- DeepSeek 不支持结构化输出参数，函数会在提示词里要求它只输出 JSON，不用额外设置。
- 注意：用 DeepSeek 时，估算热量的是 DeepSeek 的模型，不是 Claude。



1. 手机打开 App，确认已经设置了家庭口令、并且保存过目标或打过至少一次卡，等待同步成功（函数只服务已经在用的家庭）。
2. 点任意一餐的「📝 记一下实际吃了什么」，写一句话，点「🤖 让 AI 估算这一顿」。
3. 几秒后出现带紫色 **AI** 标记的结果就说明成功了。

| 提示 | 原因 |
|---|---|
| 先打一次卡同步一下 | 这个口令下还没有任何数据 |
| 今天 AI 估算次数用完了 | 超过每天 60 次 |
| AI 的 Key 不对或余额不足 | 检查 Secrets 里的 Key；中转的话确认该用 `ANTHROPIC_API_KEY` 还是 `ANTHROPIC_AUTH_TOKEN` |
| 服务器连不上 AI 接口 | `AI_REGION` 和项目地区不一致，或者官方接口不通 → 配置中转 |
| AI 估算失败 | 看 Supabase → Edge Functions → meal-kcal → Logs；常见是 JWT 验证没关、中转模型名不对 |
| 家庭口令下还没有同步记录 | 目标或打卡尚未同步，先等同步完成再试 |
| AI 次数表还没配置好 | 运行 `supabase-ai-setup.sql`，检查 `fl_ai_quota` |
| AI 服务无法读取家庭记录 | 检查 Edge Function 的服务端数据库配置和函数日志 |
| 当前模型在中转分组不可用 / `model_not_found` | 在 Supabase → Edge Functions → Secrets 核对 `AI_MODEL` 和中转令牌分组；米醋 `vip_4` 可选其模型广场当前列出的模型，例如 `deepseek-v4-pro`。改 Secret 后重试；若换了函数代码，还要重新部署 `meal-kcal` |

## 安全说明

- 函数只接受 GitHub Pages（`lcy1021.github.io`）和本地预览发来的请求。
- 每次请求都要带一个**已经有数据的家庭口令**，并且按家庭每天限额；仓库里没有你们的口令，外人拿到公开密钥也用不了。
- 发给 Claude 的只有你写的那句"吃了什么"，不含体重等其他数据。

## 2026-10-09 估算回复修复

- 读取所有文字块，提取完整且符合 items 格式的 JSON；不再只读取第一段或把无关大括号一起解析。
- 输出预算 4096 tokens；截断或格式异常时最多补做一次（6144 tokens）。`max_tokens` 截断回复不当作完整的一餐。
- 无法合理估算的项目保留 `kcal: null`，不会转换成 0；部分热量不显示整餐“在计划范围内”。未完成的估算不缓存，方便重试。
- 私人档案估算不再等待打卡同步；沿用共享登录刷新、90 秒客户端截止和连接诊断。仅 401 身份拒绝会更新 token 后重试一次；网络/服务失败不自动重发消耗额度的请求。
- 日志只记录版本、尝试次数、结束原因、文字块数、字符数和耗时，不记录食物原文、模型回复、家庭口令或 token。
- 函数响应版本头：`X-Meal-Version: 2026-10-09-meal-format`。GitHub Pages 页面发布不会部署 Edge Function，必须另外更新 `meal-kcal`。

验证：`node tests/meal-function.mjs`、`node tests/meal-ui.js`、`node tests/cloud-connection.js`。测试热量为虚构数据，只验证处理流程。
