// 减脂打卡 App 的 Supabase 配置
// 只需要填一次，以后更新 App 时只替换 index.html，这个文件不用动
window.FATLOSS_CONFIG = {
  SUPABASE_URL: "https://qhbdszdwtyosgmhcihxp.supabase.co",  // 例如 https://abcdefgh.supabase.co
  SUPABASE_KEY: "sb_publishable_1BidwBeJl2Q4TWUD2CXPlQ_ZNTGVe0_",  // 公开密钥：sb_publishable_ 开头，或旧版 anon key（eyJ 开头）。不要填 secret / service_role
  AI_KCAL: true,  // 按 docs/ai-setup.md 部署好 AI 估算后改成 true
  PUSH_PUBLIC_KEY: "",  // 部署推送后填 VAPID 公钥；私钥只放 Supabase Secrets
  AI_REGION: "ap-northeast-1"  // AI 函数在哪个地区运行，填 Supabase 项目所在地区（东京 ap-northeast-1 / 新加坡 ap-southeast-1）
};
