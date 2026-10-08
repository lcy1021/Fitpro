# 私人健康伙伴上线步骤

这个版本把两人的记录分开存储。每台设备自动建立匿名身份，不要求邮箱或手机号；家庭口令只用于配对。每个人还会得到一个仅本人保存的恢复码。伴侣页面仅返回“当天是否打卡”和相对首次记录的体重变化曲线。目标、身体情况、原始体重、饮食、训练和每日调整都由本人账号读取。

## 部署顺序

1. 备份旧版 `checkins`、`measures` 两张表。先运行现有的 `supabase-setup.sql` 和 `supabase-ai-setup.sql`，再运行 `supabase-private-coach.sql`。新 SQL 会把认领角色的旧记录导入私有表，并撤销旧家庭口令 RPC 的公开调用权限。上线时要同步发布网页，因为旧缓存客户端的同步接口会被关闭。
2. 在 Supabase Auth 设置中开启 **Allow anonymous sign-ins**。应用播放原入场动画并展示老公／老婆角色卡；后台匿名注册并保存本机会话。选择角色后立即进入 4 步目标设定，最后确认计划时完成云端角色认领和保存，不展示登录方式页。已有家庭口令可在角色卡下方展开填写；首次使用会自动生成。每个角色由一个独立匿名用户认领，同一个家庭角色不能重复认领。建议同时开启 Supabase 推荐的 CAPTCHA 或 Turnstile 防滥用。
3. 部署 `supabase/functions/coach/index.ts` 为 `coach`，部署更新的 `supabase/functions/meal-kcal/index.ts`。把 `ANTHROPIC_API_KEY` 放入 Edge Functions Secrets；使用兼容 Anthropic 的中转时配置 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`、`COACH_AI_MODEL`。`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 在 Supabase 函数环境中提供。`coach` 默认启用 JWT 验证，也会在函数中再次校验用户；建档前可用当前匿名身份和所选角色调用 AI，完成 4 步后才认领家庭角色。AI 不可用时前端保留保守的训练安排；如果填了饮食限制却没有生成具体餐食，页面会隐藏默认菜品并提示不要照搬。没有哑铃时使用徒手全身训练。
4. 更新静态文件 `index.html`、`private-coach.js`、`private-coach.css`、`sw.js`、`manifest.webmanifest`、`config.js` 及图片资源。首位用户完成 4 步并保存恢复码后，可复制家庭口令邀请伴侣；伴侣在角色页填写口令，再完成自己的 4 步并保存恢复码。

恢复码为一次性凭据：在新设备上输入后，私人记录会转移到新匿名身份，原设备失去同步权限，并生成新的恢复码。家庭口令无法代替恢复码；清除浏览器数据前务必先保存它。

本地 `file://` 页面用于检查动画和四步界面，AI 请求不能可靠地从该来源通过浏览器跨域校验。AI 对话请在已部署的 HTTPS 页面或允许的本地 HTTP 来源测试；手机访问同一服务端时，匿名登录和 `coach` 函数也必须先启用和部署。若出现 `Anonymous sign-ins are disabled`，先完成第 2 步；若 `/functions/v1/coach` 返回 404，先完成第 3 步。

AI 请求会发送本人填写的目标、身体状态和饮食偏好给配置的 AI 服务，用于生成建议。它们不会返回给伴侣。若使用第三方中转，请确认其数据处理方式。

## 关闭 App 后的每周推送（可选）

1. 生成一对 VAPID 密钥，例如 `npx web-push generate-vapid-keys`。把**公钥**填进 `config.js` 的 `PUSH_PUBLIC_KEY`；私钥只存为 Supabase Secret `VAPID_PRIVATE_KEY`，公钥同时存为 `VAPID_PUBLIC_KEY`。设置 `VAPID_SUBJECT` 为管理员的 `mailto:` 地址。
2. 部署 `supabase/functions/weekly-push/index.ts` 为 `weekly-push`。设置一个随机长密钥 `WEEKLY_PUSH_SECRET`，关闭该函数的 JWT 验证；函数自身只接受带密钥的 POST。系统通知的文案不含个人目标或身体状态。
3. 在 Supabase Vault 新增 `duofit_weekly_push_url`（函数完整 URL）和 `duofit_weekly_push_secret`（与 `WEEKLY_PUSH_SECRET` 相同），启用 `pg_cron`、`pg_net`，再运行 `supabase-weekly-push.sql`。它在北京时间周一 09:00 调用函数，已确认本周计划的人不会收到提醒。
4. 用户在 App 内点击“开启系统通知”并授权。iOS/iPadOS 需要把网站加入主屏幕，系统版本至少 16.4；其他浏览器以其 Push API 支持情况为准。未授权或未部署时，用户打开 App 仍会看到周计划确认。

配置完成后，用两台测试设备分别验证匿名进入、角色配对、恢复码换机、旧设备失去权限，以及：本人档案和目标、伴侣打卡状态和相对体重曲线、周一弹窗、身体不适时休息建议、每日短版、系统通知点击返回 App。
