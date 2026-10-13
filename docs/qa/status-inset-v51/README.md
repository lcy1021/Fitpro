# v51 实测顶部预留

## 证据及修改前差异

用户 v50：screen 430×932、inner/client/visual 430×873、safeTop 0、safeBottom 34、scale1、offsetTop0，主屏幕两种检测均 true。首开 scroll1 / heroTop0；手动 scroll72 / heroTop−71。版本已经到达设备且 scrollTo 已执行，白栏仍在。必要几何值写入维护记录，整份私人连接日志不入库。

[WebKit insetClipLayerRect](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp) 用 inset−scroll 计算顶部裁剪位置，并在 scroll≥inset 时归零。这与 59px 白栏、1px 无效、72px 可显示场景的用户证据一致；不能声称已经在用户系统构建中直接调试验证。

可执行差异：取消额外 1px padding，符合受限视口条件时真正滚过 59px 预留（目标60），而非用负 margin 将图片移到仍被原生裁剪的区域。页面将出现用户喜欢的轻微滚动效果。完整3:4场景、主体姿态／服装、手写句／线、道具、背景和下缘渐隐不变。标题及首卡随正常滚动上移，填补原先屏幕顶部多出的预留；底部固定导航不偏移。角色切换按钮仍需避让原生顶部，使用一个默认0的语义 token。

## 同一网页视口 430×873 对照

| 主题 | v50 首开1px | v51 首开60px |
| --- | --- | --- |
| 蓝浅 | ![](before-430-light.png) | ![](after-430-light.png) |
| 蓝深 | ![](before-430-dark.png) | ![](after-430-dark.png) |

图仅含网页视口，不含 iOS 在上方绘制的59px。**不能把本图的顶部裁切当作最终手机截图，也不能用它证明系统白条消失。** 参照用户已认可的轻滚截图与确认稿，验收应为原生屏幕顶端露出天空，首卡上方无多余白条。

## 验证

- `node tests/status-scroll-browser.js`：96组320/390/430、四页、蓝粉、浅深、浏览器/受限主屏幕；原图解码，无横溢，保留阅读位置、手势/弹窗不干扰、回顶/切页。
- `node docs/qa/status-inset-v51/guards.cjs`：实际430/873/screen932目标60；正常覆盖、普通浏览器、键盘、缩放、横屏、已报告安全区六项均0。
- `node tests/viewport-diagnostics-browser.js`：首开实际60px、跨页保留诊断、真实复制按钮、私人字段排除。
- `DUOFIT_TEST_IOS_STANDALONE=1` 既有启动回归：缓存/冷启动/跳过/本机/未登录/恢复错误/减少动态。
- 设计系统、场景、SW回归与 diff 检查。

本机没有能直接验证原生状态栏的 iPhone 环境。发布后仍需用户从原图标确认，无需重装或重新分享。
