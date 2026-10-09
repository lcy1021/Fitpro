# DuoFit Design System · 1.2

状态：正式沿用。以用户确认的 v35「方案一」页面为视觉依据；实现入口是 `design-system/tokens.css`、`design-system/components.css`，可操作样例是 `design-system/index.html`。

## 1. 风格与使用优先级

温暖的奶油底、轻染色卡片、蓝粉角色、少量立体插画、清楚的文字层级。保持轻松、易读，避免每个模块都像大海报。

优先级：用户最新明确要求 → 本规范与可运行组件 → 当前页面 → 历史设计参考。`UIset/DuoFit_dual_design_system/` 中早期橙色 / Plus Jakarta Sans 方案属于历史参考，不能作为新增界面的默认样式。

新增页面加载两个 CSS 文件，先 tokens 后 components。现有 App 保留自身布局样式；不要复制组件规则或通过末尾重复覆盖制造另一套样式。

```html
<link rel="stylesheet" href="design-system/tokens.css?v=38">
<link rel="stylesheet" href="design-system/components.css?v=38">
<!-- .me-hus / .me-wife 表示登录者；.hus / .wife 表示当前内容的所有者 -->
<body class="ds-root me-hus">
  <section class="card hus">…</section>
</body>
```

## 2. 颜色：语义优先，角色与状态分开

| 用途 / CSS token | 浅色 | 深色 | 使用规则 |
| --- | --- | --- | --- |
| 页面 `--bg` | #FDFAF6 | #101318 | 页面背景 |
| 卡片 `--surface` | #FFFFFF | #191D24 | 内容主表面 |
| 次表面 `--sunk` | #F6F3EE | #222731 | tab 轨道、输入、次按钮 |
| 主文字 `--ink` | #192024 | #EEF1F4 | 标题、正文、重要数据 |
| 辅助 `--muted` | #64748B | #9AA5B4 | 日期、时间、说明 |
| 老公 `--hus / --hus-ink / --hus-soft` | #0284C7 / #0369A1 / #E0F2FE | #38BDF8 / #7DD3FC / #0C3246 | 蓝色角色 |
| 老婆 `--wife / --wife-ink / --wife-soft` | #FF4B72 / #E11D48 / #FFE4E6 | #FF7A95 / #FDA4B8 / #4A1E2A | 粉色角色 |

- 模块标题按2026-10-09用户最新手机反馈从17px提高为19px/800，颜色统一 `--ink`（与“今日”大标题同色）；餐内12/14/16px不变。

- 页面动作使用 `--me-*`，跟随登录者；餐卡、历史详情使用 `--p-*`，跟随记录所有者。老公查看老婆记录时，页面导航仍蓝色，详情变为粉色。
- 正文、辅助、角色强调组成常规三种文字色。成功 / 提醒 / 错误仅在真实状态出现，用 `--good-* / --sun-* / --danger`，同时配明确文案；不能按早餐、午餐分别分配黄色、绿色等随机图标底色。
- 面板、今日餐头和历史卡使用 `--ds-surface-gradient`：125度，从 `--surface` 过渡到 `--p-soft`，浅色为白到浅蓝/粉，深色为深灰到角色暗色。云层仍使用共享透明图片，浅色opacity .55、深色 .12。角色相关复合token须在 `.hus/.wife/.ds-root` 上解析，不能在没有 `--p-*` 的 `:root` 上定义。
- tab选中填充统一 `--ds-fill-selected:var(--p-ink)` / `--ds-fill-selected-ink:var(--surface)`，未选中透明灰字；无默认线框、无下划线。键盘焦点轮廓保留。餐品 `.meal-art-stage` 以 `--ds-food-tint:52%` 的浅色底托和 `--ds-food-shadow` 轻投影承托真实图片。
- `--faint` 用于低优先级装饰或禁用，不能作为重要正文色。渐变主按钮沿用现有风格；不要把角色亮色白字默认当作小字号标签，组件页不代表完整 WCAG 认证。

## 3. 字体：同级同大小

系统中文字体，不加载网络字体。数字使用等宽数字属性。

| 层级 / token | 大小 / 常用字重 | 场景 |
| --- | --- | --- |
| `--ds-text-meta` | 12px / 400、600 | 日期、单位、时间、操作、状态 |
| `--ds-text-body` | 14px / 400 | 菜名、说明、记录正文 |
| `--ds-text-title` | 16px / 700 | 卡片餐名、热量数值；表单输入为 16px |
| `--ds-text-section` | 19px / 800 | 今天吃什么、我的一天、今天的训练、我们的记录 |
| `--ds-text-page` | 24px / 800 | 页面一级标题 |
| `--ds-text-metric` | 32px / 800 | 独立统计卡的主要数字 |

