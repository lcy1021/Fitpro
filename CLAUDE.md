# 两个人的减脂打卡 App

夫妻两人共用的手机端减脂打卡工具。核心目标是**降低每天执行的思考成本**：打开就知道今天吃什么、练什么，一键打卡，并能看到对方的进度互相督促。

## 用户与场景

- 两个用户：老公（`hus`）和老婆（`wife`），各用自己的手机
- 两人都是电脑工作者，工作日约 8:00–20:00 在工位，下班后时间很少
- 有一个 1 岁宝宝，周六通常要自己带娃，周六训练是"可选/弹性"的
- 老公接受运动，老婆不太爱运动：她的方案要低门槛（15 分钟居家跟练）
- 主要在国内使用，手机浏览器打开，添加到主屏幕

## 技术形态

- 纯静态页面：`index.html` 单文件（HTML + CSS + 原生 JS，无构建步骤），部署在 GitHub Pages
- `config.js`：Supabase 的 Project URL 和公开密钥，**独立文件，更新 App 时不要覆盖它**，也不要把密钥写进 `index.html`
- 同步：Supabase 免费版，通过 REST 调用 RPC 函数（不用 supabase-js），见 `supabase-setup.sql`
- 本地缓存：`localStorage`，离线时先存本地，恢复网络后自动补传（`dirty` 队列）
- 同步时机：打开时、切回前台、每 30 秒、每次打卡后

### 数据与安全模型

- 表：`checkins`、`measures`，主键 `(family, id)`，`body` 为 jsonb
- 表开启 RLS 且不加策略，公开密钥无法直接读写；只能通过三个 `security definer` 函数访问：
  - `fl_pull(p_family, p_since)`：拉取该家庭的打卡（近 120 天）和全部身体数据
  - `fl_put_checkin(...)` / `fl_put_measure(...)`：upsert 单条记录
- `family` 是"家庭口令"（8–40 位字母数字），首次使用时生成；邀请信息里链接与口令分开，对方手动输入，存在 localStorage。旧版 `#k=<口令>` 链接不再自动导入口令
- 函数里限制了 `person` 只能是 `hus` / `wife`，以及 body 大小上限

### 数据格式（改动时必须保持兼容）

- checkin id：`<person>_<YYYY-MM-DD>`，body：`{person, date, meals:{breakfast|lunch|snack|dinner: "plan"|"over"|"skip"}, workout: "done"|null, stand: number, updatedAt}`
- checkin body 可选 `food:{breakfast|lunch|snack|dinner:{text, items:[{n,q,k}], kcal}}`：用一句话记录的实际吃的东西（text ≤200 字，n 食物名，q 份量文字，k 热量）。保存时自动设 meals 状态：不超过这顿计划上限 ×1.1 记 plan，否则 over；热量环优先用 kcal
- measure id：`<person>_<YYYY-MM-DD>`，body：`{person, date, weight?, waist?, hip?, thigh?, goal?}`
- `goal`：`{height, age, start, target, pace:"gentle"|"standard", adj(热量微调), level(训练轮数 ±), cardio(周四快走), mode:"maintain"|null, at(设定日期)}`，写在设定/调整当天的身体记录里，当前目标 = 最近一条带 goal 的记录（`goalOf`）。只有 goal 没有体重围度的记录不进图表和"最近更新"
- 新增字段可以直接加进 body，不需要改数据库；**不要重命名已有字段、不要改 id 格式或 person 标识**，否则旧数据会对不上
- 需要改数据库的情况：加第三个人、存图片视频、单条记录超出大小限制、新增完全独立的数据类型。这时要同时给出增量 SQL，不能破坏已有数据

## 功能结构

