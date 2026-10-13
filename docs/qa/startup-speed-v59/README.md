# v59 引导首屏加载速度

## 已确认 / 未知

用户反馈打开 App 后有 2–3 秒空白。v58 的三条外部 stylesheet 会阻塞首次绘制，tokens 尚未返回时根背景变量也未定义；SW 对 HTML、JS、CSS 使用 network-first/no-store，即使已有完整离线缓存也必须等网络成功或失败。两处逻辑可由源码和合成慢网络复现。未取得用户手机当次网络日志，不能据此断言每一段原生空白的具体来源。

## 修改前清单与视觉核对

打开用户认可的 v58 引导 390px 截图，再用 Git `da32eb4:index.html` 保存同视口、同 run 状态的当前截图。背景蓝粉渐变、标题、英文小字、说明、底部短句、原版蓝粉角色的帽子/发型/轮廓/服装/比例/跑步姿态、点阵、跑道、速度线和跳过均保留。执行差异只在加载依赖和缓存时序；没有新视觉方向或素材替换。

`comparison.html` 同屏呈现修改前后 run 截图，以及修复后外部资源仍在等待时的首屏。8 种 320/390×蓝粉×浅深 run 截图进行像素差核对；背景、文案和装饰须完全一致，原版旋转角色和投影允许极小的浏览器栅格化差异，本轮最大通道差 8–27/255、全图平均通道差 0.027–0.085/255，差异全部在角色/投影范围内，具体数值见 after-paint-results.json。Chromium 截图可能等待挂起的 CSS，因此空白时间的依据是 Paint Timing API，不能把完成加载后的截图标成早期空白证据。

## 改动和边界

- `index.html` 内联三份规范 CSS 的生成快照，保持 tokens → 原布局 → components → coach 的原级联。`scripts/sync-shell-styles.js` 从唯一源文件生成并转换素材 URL；设计系统测试校验快照，不维护第二套颜色/组件。HTML 增加约 57KB 原始文本，换取消除三次阻塞样式请求；没有运行时构建或新框架。
- SW 对当前安装版本的入口、config 和带版本的 CORE 直接命中该版本缓存，未命中才联网。应用每次仍检查 `sw.js` 更新，`updateViaCache:none`；新版完整 CORE 成功安装后统一激活。未安装完的新版本不替换当前可用壳，避免导航后台覆盖成新 HTML 而仍使用旧脚本。新版会在下一次重新打开/刷新时使用；不自动刷新正在编辑的页面。
- 引导原版两张 WebP 和字标加入独立图片预热，升级仍保留 `duofit-images-v1`。其他图片缓存去重、资源版本和私人数据绕过规则保留。非 CORE HTML 保持联网优先。
- 身份恢复、同 UID 缓存、云端后台重连、跳过、减少动态、首页与引导原子切换、已确认的受限 iOS 顶部定位均保留。config 源文件、健康数据、记录 ID/角色格式和云端服务未改。
- 核心、诊断、SW、组件页与本机主题预览同步 v59；设计系统仍 1.9，无新组件或 token。

## 验证

环境：本机 Chrome/Playwright，合成资料，无真实健康数据。时间为本机浏览器测量，不是用户手机耗时保证。

```sh
node scripts/sync-shell-styles.js --check
node tests/design-system.js
node tests/scenarios.js
node tests/meal-ui.js
node tests/cloud-connection.js
node tests/sw-cache.js
```

- `startup-first-paint.js --before` / 正常模式：外部 CSS 人为延迟 2500ms，配置保持等待。修改前首绘 2540–2588ms；修改后 8 组合首绘 28–124ms，全部在 600ms 前绘出文字/背景；精确时间见 `before-paint-results.json` / `after-paint-results.json`。8 组合文案/背景/装饰/原版角色和布局保留、跳过可用，无页面异常。
- `startup-cache-browser.js`：真实 SW、HTTP 本机独立测试服务，HTML/config/JS 延迟 2500ms 时缓存首绘 40ms，且无前台核心网络请求；离线首绘 40ms。合成 v60 的 config 503 导致安装失败，当前 v59 仍保留；合成 v61 完整安装后成功切换，身份和原图片缓存保留。失败壳遗留的部分缓存在下次成功激活时清理。见 `cache-browser-results.json`。
- `startup-browser.js` 普通与模拟安装态各 8 条路径：缓存、跳过、减少动态、首次角色、首次跳过、冷数据、缺失登录、纯本机模式。引导完整背景、身份恢复错误入口及首页单次构建通过；模拟安装态首次首页可见帧全部已定位 60px。
- `status-scroll-browser.js`：320/390/430×蓝粉×浅深×四页×普通/模拟安装态共 96 组合；资源路径、字号、边界、标题列、滚动保留和弹窗守卫通过。48 张普通页面截图归档。
- `viewport-diagnostics-browser.js`：实际复制按钮给出 v59，首次/手动滚动证据和敏感数据排除通过。
- 上列 6 项 Node 检查通过。未连接真机原生合成器；首次无缓存时 HTML 下载、系统启动快照仍受网络/系统影响。

## 发布

本地修复和上述验证已完成，用户已明确确认「发布 v59」。提交并推送后待 Pages/线上 SHA-256 核验。回退位置：v58 应用提交 `da32eb4`；独立图片缓存无需清除。
