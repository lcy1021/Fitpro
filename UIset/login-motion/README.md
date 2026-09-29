# DuoFit 登录动效预览

打开 `preview.html` 即可查看。蓝色与粉色云朵先从远处跑近、会合，再展示 DuoFit 字标、小字「两个人，一起动起来」和「你是谁？」角色选择卡片；页面提供重播、跳过和角色选择反馈。

已接入正式 App：`index.html` 的 `#pick`（类名加了 `lm-` 前缀避免和页面其他样式冲突，颜色改用 App 的主题变量以支持深色模式），跑步形象转成 WebP（520px，每张约 25KB）放在 `assets/login/`。本目录的 `preview.html` 仍是独立预览，不会改动真实打卡数据。动画使用 CSS 与少量原生 JavaScript，支持系统“减少动态效果”设置。

页面加载 `hus-running.webp`（22KB）和 `wife-running.webp`（26KB），两处角色展示复用同一文件；两张 PNG 留作高清原图，不参与页面加载。动效会等两张图完成解码后开始，慢网最多等待 1.2 秒。`duofit-wordmark.svg` 是圆角双配色字标（不足 1KB）。