正文行高 `--ds-leading-body:1.7`；标题 `--ds-leading-title:1.3`。卡内只用 12 / 14 / 16 三档；独立统计与入场海报可使用大数字，不将其用于每个小模块。日期左对齐放在标题下，右侧只放装饰形象。记录页先展示角色切换和餐次详情，日历、连续打卡随后显示；标题日期随选择更新。省略重复的「本周个性建议」；缺少受限餐食时保留明确的「餐食待确认」。

## 4. 间距、圆角、阴影

| 类别 | token | 规范 |
| --- | --- | --- |
| 主间距 | `--ds-space-1…6` | 4 / 8 / 12 / 16 / 20 / 24px |
| 紧凑间距 | `--ds-gap-tight` | 6px，文字与图标 |
| 页面宽 / 边距 | `--ds-page-max / --ds-page-gutter` | 520px / 16px，手机单列 |
| 小 / 中 / 大圆角 | `--radius-s / --radius-m / --radius-l` | 14 / 20 / 26px |
| 餐卡 / 内部圆角 | `--ds-radius-meal / --ds-radius-inset` | 22 / 16px |
| 打卡轨道 / 按钮 | `--ds-radius-track / --ds-radius-segment` | 13 / 10px |
| tab 轨道 / 按钮 | `--ds-radius-tabs / --ds-radius-tab` | 15 / 11px |
| 常规 / 抬升阴影 | `--shadow / --shadow-lift` | 只用于层级区分，不给每段正文加阴影 |

4px 为主网格，不强行取整已有 9/10/14px 光学间距。组件内部可有已记录的精细参数；新布局优先主间距。长菜名自然换行，父级 `min-width:0`，网格 `minmax(0,1fr)`。320px 不能横向溢出。页面下方保留实际导航高度 + 24px 和安全区。

## 5. 组件目录与接口

| 组件 | 代码接口 | 变体 / 行为 |
| --- | --- | --- |
| 基础卡片 | `.card` | 主表面、中圆角、16px 内距；不滥套多层卡片 |
| 模块标题 | `.ds-section-heading`，App `.meal-section-heading` | `h3 + time + .ds-mascot-group`；跑步 / 吃饭 / 双人图，日期在左下 |
| 角色切换 | `.ds-role-tabs`，App `.history-partner-status` | 两列；选中角色色填充、对比文字、轻阴影；未选中灰字；只写老公 / 老婆；无下划线 |
| 餐次打卡 | `.ds-checkin`，App `.diary-actions` | 三列；浅色轨道 + 角色色填充选中块；无选中线框；保留勾和文字 |
| 氛围面板 | `.ds-scene` | 蓝粉轻染、透明云朵薄层、浅色边缘；用于今日餐次 / 我的一天 / 记录详情 |
| 今日餐卡 | `.meal`，`mealHeading / mealPlanContent / mealActions` | 浅染色云朵插画头、内层 `.meal-body` 圆角正文、计划区间、虚线实际分隔、打卡选择 |
| 饮食计划 | `.meal-plan-list / .mplan` | 四餐列表、细分隔、角色图标；复用餐名与热量语言 |
| 历史日志 | `.diary-meals / .diary-meal`，`dietDayRows` | 历史染色时间线；过去 / 伴侣只读；仅今天本人显示编辑 |
| 按钮 | `.btn.primary / .btn.ghost`；新模块 `.ds-button` | primary / secondary / disabled / busy；操作区新组件至少44px |
| 提示 | `.ds-notice` + `data-tone` | info / success / warning / error；文本 + 图标，空态不能伪装成功 |
| 输入 | `.ds-input` | 原生 label、16px、焦点可见；invalid / disabled |
| 数据 | `.ds-stat` | 数字 + 单位 + 辅助文本；别用大字号表达普通餐卡 |

### 切换样例

```html
<div class="ds-role-tabs" role="group" aria-label="查看谁的记录">
  <button type="button" class="hus" aria-pressed="true">老公</button>
  <button type="button" class="wife" aria-pressed="false">老婆</button>
</div>
<div class="ds-checkin hus" role="group" aria-label="早餐打卡">
  <button type="button" aria-pressed="true">按计划</button>
  <button type="button" aria-pressed="false">吃多了</button>
  <button type="button" aria-pressed="false">没吃</button>
</div>
```

选择状态由控制器同步 `aria-pressed` 与业务值，不用装饰下划线表示选中。当前是互斥按钮组，不能只加 `role=tab` 却没有 tabpanel 和相应键盘逻辑。原生 Tab / Enter / Space 可操作，焦点轮廓只在键盘 focus-visible 出现，不是默认选中线框。

## 6. 状态与动效

