# Fitpro App Logo

蓝色与粉色云朵角色并肩跑步的 App 图标。角色设计参考项目中的两位现有形象。

- `fitpro-app-icon-fullbleed.png`：推荐用于生成正式 App 图标的 1024 × 1024 PNG；RGB、无透明通道，渐变背景铺满直角画布，角色留在中央安全区。
- `fitpro-logo-master.png`：原始 1254 × 1254 图。
- `fitpro-app-icon-1024.png`、`512.png`、`192.png`、`180.png`、`64.png`、`32.png`：对应尺寸的 PNG。
- `preview.html`：图标在不同尺寸与明暗背景下的预览。

页面实际使用的是 `assets/icons/` 里的副本，全部由 `fitpro-app-icon-fullbleed.png` **直接缩放，不做裁切**（手机系统会自己切圆角）：
- `app-icon-180.png`（iPhone 主屏幕）、`app-icon-192.png`、`app-icon-512.png`（安卓 / manifest）
- `favicon-32.png`、`favicon-64.png`（浏览器标签页）

更新 logo 时，替换 `fitpro-app-icon-fullbleed.png`（1024 × 1024、直角、背景铺满、角色在中央约 820 × 820 内），再重新生成 `assets/icons/` 里的文件。
