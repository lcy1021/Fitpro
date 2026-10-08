---
name: Companion Harmony
colors:
  surface: '#fdf8fd'
  surface-dim: '#ddd9de'
  surface-bright: '#fdf8fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f8'
  surface-container: '#f1ecf2'
  surface-container-high: '#ebe7ec'
  surface-container-highest: '#e5e1e7'
  on-surface: '#1c1b1f'
  on-surface-variant: '#58423a'
  inverse-surface: '#313034'
  inverse-on-surface: '#f4eff5'
  outline: '#8c7168'
  outline-variant: '#dfc0b5'
  surface-tint: '#a83903'
  primary: '#a83903'
  on-primary: '#ffffff'
  primary-container: '#ff7843'
  on-primary-container: '#661f00'
  inverse-primary: '#ffb59b'
  secondary: '#006b57'
  on-secondary: '#ffffff'
  secondary-container: '#6ffad6'
  on-secondary-container: '#00725d'
  tertiary: '#5b4bc4'
  on-tertiary: '#ffffff'
  tertiary-container: '#9e92ff'
  on-tertiary-container: '#321a9b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59b'
  on-primary-fixed: '#380d00'
  on-primary-fixed-variant: '#812900'
  secondary-fixed: '#6ffad6'
  secondary-fixed-dim: '#4eddba'
  on-secondary-fixed: '#002019'
  on-secondary-fixed-variant: '#005141'
  tertiary-fixed: '#e4dfff'
  tertiary-fixed-dim: '#c7bfff'
  on-tertiary-fixed: '#170065'
  on-tertiary-fixed-variant: '#4230ab'
  background: '#fdf8fd'
  on-background: '#1c1b1f'
  surface-variant: '#e5e1e7'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  metric-large:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
  metric-large-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-pill:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 1.75rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers an empathetic, non-punitive health and lifestyle experience crafted specifically for couples. Departing from clinical, hyper-metric, or guilt-inducing fitness dashboards, the visual language embraces an emotionally restorative atmosphere centered around well-being, shared rhythm, and gentle momentum.

The design movement blends **Warm Tactile Neomorphism** with **Luminous Ambient Minimalism**:
- **Organic Comfort:** Silky, ultra-rounded cards evoke tactile physical tokens and soft wellness stones.
- **Ambient Luminous Glows:** Layered pastel auras bathe views in daylight-inspired soft radiance, avoiding flat clinical whites or stark dark voids.
- **Non-Competitive Emotional Tone:** Visual indicators celebrate recovery, rest, and joint progress equally alongside physical exertion. Feedback is warm, supportive, and human.

## Colors

The palette revolves around uplifting, body-comforting hues anchored by warm eggshell base surfaces.

- **Primary (`#FF7843` - Apricot Peach):** Radiates vitality, warmth, heart connection, and the primary active energy zone ("Sweet Spot").
- **Secondary (`#2CC5A4` - Soothing Mint):** Evokes recovery, equilibrium, balanced nutrition, and gentle progression.
- **Tertiary (`#897BF6` - Warm Lavender):** Represents restful sleep, mindful reflection, and evening sync-ups between partners.
- **Neutral (`#1C1B1F` - Deep Licorice):** High-legibility, softened near-black used for primary typographic hierarchy and tactile iconography, never pure `#000000`.

### Supporting Semantic & Ambient Accents
- **Canvas Base:** `#F9F7F2` (Creamy Eggshell)
- **Card Surface:** `#FFFFFF` with 88% to 94% opacity layered over canvas glows.
- **Sky Cyan Glow:** `#48C6EF` (used in gradient streams for hydration, breath, and shared stamina).
- **Sweet Spot Gradient:** Linear or wave fill transitioning smoothly from `#FF9E62` through `#FF7843` to `#FF5757`.

## Typography

Typography relies on **Plus Jakarta Sans** across all levels. Its balanced, modern humanist curves, wide apertures, and friendly geometric architecture mirror the inviting design sentiment.

- **Numerics & Big Metrics:** Numeric data (steps, shared heart rate zones, restful hours, calorie balance) use `metric-large` with tight tracking (`-0.02em`) and bold weights to celebrate milestone clarity without visual harshness.
- **Editorial Warmth:** Headlines are styled in prominent weights (`700` and `800`) with proportional letter-spacing (`-0.015em`), ensuring micro-copy sounds encouraging and companionable.
- **Body & Captions:** Maintain generous line heights to preserve breathing space and legibility inside dense wellness cards.