- 正常、选中、未选中、焦点、禁用、加载、空态、错误、只读都要定义。组件页可实际切换角色、主题、餐次状态，展示这些状态。
- 新增小交互用 `--ds-motion-fast:100ms / --ds-motion-normal:200ms`；只过渡背景、颜色、阴影和轻微按压。`prefers-reduced-motion` 下新增组件去掉过渡和按压变形；入场大动画继续沿用 App 已有跳过与减弱逻辑。
- 加载说明当前动作，并阻止重复提交；错误保留原文且提供重试；未知或未同步不是 0，不显示成功判断。
- 禁用有 `disabled`；加载有 `aria-busy`；错误用 `role=alert`；只读有明确文字且移除编辑动作。

## 7. 图标、插图与资产

复用现有 Lucide SVG sprite，24×24 坐标，常用显示16 / 20 / 24px、1.85px 圆角描边。新增组件不混用 emoji 或文本箭头当正式图标。

角色身份以现有原版素材为准：蓝色帽檐与深蓝发卷、条纹短裤/青色鞋；粉色高马尾、深粉发带、条纹运动裙/珊瑚色鞋，以及原有眼睛、腮红、云朵轮廓和身体比例。不能只凭“蓝色/粉色云朵”重新生成角色。

共用入口 `design-system/mascots.js`，App、组件展示页和本机预览共同调用，来源清单见[角色资产规范](../assets/mascots.md)：

| 用途 | 原版来源 | 当前呈现 |
| --- | --- | --- |
| 今日 | `assets/login/{hus,wife}-running.webp` | 与登录动画使用完全相同文件；右侧128px角色，两行小字作为独立UI文字 |
| 饮食 | `assets/mood/{hus,wife}-meal.webp` | 原有吃饭角色，保留西兰花和饭碗，128px |
| 记录 | `assets/meal-art/record-couple-v1.webp?v=meal1` | 用户曾认可的方案一双人形象，184×112px；不再重绘 |

标题图轻微向下探出8–18px，允许与首卡边缘重合；不可遮挡标题、日期、数据和点击区域，装饰 `pointer-events:none`。320px压缩图槽，标题保持19px。爱心复用现有图标库，背景/小字/装饰不与角色像素绑定。v37重新生成的5张角色图留作历史证据，退出当前页面引用。此处按用户要求恢复原版身份；v37“必须通过重绘补碗勺星星”的规则作废。

四餐图仍为通用装饰，`alt=""`，不能暗示用户真实吃了图上的东西。`object-fit:contain`、显式尺寸、WebP、lazy / async；原有角色URL保持原样命中缓存，素材未改不递增图片版本。不得用新插图覆盖原版文件。

## 8. 当前接入与后续维护

v38修正角色身份并按用户手机反馈调整表面：原版角色、白至角色色渐变、餐品底托/投影、填充tab、19px主文字色模块标题及更大的右侧角色。所有三处页面与组件展示同步，见[本次QA](qa/mascot-consistency/README.md)。

v37 历史细节补齐：气氛面板、透明云层、带手写字标题图、蓝粉吃饭角色、双人爱心、香蕉燕麦及带侧面配菜的餐图；今日内层正文浅染/虚线，历史时间线卡片浅色描边。展示页与App同时复用这些细节。素材与生成提示见[细节QA](qa/visual-details/README.md)。

v36 已接入：全局颜色与角色 / 深浅主题 tokens、基础卡片 / 按钮 / 模块标题、今日 / 饮食 / 历史共用组件、角色 tabs、打卡分段、核心页面字体参数。健康伙伴继续使用这些全局颜色和原有输入布局。

尚未整体重做：登录动效排版、训练跟练、身体统计、旧日历的局部尺寸。它们保留既有业务布局；新模块用本系统，后续改到旧组件时逐个迁移并验收，不能宣称全应用已经完全统一。

维护流程：

1. 先打开用户确认的视觉稿与当前实际页面，同状态截图对照；逐项登记背景/边缘/阴影、标题辅助文字、插图主体/姿态/道具/小装饰、字号和布局；明确差异后，再查组件页和本表，优先组合现有组件。不能把稿中明确出现的内容未经用户确认降为P3或静默省略。角色身份须先和原版资产对照；当前用户明确要求恢复原版角色，身份优先于生成稿中的新脸型、比例和道具。
2. 新视觉参数先增加语义 token，说明用途、主题和状态；禁止每页另写蓝粉 hex 或另一套 tab。
3. 改共用组件同时检查今日 / 饮食 / 历史及本人 / 伴侣，不使用页面尾部补丁掩盖冲突。
4. 运行 `node tests/design-system.js`；涉及布局执行浏览器验收（320 / 390，蓝 / 粉，浅 / 深、长文本、空 / 错误）。不能仅凭规范文档宣布已落地。
5. 更新组件页、本文与 `docs/maintenance-history.md`，记录症状、确认原因、范围、证据和发布版本。有意改变视觉时更新基准并注明原因。

当前验收：[v38角色与卡片QA](qa/mascot-consistency/README.md)。历史与方案一视觉稿的对照记录：[v37 细节QA](qa/visual-details/README.md)（v36档案保留用于定位之前漏项）。
