# DuoFit 维护记录与故障定位

最后更新：2026-10-09 · 当前应用 v34。此文件是后续修复的首查入口；每次修改都补充症状、原因证据、改动范围、验证结果与发布版本。专题 QA 文档保留当时版本的证据，不能把历史策略直接当作当前策略。

## 1. 当前约定与代码入口

| 范围 | 当前规则 | 一致修改的入口 |
| --- | --- | --- |
| 启动 | HTML 先显示入场动画；同一身份完整缓存可先进入首页，云端后台连接；未确认身份不能当作新档案 | `index.html` boot / splash；`private-coach.js` init / cached profile / reconnect |
| 身份和同步 | 共享刷新请求，跨页面 Web Locks；明确失效才清除身份；可重复请求重试，一次性恢复及消费 AI 不因网络错误自动重发 | `private-coach.js` refresh / request / sync；`index.html` dirty 快照确认 |
| 餐次呈现 | 今日、饮食计划共用 `mealHeading / mealPlanContent`；所有餐次共用 `mealEnergy`；今日、饮食打卡共用 `mealActions`；本人/伴侣历史共用 `dietDayRows` | `index.html` Shared meal surfaces 样式块和上述函数；不要单独在某个页面追加覆盖 |
| 餐食来源 | 有已确认个性餐食就优先显示；有饮食限制而缺少个性餐食时明确待确认，不能回退默认菜单；历史只显示当时保存的食物和热量 | `mealPlanContent / mealRecordText / dietDayRows`；不得用今天的计划重算昨天 |
| 历史与共享 | 近 120 天；餐食/活动默认向配对伴侣共享，本人可手动关闭；伴侣详情只读、按日读取、仅运行内存保存 | `supabase-checkin-sharing-default.sql`、`private-coach.js` partner records、`historyCard` |
| 私人数据 | 体重围度、健康、目标、身体状态、自由文本和聊天不进入伴侣详情 | SQL 与 JS 嵌套白名单必须一起核对；不可用原始 JSON 透传 |
| 图片 | 小列表用 small WebP，跟练用大 WebP；独立图片缓存跨应用升级保留 | `moveArt / warmNextMove`、`sw.js`、`scripts/optimize-images.py` |
| 发布 | 核心文件同一版本；图片仅内容变化时改素材版本 | `index.html` CSS/JS 查询参数、`sw.js` CACHE/CORE、连接诊断版本、版本断言；图片仍为 `duofit-images-v1` / `media1` |

`config.js` 不随样式修改覆盖。数据 `person`、记录 ID 与旧 JSON 字段保持兼容。GitHub Pages 发布只更新网页；Edge Function 与 SQL 需要独立部署和检查。旧版家庭口令接口说明见 `CLAUDE.md` 的历史模型；当前私人模型以 `docs/private-coach-setup.md` 和最新迁移为准。

## 2. 快速判断相似问题