- 每次打开：选过身份的播 `openSplash`（跑近会合后淡出进主页，点任意处可跳过）；首次进入：登录动效（`#pick` 里的 `.lm` 场景，阶段 start→run→meet→choose，设计源在 `UIset/login-motion/`，跑步形象 `assets/login/*.webp`，在 `<head>` 里预加载，解码完再开跑），再选择"我是老公 / 我是老婆"（切换身份时直接到选择这一步）；随后先输入或生成家庭口令，再设定目标（身高、年龄、当前/目标体重、速度）；右上角可切换身份
- **目标与个性化计划**（`calcPlan` / `menuFor` / `suggestionsFor` / `roundsFor`）：
  - **计算**：基础代谢按 Mifflin-St Jeor 公式（身高、年龄、体重、性别），× 1.35（久坐上班 + 每周练 3 次）得到每天消耗；温和速度每天少吃 300 kcal、标准少吃 500 kcal。
  - **安全限制**：每周减重不超过体重的 1%；每天热量不低于老公 1500 / 老婆 1200 kcal；目标体重不能低于 BMI 18.5（低于时不能保存）；目标不低于当前体重时按维持安排。蛋白质按体重 × 1.6 g。
  - **份量**：食物清单不变，按热量目标调份量——优先调晚餐米饭、加餐坚果（老公）、午餐米饭，其次荤菜克数和面包片数；没设目标时显示原来的默认份量。
  - **每周建议**（设定或上次调整满 7 天后，在今日页顶部出现，点"按建议调整"才生效，"先不用"本周不再提示）：
    - 最近 2 周每周掉得超过体重 1% → 每天多吃 150 kcal
    - 最近 3 周体重基本没动（且训练完成过半）→ 每天少吃 150 kcal（不低于下限），并建议周四加一次可选的"快走 30 分钟"
    - 离目标 1 kg 以内 → 切换到维持
    - 最近 2 周训练全部完成 → 每次多练一轮（老公最多 4 轮、老婆最多 3 轮）；完成不到一半 → 少练一轮（老公最少 2 轮、老婆最少 2 轮），这时不建议减热量
- **今日**：并肩打卡条（两人都完成的连续天数 + 今天 x/y）；两个人今天的进度（四餐 + 训练），连续打卡天数，每人最近一次打卡时间（取该人所有打卡记录里最大的 `updatedAt`）；自己的四餐打卡（按计划吃了 / 吃多了 / 没吃）、今日训练、工位起身次数
- **饮食**：可切换查看老公或老婆的计划；热量环（按今天打卡估算已吃多少：按计划计区间、吃多了计上限、没吃计 0）；每日饮食结构、周一到周五晚餐轮换、外卖挑选、常见场景提示
- **训练**：这周两个人的安排并排显示；可切换查看对方训练内容，但只有自己的训练能点"开始"；跟练模式逐个动作显示次数、要点、计时和组间休息，练完打卡
- **记录**：洞察卡（两人连续打卡）；两人并排形象卡（`assets/avatar-hus.png` / `avatar-wife.png`，源图在 `UIset/`；最新体重、围度、近 4 周体重变化、最新日期）；大数字输入块（体重、腰围，老婆额外臀围、大腿围，显示较上次变化）；一张趋势图切换体重/腰围/臀围（两人各占半区、各自缩放）；最近更新 6 条；家庭同步口令卡（只显示前 4 位）
- 角色形象：基础头像 `assets/avatar-*.png`（源图在 `UIset/`）；7 种表情 `assets/mood/{hus,wife}-{workout,meal,weigh,happy,sad,day-done,day-missed}.png`（256px 副本，原图在 `assets/mascots/`），用 `mood(person,state)` 取路径、`react(state,标题,说明,big)` 弹出反馈；每种表情用在哪里见 `docs/mascot-design.md` 4.1。`sad` 只用于空数据，不用于"吃多了/没吃"
- 动作示意：`assets/moves/<img>.gif`（`WORKOUTS` 里每个动作的 `img` 字段，热身放松见 `LIST_MOVE_MEDIA`），跟练页大图、训练页动作列表和工位动作格都显示

## 计划内容

### 饮食（工作日）

| 餐次 | 老公 | 老婆 |
|---|---|---|
| 早餐 7:00 | 鸡蛋 2 个 + 牛奶/无糖豆浆 250ml + 全麦面包 2 片（或玉米 1 根） | 鸡蛋 1 个 + 牛奶/无糖豆浆 250ml + 全麦面包 1 片（或半根玉米） |
| 午餐 12:00 | 外卖/食堂，米饭 2/3 份，要有肉蛋鱼 | 同套餐，米饭 1/2 份 |
| 加餐 16:00 | 无糖酸奶 + 水果；喝拿铁则当加餐 | 酸奶、水果、拿铁三选一 |
| 晚餐 20:00 后 | 瘦肉/鱼虾 150g + 蔬菜 300g + 少量主食 | 瘦肉/鱼虾 100g + 蔬菜 250g，主食可不吃 |
| 蛋白质 | 约 120–130g | 约 80–90g |

