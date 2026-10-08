# DuoFit App Logo

蓝色与粉色云朵角色并肩跑步的 App 图标。当前使用用户选定的 v3：保留原有立体角色、发带、短裤、裙装与跑步姿势，放大人物、减少留白，保留鲜明的蓝粉主体色，背景改为淡奶油白与极淡的蓝粉边缘光晕，让角色更突出。

- `duofit-app-icon-fullbleed.png`：正式 App 图标源，1024 × 1024 PNG；RGB、无透明通道，渐变背景铺满直角画布，完整角色放大显示。
- `duofit-logo-master.png`：当前 v3 的原始 1254 × 1254 图，通过 imagegen 编辑原版生成。
- `duofit-logo-prompt.txt`：v3 图标的完整生成提示词。
- `duofit-app-icon-1024.png`、`512.png`、`192.png`、`180.png`、`64.png`、`32.png`：对应尺寸的 PNG。
- `preview.html`：图标在不同尺寸与明暗背景下的预览。
- `preview.png`：由正式导出图标生成的手机圆角与明暗底色尺寸预览。
- `../duofit-app-logo.png`：与正式 1024 × 1024 源图相同的 UI 素材副本。

页面实际使用的是 `assets/icons/` 里的副本，全部由 `duofit-app-icon-fullbleed.png` **直接缩放，不做裁切**（手机系统会自己切圆角）：
- `app-icon-180.png`（iPhone 主屏幕）、`app-icon-192.png`、`app-icon-512.png`（安卓 / manifest）
- `favicon-32.png`、`favicon-64.png`（浏览器标签页）
- 项目根目录 `apple-touch-icon.png`：与 180 px 副本相同，支持 iPhone 自动寻找主屏幕图标。

页面、manifest 和通知中的图标 URL 使用 `?v=logo3`；`sw.js` 缓存版本同步更新，并预缓存各尺寸图标。清单用途保持 `any`。

后续更新时，同步替换 master、fullbleed、各尺寸 UI 素材、`../duofit-app-logo.png`、`assets/icons/` 与根目录 iPhone 图标。所有尺寸都直接缩放，不二次裁切，也不预先绘制圆角；检查完整人物在手机圆角遮罩下的显示，再更新 URL 和缓存版本。
