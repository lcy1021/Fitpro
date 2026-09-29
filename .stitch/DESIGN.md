---
version: alpha
name: 两个人的减脂打卡
description: 夫妻两人共用的手机端减脂打卡工具。打开就知道今天吃什么、练什么，一键打卡，并能看到对方的进度互相督促。
colors:
  primary: "#1F6F5C"
  primary-soft: "#D5E9E2"
  secondary: "#A2476F"
  secondary-soft: "#F2DCE6"
  tertiary: "#E0A020"
  tertiary-soft: "#F8EACB"
  neutral: "#EDF1EF"
  surface: "#FFFFFF"
  surface-sunk: "#E3E9E6"
  on-surface: "#17262B"
  on-surface-muted: "#5E6E72"
  outline: "#D3DCD8"
  on-accent: "#FFFFFF"
  error: "#B23A3A"
  dark-primary: "#4DB394"
  dark-primary-soft: "#1D3A33"
  dark-secondary: "#DA7CA5"
  dark-secondary-soft: "#3A2330"
  dark-tertiary: "#EDB43C"
  dark-tertiary-soft: "#3A3120"
  dark-neutral: "#0F1719"
  dark-surface: "#172225"
  dark-surface-sunk: "#1E2B2E"
  dark-on-surface: "#E4EDEA"
  dark-on-surface-muted: "#93A4A1"
  dark-outline: "#2A393C"
  dark-error: "#E36B6B"
typography:
  display-timer:
    fontFamily: Noto Sans SC
    fontSize: 72px
    fontWeight: 900
    lineHeight: 1
    fontFeature: '"tnum"'
  headline-lg:
    fontFamily: Noto Sans SC
    fontSize: 32px
    fontWeight: 900
    lineHeight: 1.3
  headline-md:
    fontFamily: Noto Sans SC
    fontSize: 28px
    fontWeight: 900
    lineHeight: 1.3
  headline-sm:
    fontFamily: Noto Sans SC
    fontSize: 22px
    fontWeight: 900
    lineHeight: 1.3
    letterSpacing: 0.5px
  stat:
    fontFamily: Noto Sans SC
    fontSize: 20px
    fontWeight: 900
    lineHeight: 1.1
  title-lg:
    fontFamily: Noto Sans SC
    fontSize: 17px
    fontWeight: 900
    lineHeight: 1.3
  title-md:
    fontFamily: Noto Sans SC
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
  title-sm:
    fontFamily: Noto Sans SC
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.3
  body-md:
    fontFamily: Noto Sans SC
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Noto Sans SC
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: Noto Sans SC
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.3
  label-sm:
    fontFamily: Noto Sans SC
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label-xs:
    fontFamily: Noto Sans SC
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: 10px
  md: 14px
  lg: 22px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  gutter: 16px
  section: 20px
  max-width: 520px
  tabbar-clearance: 96px
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 14px 16px
  card-hero:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 18px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 18px
  button-primary-wife:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 18px
  button-ghost:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px 18px
  button-done:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.full}"
  role-chip:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 6px 8px 6px 14px
  role-picker-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
    padding: 22px 20px
  segmented-checkin:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 7px 4px
  segmented-checkin-plan:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
  segmented-checkin-over:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.on-surface}"
  segmented-checkin-skip:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
  progress-bead:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-xs}"
    rounded: 9px
    height: 30px
  progress-bead-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
  progress-bead-over:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.on-surface}"
  person-switch:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.full}"
    padding: 3px
  counter-button:
    backgroundColor: transparent
    rounded: "{rounded.full}"
    size: 36px
  input-field:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 9px 10px
  note-callout:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
    padding: 12px 16px
  tag:
    backgroundColor: "{colors.tertiary}"
    textColor: "#1B1B1B"
    typography: "{typography.label-xs}"
    rounded: "{rounded.full}"
    padding: 1px 8px
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-sm}"
  toast:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 9px 16px
---

# 两个人的减脂打卡

## Overview

夫妻两人共用的手机端减脂打卡工具，核心目标是**降低每天执行的思考成本**：打开就知道今天吃什么、练什么，一键打卡，并能看到对方的进度互相督促。

