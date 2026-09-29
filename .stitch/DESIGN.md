---
version: alpha
name: 两个人的减脂打卡 · Gentler Couple
description: 夫妻两人共用的手机端减脂打卡工具。温暖奶油底色、柔和光晕白卡、超大圆角，老公蔚蓝、老婆草莓粉，两个软糖云朵形象陪伴，零焦虑。
colors:
  primary: "#0284C7"
  primary-ink: "#0369A1"
  primary-soft: "#E0F2FE"
  secondary: "#FF4B72"
  secondary-ink: "#E11D48"
  secondary-soft: "#FFE4E6"
  tertiary: "#F59E0B"
  tertiary-ink: "#B45309"
  tertiary-soft: "#FEF3C7"
  success: "#15803D"
  success-soft: "#DCFCE7"
  neutral: "#FDFAF6"
  surface: "#FFFFFF"
  surface-sunk: "#F6F3EE"
  obsidian: "#181C24"
  on-obsidian: "#F1F5F9"
  on-surface: "#192024"
  on-surface-muted: "#64748B"
  on-surface-faint: "#94A3B8"
  on-accent: "#FFFFFF"
  error: "#C2410C"
  dark-primary: "#38BDF8"
  dark-secondary: "#FF7A95"
  dark-tertiary: "#FBBF24"
  dark-neutral: "#101318"
  dark-surface: "#191D24"
  dark-surface-sunk: "#222731"
  dark-on-surface: "#EEF1F4"
  dark-on-surface-muted: "#9AA5B4"
typography:
  display-timer:
    fontFamily: PingFang SC
    fontSize: 72px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: '"tnum"'
  headline-lg:
    fontFamily: PingFang SC
    fontSize: 30px
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: -0.01em
  headline-md:
    fontFamily: PingFang SC
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: PingFang SC
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.3
  metric:
    fontFamily: PingFang SC
    fontSize: 26px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.02em
    fontFeature: '"tnum"'
  title-md:
    fontFamily: PingFang SC
    fontSize: 17px
    fontWeight: 800
    lineHeight: 1.3
  title-sm:
    fontFamily: PingFang SC
    fontSize: 15px
    fontWeight: 800
    lineHeight: 1.3
  body-md:
    fontFamily: PingFang SC
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: PingFang SC
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
  label-md:
    fontFamily: PingFang SC
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.3
  label-pill:
    fontFamily: PingFang SC
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.3
  label-caption:
    fontFamily: PingFang SC
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: 14px
  md: 20px
  lg: 26px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 22px
  gutter: 16px
  max-width: 520px
  tabbar-clearance: 104px
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 16px
  card-hero:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-obsidian:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.on-obsidian}"
    rounded: "{rounded.lg}"
    padding: 18px
  button-cta:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.full}"
    padding: 15px
  button-cta-wife:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.full}"
    padding: 15px
  button-soft:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 18px
  identity-toggle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 4px
  segmented-checkin:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 9px 4px
  segmented-checkin-plan:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
  segmented-checkin-over:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.tertiary-ink}"
  segmented-checkin-skip:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
  progress-bead:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-caption}"
    rounded: "{rounded.full}"
    size: 28px
  progress-bead-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
  progress-bead-over:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.tertiary-ink}"
  kcal-pill:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-pill}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  chip-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label-pill}"
    rounded: "{rounded.full}"
    padding: 3px 10px
  input-field:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 11px 14px
  note-callout:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-caption}"
  toast:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 9px 16px
---

# 两个人的减脂打卡 · Gentler Couple

## Overview

夫妻两人共用的手机端减脂打卡工具，核心目标是**降低每天执行的思考成本**：打开就知道今天吃什么、练什么，一键打卡，并能看到对方的进度互相督促。视觉对标 Gentler Streak 的治愈系风格。

- **用户**：老公（`hus`）和老婆（`wife`），各用自己的手机，从浏览器"添加到主屏幕"使用。两人都是电脑工作者，工作日约 8:00–20:00 在工位；家里有 1 岁宝宝，周六训练是"可选"的。
- **气质**：温暖、柔软、零焦虑。奶油底色上漂浮的白卡、柔和光晕、超大圆角和两个软糖云朵形象，让它像一个贴心的家庭小伙伴，而不是冷冰冰的健身仪表盘。不做热量计算（不让输入、不做超标提醒）、不做排行榜；热量只以估算区间作参考。"吃多了"只说"下一顿正常吃就好"。
- **双端镜像**：老公端和老婆端的组件结构、间距、层级、操作路径 1:1 相同，差异只在身份色（蔚蓝 / 草莓粉）、形象和各自的计划数据。页面主色跟随"我是谁"切换（`body.me-hus` / `body.me-wife` → `--me*` 变量），属于某个人的内容用他自己的颜色（`.hus` / `.wife` → `--p*` 变量）。
- **产品的原生形态是"一天 × 两个人"**：一天由四餐（早 / 午 / 加 / 晚）+ 一次训练组成，两个人并排对照。首页最重要的是「今天两个人的进度」。
- **四个标签页**：今日、饮食、训练、记录。另有两个全屏层：身份选择、训练跟练。
- 文案用中文，简洁口语化，例如"按计划吃了 ✨ / 吃多了 🍰 / 没吃""▶ 开始训练""并肩打卡 4 天"。只展示真实数据，不出现心率、恢复指数、默契度这类 App 没有来源的数字。

