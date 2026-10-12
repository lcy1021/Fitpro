# iOS 顶部状态栏背景衔接 · v42 本机 QA

## 确认差异

用户[原始截图](user-before.png)显示，iPhone 深色饮食页的状态栏背景为独立黑色；下方页面从蓝色渐变开始。顶部的标题、日期、同步小字、原版蓝色角色和饮食卡片本身正常。本次只处理顶部背景衔接，保留这些内容、角色帽子/姿态/服装、云层、餐品、卡片与数据语义。

## 实现

- `index.html` 增加 iOS 主屏幕应用 `apple-mobile-web-app-capable=yes` 与 `apple-mobile-web-app-status-bar-style=black-translucent`。按 [Apple 元信息说明](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)，后者允许页面绘制到系统状态栏下方。
- `html` 绘制与 `body` 相同的 `--mesh, --bg`；根节点随登录身份同步 `.me-hus/.me-wife`。修正深色 token 选择器，使根节点与正文的蓝/粉渐变一致。保留 `env(safe-area-inset-top)`，内容避开灵动岛和系统文字。
- 浏览器的浅深 `theme-color` 保留；没有加独立黑条，也没有更改插图和业务数据。

## 本机对照与验证

[蓝色深色 390px](after-hus-dark-390.png) 与用户截图对应；[粉色浅色 390px](after-wife-light-390.png) 检查浅色对比。截图由本地主题预览模拟 59px 顶部安全区，**未模拟 iOS 系统时间、信号和灵动岛**。

[checks.json](checks.json) 记录蓝粉 × 浅深 × 320/390 的 8 种组合：根节点与正文 `--mesh` 相同，安全区有背景，页面无横向溢出或脚本异常；切换身份后根节点颜色跟随。`node tests/design-system.js`、`node tests/scenarios.js`、`node tests/meal-ui.js`、`node tests/sw-cache.js` 与 `git diff --check` 通过。可在本机启动静态服务后运行 `node docs/qa/status-bar-bg/capture.js` 复现。

本机没有 iOS 模拟器；真实 iPhone 上的系统状态栏文字颜色、安装版缓存刷新与最终观感，尚未由这份本机截图验证。

## 发布状态

v42 已通过 [GitHub Pages 部署](https://github.com/lcy1021/Fitpro/actions/runs/38239828471)；入口、主题 token 与 SW 线上文件逐字节等于本地。核心 CSS/JS 与 SW 壳为 v42；图片缓存仍为 `duofit-images-v1`。真实 iPhone 的状态栏呈现仍需在设备上复核。

## 已安装图标的限制（用户复查后补充）

用户从原有主屏幕图标打开仍看到黑色顶部。线上 v42 文件已经更新，但 [WebKit 的安装时复现](https://bugs.webkit.org/show_bug.cgi?id=316008) 指出：安装后才新增 `black-translucent` 元信息，旧图标的状态栏布局不会跟着更新。这解释了“代码上线而旧桌面图标不变”的现象；设备实测结果仍待新图标确认。不要直接清除旧 App / Safari 网站数据：DuoFit 匿名身份和未同步打卡可能只保存在该图标的本机存储。先从 Safari 给同一网址添加另一个不同名称的桌面图标，只检查视觉；确认旧图标显示“已同步”并私下保存个人恢复码后，才考虑把私人档案恢复到新图标。恢复码是一次性的，恢复成功后旧图标失去同步权限。
