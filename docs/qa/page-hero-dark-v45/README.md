# 四页场景深色与加载修复 · v45

日期：2026-10-12。状态：本地已实现并验证，发布待核对。依据为用户在 v44 手机端指出的整图蒙灰、老婆界面图片未加载与图片下缘边界；蓝色浅色四页仍以[已确认规格](../page-header-proposal/spec/README.md)为构图基线。

## 同屏差异与结果

| 项 | v44 同视口现状 | v45 同视口结果 |
| --- | --- | --- |
| 蓝色今日深色 390px | [整幅图有统一灰幕，下缘有直线](../page-header-proposal/implementation/today-hus-dark-390@3x.jpg) | [场景主体恢复亮度，底部融入正文](today-hus-dark-390@3x.jpg) |
| 粉色今日深色 390px | [整图蒙灰、粉色主体变淡](../page-header-proposal/implementation/today-wife-dark-390@3x.jpg) | [角色原色与蓝粉手写句保留](today-wife-dark-390@3x.jpg) |
| 粉色今日浅色 390px | [底边浅色线](../page-header-proposal/implementation/today-wife-light-390@3x.jpg) | [底部与页面奶白底色连续](today-wife-light-390@3x.jpg) |
| 粉色饮食深色 390px | [橱柜、人物蒙灰](../page-header-proposal/implementation/diet-wife-dark-390@3x.jpg) | [厨房上半场景清晰、下半部平滑过渡](diet-wife-dark-390@3x.jpg) |
| 粉色训练深色 320px | [旧截图](../page-header-proposal/implementation/train-wife-dark-320@3x.jpg) | [新截图](train-wife-dark-320@3x.jpg) |
| 双人记录深色 390px | [旧截图](../page-header-proposal/implementation/record-wife-dark-390@3x.jpg) | [新截图](record-wife-dark-390@3x.jpg) |

**逐项清点**：湖岸、厨房窗景、晨光训练室和傍晚记录室的构图、道具与装饰原样；蓝角色的卷发／帽檐、短圆手臂、短裤和青色鞋、粉角色的高马尾／发带、手臂、条纹下装和珊瑚鞋均由同一 PNG 母版重编码，无视觉重绘。Long Cang 字体及句子是独立 DOM，深色不再被漂白；记录页蓝字下划线也统一蓝色。标题、日期、同步坐标与真实首卡结构不变。

## 图片加载定位

用户随后发来的手机截图明确显示老婆「今日」页头只剩粉色底色、手写句及真实标题／同步，场景整图未绘制，首卡内容正常。v44 的老婆三张场景图在线上均为 HTTP 200，Chrome 本机预览也能解码，因此无法复现或断定她手机那次失败的具体网络／缓存状态；此私人截图只作现场证据，不复制到公开仓库。可确定的交付风险是七张 PNG 共 12,409,896 字节、每张约 1.7 MB，且之前只在访问对应页面后才缓存。v45 从原 PNG 编码 1086×1448 的 `*-v2.jpg`（90% 质量），七张合计 2,163,103 字节，缩小 **82.6%**；原 PNG 仍留在仓库。SW 安装时独立预热七张 JPEG 到 `duofit-images-v1`，单张失败不影响壳更新；场景图临时网络失败会重试一次，图片缓存读失败可直接取网络。没有缓存成功且完全离线的首次安装仍无法凭空获取图片。

## 验证

- `node capture.cjs`：四页 × 蓝粉 × 浅深 × 320/390 共 32 组；[逐组测量](checks.json)和截图记录背景 URL、图片 `decode()`、Long Cang 字体、无横溢／脚本错误、表头与首卡 y 坐标一致。32 组通过。
- `node check-resilience.cjs`：32 组场景左右底边四个采样点精确等于正文 `--bg`（浅色 `#FDFAF6`，深色 `#101318`）；安装 SW 后七张图均在独立图片缓存，断网切换老婆的今日／饮食／训练／记录均成功解码。
- WebKit 27.2 的 iPhone 13 模拟视口下，老婆四页浅色、深色共 8 张背景均以 1086px 解码，[浅色](webkit-wife-light-390.png)与[深色](webkit-wife-dark-390.png)今日截图保留；同一 WebKit 环境安装 SW 后缓存 7 张图，断网切换老婆四页仍解码。这验证浏览器内核渲染，但不等于用户那台手机的安装态与网络环境。
- [组件展示页粉色深色截图](gallery-wife-dark-390.png)：四场景全部加载，无脚本错误；示例手写句同步正式页面。
- `node docs/qa/page-header-implementation/check-states.cjs`、`node tests/design-system.js`、`node tests/scenarios.js`、`node tests/meal-ui.js`、`node tests/sw-cache.js`、`tests/startup-browser.js` 与 `git diff --check` 均通过；SW 测试覆盖一次临时图片请求失败后的有界重试。原生 iOS 状态栏不在浏览器截图中；用户手机上的已安装态仍需上线后实测。

## 灵动岛周围的系统栏

用户补充的老婆手机截图在网页场景上方显示一段白色、黑字的 iOS 状态栏。这段区域位于网页可绘制视口之外；该旧安装无法从现有截图确定当初是否在加入主屏幕时捕获了 `black-translucent`。当前网页入口已在首屏 HTML 包含 `viewport-fit=cover`、`apple-mobile-web-app-capable=yes` 和 `apple-mobile-web-app-status-bar-style=black-translucent`，页头从网页坐标 y=0 铺图。按 [Apple 的状态栏元信息说明](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)，只有 `black-translucent` 安装态才把网页内容绘制到状态栏后；`default` 或 `black` 会把网页放在状态栏之下。[WebKit iOS 26 问题记录](https://bugs.webkit.org/show_bug.cgi?id=316008) 指出该元信息需要在加入主屏幕时存在，旧安装不一定能用网页更新改变可绘制区域。因此 v45 的场景图和渐隐可以修复**网页内部**的图像和下边界，不能保证已经显示白色系统栏的旧图标直接变成灵动岛背景图。保留旧图标和本机记录，待用户愿意时可并列添加一个新图标做无损验证；不要先删除旧图标。

## 发布

待部署后补充 commit、Pages 构建及线上资源核对。应用壳版本 v45；七张图改名 `v2.jpg`，图片缓存容器仍独立保留 `duofit-images-v1`。