| 症状 | 先查什么 | 不应直接做什么 | 回归入口 |
| --- | --- | --- | --- |
| 已建档又进入角色/建档页 | 是否同设备同入口；本机匿名身份、同 UID 确认缓存；连接诊断的 Auth/RPC 状态；对应时刻云端日志 | 不让用户重建覆盖，不把读取失败当作档案不存在，不随意清除登录 | `tests/cloud-connection.js`、`tests/scenarios.js` |
| 动画后显示“读取档案遇到问题” | 有无完整本机缓存；Auth 刷新与 RPC 分别耗时/状态；重试是否退避；实际身份是否失效 | 不凭截图断言 Supabase 宕机或表结构慢；不无限增加等待时间 | `tests/startup-browser.js`、云端连接 QA |
| 恢复码 invalid_recovery_code | 完整字符、当前网站和项目；码是否可用，原成员/档案是否仍存在；一次性消费结果 | 不公开恢复码，不重发一次性 RPC，不把 user_id 当作登录码 | 恢复流程场景；私人档案部署文档 |
| AI “无法连接” | coach / meal-kcal 区分；HTTP/规范错误码、客户端截止、函数版本头；上游时间、格式和额度分别检查 | 不把所有错误归于网络；不只更新网页就认为函数已更新；不自动重试消费请求 | `tests/coach-function.mjs`、`tests/meal-function.mjs`、`tests/meal-ui.js` |
| 部分食物有热量但总计过低 | items 是否完整、未知项是否 null、原文是否修改、是否迟到响应、是否允许保存/判定整餐 | 不把未知热量当 0，不用部分总计显示“在计划范围内” | `tests/meal-ui.js` |
| 图片加载慢 | 实际选中资源/大小、是否 GIF 回退、缓存命中是否联网、是否每次发布丢缓存、首次并发下载 | 不全量预加载，不仅压源图却仍引用旧 GIF | `tests/sw-cache.js`、`tests/image-browser.js` |
| 今日先闪出再动画 / 首开卡 | 脚本未完成时真实首屏；主页面 hidden/inert；动画期间渲染次数和请求竞争 | 不仅缩短动画；不在首屏同步构建多次首页 | `tests/startup-browser.js` |
| 训练图上下大片空白 | 父 picture 和 img 实际宽高；图片 4:3 与父容器高度是否冲突；普通/短计划两条路径 | 不只改 object-fit；不通过裁切图内主体掩盖父容器高度错误 | `tests/image-browser.js` |
| 三处餐卡样式不一致 / 长食物被截 | 共用 helper 与 CSS，是否遗留 `.note / .logged` 或历史专属大背景；320px 与长文本 | 不新增一层页面级覆盖，不减少文字完整性换取“整齐” | 合成 `theme-preview.html`；餐次 QA |
| 伴侣没显示详情 | 是否配对、本人/伴侣开关、日期范围、按日 RPC 状态；未知状态与已关闭区分 | 不回退旧 store 内伴侣健康数据，不把未同步当成零记录 | `tests/partner-records-browser.js`、`tests/cloud-connection.js` |
| 设置被挡 / 齿轮被裁 | 分别检查导航实际高+安全区、SVG viewBox 和描边范围 | 不只修底部空白就宣布图标已修好 | 设置安全区与图标 QA |

## 3. 已确认的问题、修改与证据

下列原因来自代码差异与合成故障测试。用户手机当天每一次云端失败的网络/服务端原因没有完整现场日志，仍未确认；历史工作机的健康检查成功也不能证明手机路径正常。

### 2026-10-08：手机输入放大、旧记录导入、AI 等待

- `5baf0f3`：健康伙伴小于 16px 的输入字体引发 iOS 聚焦自动放大；手机输入改为 16px。属于浏览器输入布局，不能归因云端。
- `a5b4326`：旧表 date 是文本，私人表为 date，导入未转换类型产生类型错误；迁移改为 `c.date::date / m.date::date`，保留本人记录、冲突不覆盖。补齐 AI 分析中状态与按钮禁用。增量脚本 `supabase-private-coach-date-fix.sql`，不能靠重新建档绕开导入错误。
- `c555574 / 2950121 / 3bb50cf`：AI 结构/错误状态、调用耗时及启动期限逐步完善。后续 `de21d97` 进一步纠正前端 10/15/40 秒截止短于云端处理时间的问题，interpret/daily 为 60 秒、plan 为 90 秒；错误按身份、额度、格式和服务分类。具体协议见 AI 部署文档，不能把全部“无法连接”视为单一故障。

### 2026-10-08：主题、设置、确认计划首日