## Layout & Spacing

The layout is built upon fluid, card-centric content containers arranged across responsive vertical ribbons and dynamic grid pairings.

- **Grid Architecture:**
  - Desktop / Tablet: A fluid 12-column grid utilizing `margin: 2rem` and `gutter: 1.25rem`. Two-person parallel dashboard panels align side-by-side (spanning 6 columns each).
  - Mobile: A 4-column layout with `margin-mobile: 1rem` and `gutter-mobile: 0.75rem` prioritizing vertical stackable modules and horizontal peek carousels.
- **Atmospheric Rhythm:** Plentiful outer margins protect cards from edge tension, giving the visual impression that cards float over ambient light backdrops.
- **Internal Card Padding:** High internal breathing room using `space-lg` (`1.75rem`) ensures health metrics and charts are never cramped.

## Elevation & Depth

Visual hierarchy abandons hard drop shadows in favor of **Luminous Ambient Depth** and soft tactile cushioning:

- **Surface Tiers:**
  - **Base Canvas:** `#F9F7F2` hosting expansive, low-intensity circular ambient radial gradients (e.g., Peach `#FF784318`, Mint `#2CC5A418`, or Lavender `#897BF618`) blurred at `60px` to `120px`.
  - **Level 1 (Ambient Cards):** Pure white `#FFFFFF` surfaces finished with an ultra-soft dual shadow:
    `0 4px 18px -4px rgba(28, 27, 31, 0.04), 0 16px 36px -8px rgba(255, 120, 67, 0.07)`.
  - **Level 2 (Floating Action / Key Metric Modules):**
    `0 8px 24px -2px rgba(28, 27, 31, 0.06), 0 20px 48px -6px rgba(44, 197, 164, 0.12)`.
- **Ghost Inner Rim:** Every card carries a delicate `1px` translucent inside border: `inset 0 0 0 1px rgba(255, 255, 255, 0.8)` layered with `border: 1px solid rgba(28, 27, 31, 0.04)` to achieve crisp physical distinction over glowing backdrops.

## Shapes

The design system is defined by signature, exaggerated curvature:

- **Cards & Sheets:** Rounded with smooth radii ranging strictly between `28px` (`1.75rem`) and `36px` (`2.25rem`) using Apple-style squircle continuous corner curves (`corner-smoothing: 60%`).
- **Interactive Controls & Status Badges:** Built with full pill curvature (`border-radius: 9999px`) to reinforce tactile friendliness and eliminate sharp corners entirely.
- **Visual Wave Paths:** Sparklines and energy streams use smoothed Bézier cubic wave paths with generous fillets (`stroke-linecap: round`, `stroke-linejoin: round`).

## Components

### 1. The Energy River / "Sweet Spot" Wave Chart
- A continuous, organic sinusoidal band depicting optimal recovery and exertion ranges.
- **Stroke & Fill:** Dynamic linear gradient from mint (`#2CC5A4`) to warm apricot (`#FF7843`). The upper and lower bounds are soft translucent fills (`rgba(255, 120, 67, 0.15)`), while the actual couple's synchronized journey renders as a thick, smooth line (`4px`, round cap) with glowing data nodes.

### 2. Dual-User Sync Cards
- Specialized modular surfaces that compare or pair two partners' activity levels side by side.
- Card corners are set at `32px`. Avatars sit in rounded lozenges accompanied by status badges (e.g., "In Sweet Spot", "Resting Today", "Hydrated").

### 3. Buttons
- **Primary Button:** Pill-shaped (`9999px`), bold text, solid `#FF7843` background with an inset highlight (`inset 0 1px 1px rgba(255,255,255,0.4)`) and a subtle peach tactile glow: `0 8px 20px -4px rgba(255, 120, 67, 0.35)`.
- **Secondary / Soft Button:** Eggshell-tinted surface (`#F2EFEB`) with dark licorice text (`#1C1B1F`), zero outline, giving a pillowy pressable feel.

### 4. Chips & Pill Tags
- Fully rounded (`border-radius: 9999px`) with padding `6px 14px`.
- High emotional expression: Pastel background fills (e.g., `#E8F8F4` for Mint badges, `#FFF0EB` for Apricot badges) paired with dark, saturated label typography.

### 5. Form Inputs & Steppers
- Inset pill-style troughs (`#F1EFEA`) with `24px` to `28px` corner radius.
- No harsh outline focus rings; active focus smoothly transitions the ambient glow from neutral to soft apricot tint (`box-shadow: 0 0 0 3px rgba(255, 120, 67, 0.25)`).