- 打卡本身仍然是一次点击（按计划吃了 / 吃多了 / 没吃）；**可选**地用一句话记"实际吃了什么"来算热量（内置食物库 `FOOD_DB` + `parseMeal`），不做食物搜索页、不做"超标"警告
- 每餐的具体食物和热量在 `MEAL_FOODS`（每项 `k:[低,高]` kcal，`or` 替换选项，`opt` 可省，`pick1` 几样选一样），每餐和全天区间由 `mealRange` / `dayKcal` 加总得出，不要手写合计。今日页餐卡逐项显示食物和热量；饮食页每餐一行小字显示区间；晚餐轮换的区间写在 `DINNERS[d].kcal`，按当前查看的人显示。热量只作参考，打卡仍然不需要输入数字
- "吃多了"不做负面提示，只提示下一顿正常吃
- 老婆本身体重在正常范围，目标是体成分和线条改善，不是大幅减重；不要加入激进节食类内容

### 训练

- 老公：哑铃循环训练，A/B 按 ISO 周奇偶交替（偶数周 周一 A、周三 B、周五 A；奇数周相反），周六可选，3 轮，动作间休息 15 秒、轮间 60 秒
- 老婆：臀腿跟练 6 个徒手动作，周一、周三；周五、周六可选；2 轮，熟练后 3 轮
- 工位 3 分钟：两人通用，不计入训练打卡
- 周日：休息 + 备菜 + 量体重腰围

## 待办

- AI 估算（可选）：`supabase/functions/meal-kcal/index.ts`（Edge Function，调用 Claude `claude-opus-5-5` + 结构化输出，校验家庭口令、按家庭每日限额 `fl_ai_quota`，见 `supabase-ai-setup.sql`）；`config.js` 的 `AI_KCAL` 为 true 时弹窗才显示 AI 按钮，`AI_REGION` 用 `forceFunctionRegion` 把函数固定在项目地区（避免分到连不上 Claude 的香港节点）。支持第三方中转：Secrets 里的 `ANTHROPIC_BASE_URL`（兼容 Anthropic Messages API 的地址）、`ANTHROPIC_AUTH_TOKEN`（Bearer 认证）、`AI_MODEL`、`AI_USER_AGENT`（中转要求特定 UA 时）；走中转时只请求一次、不带结构化输出；页面把估算过的原话缓存在本机 `fatloss.aicache`（最多 60 条），同一句话不再调用 AI；当前用米醋 `vip_4` 国产模型分组（DeepSeek），米醋的 Claude 分组只接受 Claude Code 客户端，不要为此伪装客户端；走中转/兼容接口（如 DeepSeek `https://api.deepseek.com/anthropic`）时不用 beta 参数，提示词里同时要求只输出 JSON，结构化输出被拒就去掉再试**API Key 只能放在 Supabase Secrets，绝不能写进仓库或页面**
- 食物库 `FOOD_DB`：`[名称, 别名(|分隔), 每100g kcal, {单位:克数}, 默认单位]`，数值参考《中国食物成分表》第 6 版，外卖菜按常见一份估算。加新食物时别名不要用单个常见字（如"糖""油"之外的），避免误匹配；改完用几句常见说法测一下 `parseMeal`
- 动作示意图已完成（`assets/moves/*.gif`，说明见 `docs/exercise-illustrations.md`）；新增动作时要同时补对应的动图，不要用来源不明的网络 GIF
- 可能需要：数据导出/导入备份

## 视觉

- 设计规范以 `.stitch/DESIGN.md` 为准（来源：`UIset/DuoFit_dual_design_system/`）。老公蔚蓝 `#0284C7`、老婆草莓粉 `#FF4B72`，奶油底、白卡柔光晕、大圆角、深曜石训练卡
- CSS 里 `--me*` 是当前身份色（`body.me-hus/.me-wife`），`--p*` 是某个人的颜色（元素上加 `.hus/.wife`），新组件优先用这两组变量
- 只展示真实数据，不要照搬 Stitch 稿里的心率、恢复指数、默契度等虚构指标

