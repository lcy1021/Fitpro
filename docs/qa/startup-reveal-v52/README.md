# v52：先定位，再露出首页

## 用户反馈与原因

2026-10-13 用户确认 v51 最终状态已解决白条后，补充首开仍先显示白色顶部，再自动向上跳动。两项验收需要分开：最终场景贯穿已确认；首次呈现稳定性本轮修复。

代码中 `openSplash` 原先先 `finishStartup`、给入场层加 `leaving` 开始 450ms 淡出，之后才解除 `body` 滚动锁并调用 `restoreHeroScrollStart`。后者还会排到下一动画帧；因此首页已露出，才从 0 移到目标 60。不是重新发现一段安全区，也不需要改图标或图片。

## 改动

在现有不透明入场层下：完成首页渲染 → 解除滚动锁 → 复用 `scrollToPageStart` 定位 → 等待两个绘制帧 → 入场层淡出。删除淡出结束后的迟到定位。进入角色选择与读取错误的路径保留原行为。

仍使用 v51 已确认的受限安装态检测和实际滚动起点。它并非纯 CSS 的 scrollY=0 全屏方案；用户可见目标是首页首次露出时已经对齐，不看见内容向上移动。浏览器页面无法保证接管 iOS 在网页渲染前显示的系统启动快照，因此仍须真机确认可见过渡。

本轮不修改场景、角色／服装／姿态、手写字、底部渐变、标题字号、卡片与导航。用户选中的横排标题另有磨砂过渡修订稿，待确认后再接入。

## 可复现证据

在旧代码先运行新增逐帧断言，得到预期失败：

```text
cached reaches final status inset BEFORE any home reveal frame:
[{"scrollY":0,"opacity":"1"},{"scrollY":0,"opacity":"1"},{"scrollY":0,"opacity":"1"}]
```

修改后模拟安装态的正常缓存启动、跳过、减少动态、冷启动、本机模式：入场层所有淡出帧均为 scrollY=60。普通浏览器对应为 0。未登录、未登录跳过、恢复错误路径也完成且无异常。详见 [安装态逐帧结果](standalone/browser-results.json) 与 [普通浏览器结果](browser/browser-results.json)。截图是网页视口，不包括原生状态栏，不能代替真机验收。

```sh
PLAYWRIGHT_MODULE=/tmp/duofit-browser-qa/node_modules/playwright PLAYWRIGHT_BROWSER=chrome DUOFIT_TEST_IOS_STANDALONE=1 DUOFIT_STARTUP_QA_DIR=docs/qa/startup-reveal-v52/standalone node tests/startup-browser.js
PLAYWRIGHT_MODULE=/tmp/duofit-browser-qa/node_modules/playwright PLAYWRIGHT_BROWSER=chrome DUOFIT_STARTUP_QA_DIR=docs/qa/startup-reveal-v52/browser node tests/startup-browser.js
node tests/design-system.js
node tests/scenarios.js
node tests/sw-cache.js
```

## 发布

已发布：`27eaa32`，Pages [38340118587](https://github.com/lcy1021/Fitpro/actions/runs/38340118587) 成功，[5 个线上文件核验](release-verification.json)通过。原生过渡仍待真机确认。核心资源、连接诊断、SW CORE、组件展示和本机预览统一 v52，图片缓存保留。