- **用户**：老公（`hus`）和老婆（`wife`），各用自己的手机，从浏览器"添加到主屏幕"使用。两人都是电脑工作者，工作日约 8:00–20:00 在工位；家里有 1 岁宝宝，周六训练是"可选/弹性"的。
- **气质**：安静、克制、像一个贴心的家庭小工具，而不是健身房 App。不做热量计算、不做排行榜、不制造焦虑。"吃多了"不做负面提示，只说"下一顿正常吃就好"。
- **产品的原生形态是"一天 × 两个人"**：一天由四餐（早 / 午 / 加 / 晚）+ 一次训练组成，两个人并排对照。首页最重要的元素是「今天两个人的进度」——两条并排的进度珠串，其次才是自己的打卡操作。
- **身份色贯穿全局**：老公是深松绿，老婆是玫瑰莓红。页面主色跟随"我是谁"切换（`body.me-hus` / `body.me-wife`），看对方内容时使用对方的颜色。
- **四个标签页**：今日、饮食、训练、记录。另有两个全屏层：首次进入的身份选择（"我是老公 / 我是老婆"），以及训练跟练模式（逐个动作、大号计时、组间休息）。
- 文案用中文，简洁口语化，例如"按计划吃了 / 吃多了 / 没吃""开始训练""今天休息""看 3–4 周的趋势，别看单日"。

## Colors

整体是带一点绿调的冷灰中性色，承托两个人各自的身份色，加一个暖黄作为"提醒但不责备"的强调色。支持浅色和深色两套（深色值以 `dark-` 前缀给出，跟随系统 `prefers-color-scheme`）。