- `5f944bc`：`private-coach.css` 写死白底/浅色，独立弹窗遗漏主题；接入全局主题变量，覆盖建档、周确认、日调整、恢复及发送状态。[主题 QA](qa/dark-mode/README.md)。
- `2df9aa3`（v20）：内容固定底部 104px，导航高度含安全区并随字号变化，留白不足；改成实际导航高度+24px 并持续测量。**这一步没解决原始齿轮路径裁切**。[安全区 QA](qa/settings-safe-area/README.md)。
- `240011d`（v21）：旧齿轮路径 y 到25.2且描边越出24×24画板；换正确 Lucide 路径，并同步素材和总览。[图标 QA](qa/settings-icon/README.md)。
- `9832530`（v22）：计划首日绑定星期而不是确认日；确认当天作为第1天，连续7天周期，兼容旧周期和AI星期格式，跨午夜重核日期，短版/休息不伪造训练完成。[计划 QA](qa/default-plan/README.md)。
- 图标迭代 `40ea675 / b6a3ead / 9dc8ce1`：主屏幕读取入口及品牌图标尺寸/主体比例调整；正式素材按源图缩放，不预切圆角，不把设计候选目录当正式资源。

### 2026-10-09：重新建档、找回记录、反复云端失败

- `e3211c4`：读取失败与没有确认档案混淆；保留登录/错误入口，禁止失败直接当新建档。
- 找回记录：只读核对原档案存在后用一次性恢复码迁移身份。用户报告 invalid recovery code 后粘贴完整码，确认昨日记录恢复；这个步骤是操作结果，不能据此断言所有恢复错误都由截断造成。恢复码、用户 ID 和口令不写入此公开文档。
- `7087060`：刷新/读取暂时失败时已有档案也打不开；添加按匿名 UID 隔离的已确认档案缓存，同一身份读取失败可使用缓存。
- `94e1f0d`：并发 token 旋转刷新、普通错误误清登录、重复完整拉取、写入无期限、新修改被旧上传清除 dirty 等结构问题；共享刷新/Web Locks、明确失效判定、安全请求期限与退避、拉取合并、JSON快照确认上传。`d010621` 再把缓存首页开放从完整云端重试中拆出，动画后先进入、后台重连。[连接调查](qa/cloud-connection/README.md)。
- 上述改变提高客户端抗短暂失败能力。运营商/DNS/TLS、项目当时故障及真实私人查询慢仍需请求诊断与同时间服务器日志，未证明为缺索引；现有私人记录和计划有 UID/日期主键。

### 2026-10-09：AI 热量、图片、启动与训练空白

