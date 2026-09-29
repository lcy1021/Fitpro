# Fitpro 登录动效预览

打开 `preview.html` 即可查看。蓝色与粉色云朵先从远处跑近、会合，再展示角色选择卡片；页面提供重播、跳过和角色选择反馈。

已接入正式 App：`index.html` 的 `#pick`（类名加了 `lm-` 前缀避免和页面其他样式冲突，颜色改用 App 的主题变量以支持深色模式），跑步形象压缩后放在 `assets/login/`。本目录的 `preview.html` 仍是独立预览，不会改动真实打卡数据。动画使用 CSS 与少量原生 JavaScript，支持系统“减少动态效果”设置。

图片来源：`hus-running.png` 使用现有蓝色云朵角色；`wife-running.png` 按现有粉色裙装角色制作；`app-logo.png` 使用现有 Fitpro Logo。