- **松绿 Primary (#1F6F5C)**：老公的身份色。用于老公的主按钮、已完成的进度珠、身份标签、周计划里完成的格子。浅底 **Primary Soft (#D5E9E2)** 用于老公计划中"有训练"的日子。
- **莓红 Secondary (#A2476F)**：老婆的身份色，用法与松绿完全对称。浅底 **Secondary Soft (#F2DCE6)**。
- **暖阳黄 Tertiary (#E0A020)**：唯一的提醒色。用于"吃多了"状态（浅底 **#F8EACB** + 黄色描边）、提示条左边线、"今天"标签、键盘焦点环。它表达"注意一下"而不是"错了"。
- **雾绿灰 Neutral (#EDF1EF)**：页面背景。
- **Surface (#FFFFFF)**：卡片。**Surface Sunk (#E3E9E6)**：凹陷层，用于未完成的进度珠、分段切换底、输入框底、次要按钮。
- **墨色 On Surface (#17262B)** 为正文；**On Surface Muted (#5E6E72)** 为说明文字、时间、单位；**Outline (#D3DCD8)** 为分割线和描边。
- **Error (#B23A3A)**：只用于同步异常提示和饮食"不推荐"列表标题，不用于打卡结果。

## Typography

单一字族：**Noto Sans SC**，回退 PingFang SC、Hiragino Sans GB、Microsoft YaHei、system-ui。层级主要靠字重拉开：标题几乎都用 900（Black），小标题 700，正文 400。

- **大计时数字（display-timer）**：72px / 900，等宽数字，只在跟练模式的倒计时中出现。
- **大标题**：身份选择页 32px，跟练页动作名 28px，顶部日期 22px，都是 900。
- **统计数字（stat）**：20px / 900，用于"连续天"数和起身计数。
- **卡片标题**：今日训练名 17px / 900；分区标题 16px / 700；四餐名、进度区标题 15px / 700。
- **正文**：15px / 400，行高 1.6。卡片内说明文字 13px，颜色用 Muted。
- **标签**：按钮与身份标签 14px / 700；底部标签栏、分区右侧注释 12px；进度珠和小标签 11px。

## Layout

- **手机优先的单栏**，内容最大宽度 520px 居中，左右留白 16px，底部预留 96px 给固定标签栏，并处理 iPhone 安全区（`env(safe-area-inset-*)`）。
- 分区之间 20px，分区标题与内容 10px，同一分区内的卡片间距 8px。
- **首页「今日」顺序**：顶部日期 + 身份标签 → 同步状态一行小字 → 两人进度大卡 → 今天的训练 → 今天吃什么（四张餐卡，每张带三段打卡）→ 工位起身计数。
- **两人进度行**：三列网格——44px 名字 / 5 颗等宽进度珠（早、午、加、晚、练或休）/ 右侧连续天数。
- **周计划**：7 列等宽网格；两人版为 40px 名字列 + 7 列。
- **分段打卡**：3 列等宽；**身份切换**：2 列等宽的胶囊。
- 底部标签栏 4 等分：今日、饮食、训练、记录，图标 22px 线性描边（1.8px）。

## Elevation & Depth

完全扁平，不使用投影。层级靠**色调分层**：雾绿灰背景 → 白色卡片 → 凹陷灰（Sunk）作为卡片内的次级容器。状态变化靠填充色和内描边表达（例如"吃多了"是浅黄底 + 2px 黄色内描边，"休息日"是透明底 + 1.5px 线色内描边，"今天"是 2px 墨色描边）。全屏层（身份选择、跟练）直接铺满页面背景色，不用遮罩。

## Shapes

圆润、友好。大卡片和全屏层里的大按钮 22px，普通卡片 14px，分段按钮、输入框、周计划格子 10px，进度珠 9px。所有按钮、身份标签、切换胶囊、toast 都是全圆角胶囊（999px），计数加减按钮是 36px 的正圆。

## Components

- **身份标签（role chip）**：右上角胶囊，身份色填充 + 白字"我是老公"，右侧附一个半透明白底的小"切换"。
- **两人进度卡（card-hero）**：首页最重要的组件。每人一行，进度珠未完成为凹陷灰，完成为身份色填充白字，"吃多了"为浅黄底黄描边，休息日为描边空心珠。
- **餐卡 + 三段打卡**：餐名 + 时间在一行，下面一行说明吃什么，底部三个等宽按钮"按计划吃了 / 吃多了 / 没吃"。选中"按计划"用身份色填充；"吃多了"用浅黄；"没吃"用凹陷灰 + Muted 描边。
- **按钮**：Primary 为身份色胶囊（"开始训练"），Ghost 为凹陷灰胶囊（"工位 3 分钟""查看"），Done 为凹陷灰 + Muted 字（"已完成"）。跟练底部的大按钮上下内边距 15px、字号 16px。
- **身份切换（person switch）**：凹陷灰轨道里两个胶囊，选中的一侧填充对应身份色。
- **提示条（note）**：左侧 3px 暖阳黄竖线 + 浅黄底，用于"吃多了没关系"一类温和提示。
- **标签（tag）**：暖阳黄小胶囊，深色字，例如晚餐轮换里的"今天"。
- **输入框**：凹陷灰底、无边框，聚焦时出现线色描边；字号 16px（避免 iOS 放大）。
- **趋势图**：两人两条折线，分别用身份色，下方色块图例。
- **跟练模式**：顶部返回按钮 + 进度文字，6px 身份色进度条，4:3 的"动作示意图待添加"虚线占位框，动作名 28px，次数 18px，要点说明 Muted，底部固定大按钮。
- **Toast**：底部居中的墨色胶囊，反色文字。

## Do's and Don'ts

- Do：让"两个人并排"始终可见，首页先放两人进度，再放自己的操作。
- Do：身份色只表达"这是谁的"——自己的操作用自己的颜色，查看对方内容用对方的颜色。
- Do：每个打卡都是一次点击完成，不弹确认框，不要求输入数字（身体数据除外）。
- Do：同时保证浅色和深色两套都达到 WCAG AA 对比度；遵循系统"减少动态效果"设置。
- Don't：不要引入热量数字、食物搜索、排行榜、徽章或打卡失败的红色惊叹号。
- Don't：不要把"吃多了"做成红色或负面表达，它只用暖阳黄。
- Don't：不要给老婆的方案出现激进节食或高强度内容；她的训练是 15 分钟居家徒手跟练。
- Don't：不要加投影和渐变；层级只用色调分层。
- Don't：不要在动作示意位置使用来源不明的网络 GIF，保留占位框。