## Colors

温暖奶油中性色承托两个人的身份色，暖杏黄负责"温和提醒"。支持浅色和深色两套（深色值以 `dark-` 前缀给出，跟随系统 `prefers-color-scheme`）。

- **活力蔚蓝 Primary (#0284C7)**：老公的身份色。渐变 `#38BDF8 → #0284C7` 用于主按钮和打卡按钮，配蔚蓝弥散光晕 `0 8px 24px -4px rgba(2,132,199,.35)`；浅底 **#E0F2FE** 用于他的进度行、热量胶囊、周计划行；文字用深一档 **#0369A1**。
- **治愈草莓粉 Secondary (#FF4B72)**：老婆的身份色，用法与蔚蓝完全对称。渐变 `#FF758C → #FF4B72`，浅底 **#FFE4E6**，文字用 **#E11D48**（纯 #FF4B72 做小字对比度不够）。
- **暖杏黄 Tertiary (#F59E0B)**：唯一的提醒色，用于"吃多了"（浅底 **#FEF3C7** + 黄描边 + 深字 **#B45309**）、提示卡底色、"并肩打卡"的火苗底。表达"注意一下"，不是"错了"。
- **嫩芽绿 Success (#15803D / #DCFCE7)**：今天全部完成的胶囊、"今晚"标签、外卖"优先选"。
- **奶油暖白 Neutral (#FDFAF6)**：页面底色，叠加三团极淡的径向光晕（杏、蓝、粉）。
- **Surface (#FFFFFF)** 白卡；**Surface Sunk (#F6F3EE)** 卡内凹陷层（食物清单、输入框、未选中的分段按钮、次要按钮）。
- **深曜石 Obsidian (#181C24)**：训练卡专用深色卡片，右上角带当前身份色的径向微光，让训练成为页面焦点。
- **文字**：正文 **#192024**，说明 **#64748B**，弱化 **#94A3B8**。**Error (#C2410C)** 只用于同步异常提示。

## Typography

中文用系统字体：**PingFang SC**，回退 Hiragino Sans GB、Noto Sans SC、Microsoft YaHei、system-ui。不加载网络字体（国内访问谷歌字体不稳定）。层级靠字重：标题 800，小标题 700–800，正文 400；标题字距 -0.01em。

- **大计时数字（display-timer）**：72px / 800，等宽数字，跟练倒计时。
- **页面标题**：顶部"今日 / 饮食 / 训练 / 记录"24px / 800，后面跟一个当前身份色的小圆点；身份选择页 30px。
- **训练卡标题**：22px / 800。
- **数字指标（metric）**：26px / 800 等宽，用于热量环中心；体重 24px、连续天数 20px。
- **分区标题**：17px / 800；卡片标题 15–16px / 800。
- **正文**：15px / 400，行高 1.6；卡内说明 13px Muted。
- **胶囊和标签**：12px / 700；底部标签栏 11px。

## Layout

- **手机优先的单栏**，内容最大宽度 520px 居中，左右 16px，底部预留 104px 给毛玻璃标签栏，处理 iPhone 安全区。
- 分区之间 22px，分区标题与内容 10px，同一分区卡片间距 10px，卡内边距 16–18px。
- **顶部栏**：左侧页面标题 + 日期；右侧"老公 ⇄ 老婆"身份胶囊（当前身份高亮为浅底 + 深字，点击打开身份选择）+ 44px 当前身份形象头像。
- **今日**：并肩打卡条 → 今天两个人的进度 → 今天的训练（深曜石卡）→ 今天吃什么（四张餐卡）→ 工位起身计数。
- **两人进度行**：44px 形象头像 / 名字 + 最近打卡时间 + 5 颗 28px 圆形进度珠 / 连续天数。
- **饮食**：看谁的计划切换 → 今天吃了多少（热量环）→ XX 的一天 → 晚餐轮换 → 点外卖怎么选 → 常见场景。
- **训练**：这周两个人的安排（周表头 + 两人各一行浅色块）→ 看谁的计划切换 → 训练内容（深曜石卡 + 编号动作）→ 工位 3 分钟动作格。
- **记录**：两个人的记录（两张形象卡）→ 记录我的数据 → 趋势图 → 历史 → 同步设置。

## Elevation & Depth

柔和的"光晕深度"，不用生硬投影：

- **底层**：奶油底色 + 三团极淡径向光晕，固定不随滚动。
- **白卡**：`0 4px 20px -2px rgba(25,32,36,.05), 0 1px 3px rgba(25,32,36,.03)`。
- **深曜石训练卡**：更明显的抬升 `0 12px 32px -8px rgba(25,32,36,.18)`。
- **主按钮 / 选中的打卡按钮**：身份色弥散光晕（`--me-glow`）+ 顶部 1px 内高光。
- **标签栏**：88% 白 + 16px 背景模糊的毛玻璃。
- 卡内层级用凹陷层（Sunk）而不是再加阴影。

## Shapes

超大圆角、全胶囊交互：大卡片（进度卡、训练卡、形象卡）26px，普通卡片 20px，食物清单、输入框、动作行 14px。所有按钮、分段打卡、身份胶囊、标签、进度珠都是全圆角；形象头像是正圆，外圈 2–3px 身份色描边。

## Components

- **身份胶囊 + 头像**：白色胶囊里"老公 ⇄ 老婆"，当前身份一侧填浅身份色；右侧当前身份的形象头像，白色内圈 + 身份色外圈。
- **并肩打卡条**：白色胶囊，左侧浅黄圆底 🔥，"并肩打卡 N 天"（两个人都完成的连续天数），右侧"今天 x/y"胶囊（全部完成变嫩芽绿）。
- **两人进度卡**：每人一行浅身份色块，形象头像 + 名字 + "最近打卡 今天 12:35" + 5 颗圆珠。珠子：未打卡为白底描边 + 灰字"早/午/加/晚/练"；按计划 / 训练完成为身份色实心 + 白色 ✓ + 同色光晕；吃多了为浅黄底黄描边 ✓；没吃为凹陷灰"–"；休息日为描边空心"休"。
- **深曜石训练卡**：半透明白描边小标签（"💪 今天训练 · 老公""☁️ 今天可选""🌿 今天休息"），22px 训练名，说明文字 65% 白，动作胶囊（名字 + 次数），底部全宽身份色渐变 CTA"▶ 开始训练"；已完成时 CTA 变为半透明"✓ 今天已完成"（点击撤销）。训练页里同样的卡片展开为编号动作列表：序号圆 + 动作名 + 要点 + 身份色半透明次数胶囊。
- **餐卡 + 三段打卡**：左侧 36px 圆角方块 emoji（🍳🍱🍎🥗）+ 餐名 + 时间，右侧浅身份色"约 330–465 kcal"胶囊；中间凹陷层食物清单，每行食物名 + Muted 份量（可替换项接在后面），右侧粗体 kcal；底部三个胶囊按钮"按计划吃了 ✨ / 吃多了 🍰 / 没吃"。选中"按计划"为身份色渐变 + 光晕，"吃多了"为浅黄 + 黄描边，"没吃"为墨色反白。
- **热量环**：128px 环形，12px 粗，身份色渐变描边，灰色底轨；中心"已吃约 / 1098 / kcal"。右侧形象 + 一句温和提示（"已打卡 2/4 餐，剩下的按计划来"）+"全天计划 1235–1885"胶囊；下方四格显示每餐打卡状态。已吃按打卡估算：按计划计入这顿区间，吃多了按上限，没吃为 0。底部注明"只按打卡的餐次估算，不是精确计算"。
- **提示卡（note）**：浅黄底圆角卡，左侧 🥑，用于"吃多了没关系"、备菜、训练安全提示。
- **形象卡**：记录页两张并排白卡，顶部淡淡的身份色渐变，84px 形象头像（身份色描边 + 光晕）→ 身份色名字 → 24px 最新体重 → 围度、近 4 周变化、最新日期。变化量用中性色。
- **计数器**：左侧浅身份色图标块 🧘，中间标题和说明，右侧凹陷胶囊里"− 2/6 次 +"，加号为身份色渐变圆。
- **角色形象**：老公是青蓝色软糖云朵小人（跑步），老婆是粉色软糖云朵小人（系发带、盘腿坐），3D 毛绒质感、透明底。
- **标签栏**：毛玻璃，四个线性图标；当前页为身份色深字 + 下方 4px 小圆点。
- **跟练模式**：奶油底全屏，顶部白胶囊"退出"+ 进度文字，8px 身份色渐变进度条，4:3 虚线占位框，动作名 28px，次数 18px 身份色，底部大按钮。
- **Toast**：底部居中墨色胶囊。

## Do's and Don'ts

- Do：让"两个人并排"始终可见；首页先放两人进度，再放自己的操作。
- Do：身份色只表达"这是谁的"；自己的操作用自己的颜色，对方的内容用对方的颜色。
- Do：每个打卡都是一次点击，不弹确认框，不要求输入数字（身体数据除外）。
- Do：所有展示的数字都来自打卡、计划或身体记录；估算值要标"约"。
- Do：粉色做文字时用 #E11D48，保证浅色背景上的对比度；遵循系统"减少动态效果"。
- Don't：不要编造心率、恢复指数、默契度、步数等 App 没有数据来源的指标。
- Don't：不要让用户输入热量、不要做"超标"提醒；不要加食物搜索、排行榜、徽章或红色惊叹号。
- Don't：不要把"吃多了"做成红色或负面表达，它只用暖杏黄。
- Don't：不要给老婆的方案出现激进节食或高强度内容；她的训练是 15 分钟居家徒手跟练。
- Don't：不要用生硬的灰色边框和重投影；卡片靠白卡 + 柔光晕 + 凹陷层区分。
- Don't：不要在动作示意位置使用来源不明的网络 GIF，保留占位框。