### 6. Companion Cheerful Characters / Reaction Tokens
- Playful rounded micro-illustrations and floating heart or high-five nudges embedded inside sleep and activity summaries to celebrate balance without competitive judgment.

### 7. DuoFit App Icon — Approved v3
- Preserve the original cyan-blue and strawberry-pink 3D cloud running mascots, including their headbands, shorts, skirt and shoes. Enlarge the pair, reduce surrounding whitespace and keep character colors vivid against a pale creamy background with very subtle blue and pink edge tints.
- The canonical artwork is `UIset/logo/duofit-app-icon-fullbleed.png`. Export each app-icon size directly without cropping or drawing rounded corners; keep `UIset/duofit-app-logo.png`, the UI source sizes, runtime icons and root iPhone icon synchronized. The full prompt is saved in `UIset/logo/duofit-logo-prompt.txt`.


## 深色模式与健康伙伴（2026-10-08）

- 四步目标建档、首周计划、每周确认、每日调整、恢复码与清除登录弹窗统一使用主界面的 `--bg / --surface / --sunk / --ink / --muted` 主题变量，跟随系统深色模式；蓝色、粉色身份分别使用对应的深色强调色。伴侣趋势卡、通知提醒卡也跟随主题。
- 输入框、未选/已选项、在线/离线提示、AI 理解卡、加载和错误提示均有深色样式；原生输入控件声明 `color-scheme`，浏览器顶栏颜色跟随系统明暗。动作插画容器使用主题底色，图片自身的浅色画布保留。
- 发送入口采用 44×44 px 圆角按钮、22 px Lucide SVG 箭头、轻渐变和焦点轮廓；空白输入禁用，输入后启用，分析中显示旋转状态并禁用重复发送，失败保留原文用于重试。
- 样式和脚本使用 `?v=19`，离线缓存更新为 `duofit-v19`。浅色/深色与蓝色/粉色分别检查 320、375、390、430 px 宽度；场景截图与检查记录在 `docs/qa/dark-mode/README.md`，本机复现入口在 `tests/theme-preview.html`。


## 记录页底部安全区（2026-10-08）

- 固定导航高度（包含 iPhone 底部安全区）由 `ResizeObserver` 测量，页面底部至少留出导航实际高度加 24 px；导航变高或屏幕旋转时重新测量，无 JS 时采用带安全区的 CSS 预留值。滚动聚焦也避开导航遮挡。
- 记录页设置展开后，恢复码、家庭配对和清除本机登录三个按钮应能完整滚动到导航上方，卡片底部保持间距。身体记录输入网格使用 `minmax(0,1fr)` 和可收缩输入框，避免 320 px 窄屏将保存按钮撑出卡片。
- 验收记录与截图：`docs/qa/settings-safe-area/README.md`；缓存版本更新为 `duofit-v20`。


## 设置齿轮图标修正（2026-10-08）

- 设置图标旧路径下沿到 y=25.2，超出 24×24 画板，描边进一步被切断；使用 Lucide `settings` 完整替换，保留 1.85 px 描边和 19 px 显示尺寸。
- 代码 sprite 与 `UIset/icons/settings.svg`、图标总览同步，缓存升至 `duofit-v21`。局部截图对照见 `docs/qa/settings-icon/README.md`。此前 v20 的修改解决底部间距，本次修复齿轮本身的裁切。


## 确认目标后自动执行（2026-10-08）

- 新计划从确认目标当天开始，视为第 1 天；预览显示连续 7 天，训练与休息按日期推进。跨周沿用保持原来的周期起点，旧的周一计划保留排期。
- 今日状态卡显示计划第几天、自动安排或已调整、训练内容与时长，以及“今天的默认依据”。默认直接执行计划；身体或时间变化时点“调整今天”。休息和短版只影响当天，身体不适的休息安排继续生效。
- 不自动生成打卡记录；仍需用户实际完成后打卡。回到 App 或跨午夜时更新当天页面，断网也能推进日期。
- 每周确认后采用该周的新安排；首周 AI 日期按顺序对齐到确认日起的 7 天。保存起点 `profile.planStartDate`、周期 `plan.cycleStart / cycleDays`，均在现有 JSON 内，无需数据库迁移。
- 私人健康伙伴脚本、样式更新至 `?v=22`，缓存 `duofit-v22`。验收与本机场景见 `docs/qa/default-plan/README.md`；日期回归测试 `tests/default-plan.js`。