- `7d96e7a`（v29）：仅取首文字块、JSON提取不完整和输出截断会得到“没有可识别结果”；改成所有文字块+平衡JSON提取/校验，4096 tokens，异常内部最多一次6144修复。未知项 null、不缓存为0；部分总计不能判定整餐或保存；防旧请求覆盖改文/另一餐/另一身份。[AI修复](ai-setup.md#2026-10-09-估算回复修复)。未知食物无法保证每次识别成功。
- `2317a4e`（v30）：小列表加载800×600 GIF，图片随应用缓存升级被删除且命中仍联网，安装阶段抢资源；大小两套WebP、独立图片缓存、冷请求去重、按需缓存、仅预热下一动作。大动图总大小减少76.6%，小图92.8%，属于文件大小对比，不是实机耗时保证。[图片 QA](qa/image-loading/README.md)。
- `e95d5a5`（v31）：HTML首屏默认主页面，JS稍后才动画；动画期间重复渲染及SW下载竞争；picture继承过高布局造成4:3图大量空白。HTML先入场、隐藏/inert主页、动画后一次渲染、后台同步/SW；显式picture/img自然4:3，同时覆盖普通与10分钟计划；修跳过动画冒泡的重复结束。[启动 QA](qa/startup/README.md)。

### 2026-10-09：饮食历史、双方连续记录与共享

- `bb38cf1` → `baf1876`（v32）：从仅今天打卡发展为按周饮食、餐次日志、夫妻连续保存天数和四周日历。存在check-in就算记录，今天未记录允许显示截至昨天的连续天数，窗口120天，未知伴侣元数据不能当零。过去食物/热量只读取当时记录。[历史 QA](qa/checkin-design/README.md)。
- `5905d75`（v33）：此前伴侣数据只有是否打卡，没有详情接口。根据用户要求加只读按日详情；最初迁移默认关闭，随后**用户明确要求默认共享、本人可关闭**，当前增量迁移覆盖为默认true、显式off优先。普通拉取不传全量详情，详情只在内存，按日RPC验证同家庭/角色/日期及嵌套白名单。[共享 QA](qa/partner-records/README.md)。
- `84e1a87`：伴侣摘要卡仍只显示打卡状态；详情在记录页查看，健康/目标/计划依旧本人可见，修正文案范围。

### 2026-10-09：三处餐次设计统一（v34，本次）

- 用户指出今日、饮食计划、伴侣历史区域难看。代码确认三条渲染路径独立，通用黄色 `.note`、蓝色 `.logged` 与灰色历史嵌套卡片造成层级冲突；`.logged small` 单行省略截掉实际食物。之前v32只改了部分容器，未把这些子区域统一；旧分段选中样式的选择器优先级还会让今日与饮食的同一状态颜色不同，本次一并移除旧覆盖。
- 共用标题、热量、计划内容与打卡按钮；移除目标区域的大色块和重复卡片边框，今日计划/实际以细分隔线分层，饮食四餐合成一个列表，历史改成餐次行与分隔线。数字与单位分层、长文字自然换行，两角色/主题沿用全局变量。
- 发现无饮食限制但有个性餐食时旧UI仍并列默认菜单，统一优先显示已确认个性餐食；有禁忌但缺计划时保留明确提示。今日“没吃”不再显示之前保留的食物热量，和历史/摄入计算语义一致，存储记录不被删除。
- 参考公开的 [Lifesum 餐次记录说明](https://help.lifesum.com/en/article/traditional-food-tracking-4nzcd7/) 与 [Cronometer 日记分区说明](https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview)的分组方式；这是公开说明参考，没有登录测试其原生应用，官方附图未成功加载，未宣称逐图复刻。具体视觉依据来自本应用截图及实际手机宽度审查。
- 证据、视口与操作验证：[餐次 QA](qa/meal-surfaces/README.md)。核心版本v34；无需SQL/云函数修改。

## 4. 后续修复流程

1. 先查症状矩阵和关联历史。记录当前网页、SW/素材、云端函数/SQL分别是什么版本，不能把不同发布层混为一谈。
2. 写下“已确认 / 推测 / 未知”，附复现条件和代码或日志证据。先修根因所在层，再检查所有共用入口；截图只是症状，不能单独证明网络/数据库原因。
3. 用合成资料复现；保留修改前后截图。不要把用户真实健康内容、口令、恢复码或身份凭据写进仓库和公开截图。
4. 数据兼容、个人隐私、离线缓存、未上传修改和迟到请求边界不能因样式优化改变。修改RPC必须提供增量SQL与权限/范围验证；消费类请求不得随意自动重试。
5. 对具体风险跑相关测试；样式至少检查两角色、浅/深色、320/390px、长文、空/已记录/没吃、本人今天可编辑、历史/伴侣只读。保留未保存身体输入。
6. 修改本文件和对应QA；`design.md` 记录当前视觉规则，专题README保存版本证据。发布递增核心版本，保留未变化的图片缓存；推送后检查Pages成功和线上核心文件一致。

### 新记录模板

- 日期 / 应用版本 / commit / 云端独立版本：
- 症状与复现条件：
- 原因与证据等级（已确认/推测/未知）：
- 修改入口、所有同类场景、数据兼容/隐私/缓存边界：
- 验证命令、实际结果、截图与尚未覆盖范围：
- 发布结果与回退位置：

## 5. 完整 Git 修改索引

以下是建仓至v33的全部60条提交（按时间正序），标题原文仅作为定位索引；标题不能替代上面的原因证据。本次v34见上一节和Git最新提交，避免在提交内部写自己的未知哈希。

| 日期（北京时间） | 提交 | 修改标题 |
| --- | --- | --- |
| 2026-09-29 11:16 | [`8678c07`](https://github.com/lcy1021/Fitpro/commit/8678c07) | 初始化：减脂打卡 App（index.html、config.js、CLAUDE.md） |
| 2026-09-29 11:18 | [`52b3ae5`](https://github.com/lcy1021/Fitpro/commit/52b3ae5) | 新增 Supabase 初始化脚本（表、RLS、三个 RPC 函数） |
| 2026-09-29 11:20 | [`e223b73`](https://github.com/lcy1021/Fitpro/commit/e223b73) | 填入 Supabase 项目地址和公开密钥 |
| 2026-09-29 11:34 | [`86b7de6`](https://github.com/lcy1021/Fitpro/commit/86b7de6) | 新增 Stitch 用的 DESIGN.md（从 index.html 提取的颜色、字体、组件与设计原则） |
| 2026-09-29 11:37 | [`6a1572f`](https://github.com/lcy1021/Fitpro/commit/6a1572f) | 新增 Fitpro.md：产品、功能、计划内容、设计与技术说明 |
| 2026-09-29 11:57 | [`ef718dd`](https://github.com/lcy1021/Fitpro/commit/ef718dd) | Fitpro.md：为每餐和晚餐轮换标注热量区间 |
| 2026-09-29 11:59 | [`e29d2b7`](https://github.com/lcy1021/Fitpro/commit/e29d2b7) | CLAUDE.md：约定修改时同步 index.html 与各文档 |
| 2026-09-29 12:02 | [`fa0a4a9`](https://github.com/lcy1021/Fitpro/commit/fa0a4a9) | 饮食页显示每餐、全天和晚餐轮换的估算热量区间，同步更新文档 |
| 2026-09-29 18:32 | [`5ed1ac2`](https://github.com/lcy1021/Fitpro/commit/5ed1ac2) | 今日页显示最近打卡时间和每餐具体食物热量；记录页新增两人形象卡 |
| 2026-09-29 19:02 | [`97e4d4a`](https://github.com/lcy1021/Fitpro/commit/97e4d4a) | 按 Gentler Couple 设计系统改版界面，新增并肩打卡条和热量环 |
| 2026-09-29 19:18 | [`65008f7`](https://github.com/lcy1021/Fitpro/commit/65008f7) | 新增训练动作示意图说明文档 |
| 2026-09-29 20:24 | [`d30a198`](https://github.com/lcy1021/Fitpro/commit/d30a198) | 全页面精修：身份色氛围、记录页重做、跟练页圆环倒计时 |
| 2026-09-29 21:15 | [`ea3cf3b`](https://github.com/lcy1021/Fitpro/commit/ea3cf3b) | 接入动作动图和形象表情反馈 |
| 2026-09-29 21:24 | [`648f9dc`](https://github.com/lcy1021/Fitpro/commit/648f9dc) | 新增目标与个性化计划：按身高体重算每日热量，自动调份量，每周给饮食和训练调整建议 |
| 2026-09-29 21:37 | [`ae3090d`](https://github.com/lcy1021/Fitpro/commit/ae3090d) | 新增一句话记饮食：内置约 180 种常见食物热量库，自动识别份量、算热量并打卡 |
| 2026-09-29 21:40 | [`151d012`](https://github.com/lcy1021/Fitpro/commit/151d012) | 新增可选的 AI 估算热量（Supabase Edge Function 调用 Claude） |
| 2026-09-29 21:43 | [`d988c00`](https://github.com/lcy1021/Fitpro/commit/d988c00) | AI 估算支持第三方中转，并固定函数运行地区 |
| 2026-09-29 21:43 | [`950b417`](https://github.com/lcy1021/Fitpro/commit/950b417) | ai-setup：换模型改用 AI_MODEL 设置 |
| 2026-09-29 21:57 | [`5ec37b2`](https://github.com/lcy1021/Fitpro/commit/5ec37b2) | 打开 AI 估算热量（meal-kcal 已部署，走米醋中转） |
| 2026-09-29 22:04 | [`e9ce195`](https://github.com/lcy1021/Fitpro/commit/e9ce195) | 修复 AI 估算报错看不到的问题，函数带回上游报错原因；食物库补充包子和高钙奶 |
| 2026-09-29 22:10 | [`76e1fbb`](https://github.com/lcy1021/Fitpro/commit/76e1fbb) | AI 估算支持 DeepSeek 兼容接口：兼容接口统一在提示词里要求只输出 JSON |
| 2026-09-29 22:11 | [`b8622b7`](https://github.com/lcy1021/Fitpro/commit/b8622b7) | AI 估算：支持自定义 User-Agent，文档补充米醋国产模型分组（vip_4）配置 |
| 2026-09-29 22:26 | [`5a34500`](https://github.com/lcy1021/Fitpro/commit/5a34500) | 修复记了饮食后页面被撑宽的问题，并防止 iOS 输入框自动放大 |
| 2026-09-29 22:31 | [`6073eec`](https://github.com/lcy1021/Fitpro/commit/6073eec) | 提示卡和打卡对勾改用 SVG 图标，图标源文件入库 |
| 2026-09-29 22:45 | [`d319bf1`](https://github.com/lcy1021/Fitpro/commit/d319bf1) | AI 估算提速：中转只请求一次，同一句话本机缓存，等待时显示秒数 |
| 2026-09-29 22:55 | [`ac7990c`](https://github.com/lcy1021/Fitpro/commit/ac7990c) | 接入主屏幕 App 图标（Fitpro，新设计的直角铺满版），去掉 Google Fonts |
| 2026-09-29 23:02 | [`3cb6b73`](https://github.com/lcy1021/Fitpro/commit/3cb6b73) | 接入登录动效：两个云朵跑近会合后弹出角色选择 |
| 2026-09-29 23:04 | [`7fec31f`](https://github.com/lcy1021/Fitpro/commit/7fec31f) | 每次打开 App 都播放登录动效：选过身份的会合后直接进主页，首次打开再选身份 |
| 2026-09-29 23:11 | [`f7537f4`](https://github.com/lcy1021/Fitpro/commit/f7537f4) | 品牌改名 DuoFit：App 显示名、文档和图标文件名 |
| 2026-09-29 23:16 | [`b1412af`](https://github.com/lcy1021/Fitpro/commit/b1412af) | 登录动效提速：WebP 图片、预加载、等图片解码再开跑、离线缓存 |
| 2026-09-30 00:26 | [`36b2cff`](https://github.com/lcy1021/Fitpro/commit/36b2cff) | 更新 DuoFit 登录流程、AI 错误提示与设计资源 |
| 2026-10-08 15:09 | [`10a72b9`](https://github.com/lcy1021/Fitpro/commit/10a72b9) | 上线私人健康伙伴四步建档流程 |
| 2026-10-08 15:16 | [`5baf0f3`](https://github.com/lcy1021/Fitpro/commit/5baf0f3) | 修复手机输入时页面自动放大 |
| 2026-10-08 15:24 | [`a5b4326`](https://github.com/lcy1021/Fitpro/commit/a5b4326) | 修复旧记录日期导入并显示 AI 分析状态 |
| 2026-10-08 15:39 | [`c555574`](https://github.com/lcy1021/Fitpro/commit/c555574) | 修复 AI 计划解析与错误状态 |
| 2026-10-08 15:51 | [`2950121`](https://github.com/lcy1021/Fitpro/commit/2950121) | 缩短 AI 识别等待并记录模型耗时 |
| 2026-10-08 16:09 | [`da73d8f`](https://github.com/lcy1021/Fitpro/commit/da73d8f) | 优化今日训练展示与休息日可选动作 |
| 2026-10-08 16:34 | [`3bb50cf`](https://github.com/lcy1021/Fitpro/commit/3bb50cf) | 修复健康伙伴云端启动卡顿并限制等待 |
| 2026-10-08 16:48 | [`40ea675`](https://github.com/lcy1021/Fitpro/commit/40ea675) | 修复 iOS 主屏幕图标读取 |
| 2026-10-08 17:07 | [`3a87b69`](https://github.com/lcy1021/Fitpro/commit/3a87b69) | Improve private coaching cards and mobile layouts |
| 2026-10-08 17:39 | [`c22ec3d`](https://github.com/lcy1021/Fitpro/commit/c22ec3d) | Show coaching details in plan and refresh app shell |
| 2026-10-08 17:57 | [`091b0d9`](https://github.com/lcy1021/Fitpro/commit/091b0d9) | Refine mobile icons and document UI design checks |
| 2026-10-08 18:16 | [`b6a3ead`](https://github.com/lcy1021/Fitpro/commit/b6a3ead) | Update DuoFit icon with larger vivid original mascots |
| 2026-10-08 18:25 | [`9dc8ce1`](https://github.com/lcy1021/Fitpro/commit/9dc8ce1) | Soften DuoFit icon background to highlight enlarged mascots |
| 2026-10-08 18:47 | [`5f944bc`](https://github.com/lcy1021/Fitpro/commit/5f944bc) | Complete coach dark themes and refine composer send control |
| 2026-10-08 19:11 | [`2df9aa3`](https://github.com/lcy1021/Fitpro/commit/2df9aa3) | Keep record settings clear of navigation and safe area |
| 2026-10-08 19:19 | [`240011d`](https://github.com/lcy1021/Fitpro/commit/240011d) | Fix clipped settings gear and synchronize icon asset |
| 2026-10-08 19:37 | [`9832530`](https://github.com/lcy1021/Fitpro/commit/9832530) | Start confirmed plans on day one and explain today's defaults |
| 2026-10-09 11:36 | [`e3211c4`](https://github.com/lcy1021/Fitpro/commit/e3211c4) | Keep saved DuoFit profiles available through startup failures |
| 2026-10-09 11:41 | [`de21d97`](https://github.com/lcy1021/Fitpro/commit/de21d97) | Align coaching AI wait times and clarify failures |
| 2026-10-09 11:55 | [`bb38cf1`](https://github.com/lcy1021/Fitpro/commit/bb38cf1) | Show weekly meal checkin history on diet page |
| 2026-10-09 13:53 | [`7087060`](https://github.com/lcy1021/Fitpro/commit/7087060) | Open cached private profile when cloud startup fails |
| 2026-10-09 14:25 | [`94e1f0d`](https://github.com/lcy1021/Fitpro/commit/94e1f0d) | Serialize cloud authentication and reconnect safely after transient failures |
| 2026-10-09 14:32 | [`d010621`](https://github.com/lcy1021/Fitpro/commit/d010621) | Let saved profiles open while cloud reconnects in the background |
| 2026-10-09 14:51 | [`7d96e7a`](https://github.com/lcy1021/Fitpro/commit/7d96e7a) | Handle complete AI meal responses and protect partial calorie estimates |
| 2026-10-09 15:14 | [`2317a4e`](https://github.com/lcy1021/Fitpro/commit/2317a4e) | Reduce animated image payloads and keep media cached across releases |
| 2026-10-09 15:32 | [`e95d5a5`](https://github.com/lcy1021/Fitpro/commit/e95d5a5) | Show entry before home and fix mobile movement preview sizing |
| 2026-10-09 16:36 | [`baf1876`](https://github.com/lcy1021/Fitpro/commit/baf1876) | Refresh meal journal and add private couple check-in history |
| 2026-10-09 17:09 | [`5905d75`](https://github.com/lcy1021/Fitpro/commit/5905d75) | Share partner meal and activity details with personal opt-out |
| 2026-10-09 17:11 | [`84e1a87`](https://github.com/lcy1021/Fitpro/commit/84e1a87) | Clarify the scope of partner summary cards |