- 图标：24 个线性 SVG 图标，源文件 `UIset/icons/`，页面里是内联 `<symbol id="ic-名称">`，用 `icon(名称, "sm"|"lg")` 插入；改图标要同时改源文件和 `index.html` 里同名 symbol。没有图标的地方先用 emoji

- App 图标：当前为 v3，保留蓝粉立体云朵角色，放大人物、减少留白，保留鲜明主体色，以淡奶油白背景和极淡蓝粉光晕突出角色。`assets/icons/` 由 `UIset/logo/duofit-app-icon-fullbleed.png` 直接缩放，不裁切；源图直角、背景铺满，手机系统自行切圆角。同步维护 `UIset/duofit-app-logo.png`、`UIset/logo/` 的 master / 各尺寸素材与根目录 `apple-touch-icon.png`；页面、manifest 和通知使用 `?v=logo3`，换图时同时更新 URL 和缓存版本。`manifest.webmanifest` 和 `apple-mobile-web-app-title` 设主屏幕名称 DuoFit。不加载网络字体（国内访问 Google Fonts 会拖慢首屏）

- 离线缓存 `sw.js`：页面、脚本和样式优先联网取新版，断网时回退缓存；图片先读缓存并后台更新。Supabase 和 AI 请求不经过缓存。改了缓存逻辑或要强制刷新时，改 `sw.js` 里的 `CACHE` 版本号

## 协作约定

- 用户是资深 B 端产品设计师，改界面时注重交互细节和一致性
- 较大的改动先用 Markdown 说明方案，确认后再改代码
- 文案用中文，简洁口语化
- 每次改完用手机尺寸预览检查；提交前说明改了什么
- 用户说"修改"时，默认要同步改 `index.html`（界面和内容），不能只改文档。`DuoFit.md`、`.stitch/DESIGN.md`、`CLAUDE.md` 要和 `index.html` 保持一致：改了其中一处，其他相关的地方一起更新

### 私人健康伙伴迁移（新）

- `private-coach.js` / `private-coach.css` 提供匿名身份和个人恢复码、四步对话式档案、每周确认、每日替代和通知入口；`index.html` 的旧本地模式继续保留，云模式改用本人账号。
- 新表与 RPC 在 `supabase-private-coach.sql`；旧 `fl_pull/fl_put_*` 在迁移后撤权。`fl_private_pull` 只返回本人完整记录和伴侣的打卡布尔值、相对体重曲线。不能重新向伴侣返回原始健康记录。
- `supabase/functions/coach` 是 AI 顾问；`weekly-push` 与 `supabase-weekly-push.sql` 是可选的后台周提醒。配置和上线步骤见 `docs/private-coach-setup.md`。
- 运行 `node tests/scenarios.js` 验证旧场景和新私密视图。修改内联脚本后再提取并执行 `node --check`；Node 24 可用 `--experimental-strip-types --check` 检查 Edge Functions 的 TS 语法。


## 深色模式与健康伙伴（2026-10-08）

- 四步目标建档、首周计划、每周确认、每日调整、恢复码与清除登录弹窗统一使用主界面的 `--bg / --surface / --sunk / --ink / --muted` 主题变量，跟随系统深色模式；蓝色、粉色身份分别使用对应的深色强调色。伴侣趋势卡、通知提醒卡也跟随主题。
- 输入框、未选/已选项、在线/离线提示、AI 理解卡、加载和错误提示均有深色样式；原生输入控件声明 `color-scheme`，浏览器顶栏颜色跟随系统明暗。动作插画容器使用主题底色，图片自身的浅色画布保留。
- 发送入口采用 44×44 px 圆角按钮、22 px Lucide SVG 箭头、轻渐变和焦点轮廓；空白输入禁用，输入后启用，分析中显示旋转状态并禁用重复发送，失败保留原文用于重试。
- 样式和脚本使用 `?v=19`，离线缓存更新为 `duofit-v19`。浅色/深色与蓝色/粉色分别检查 320、375、390、430 px 宽度；场景截图与检查记录在 `docs/qa/dark-mode/README.md`，本机复现入口在 `tests/theme-preview.html`。
