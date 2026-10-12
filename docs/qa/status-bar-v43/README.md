# v43 顶部连续背景验收

## 依据与可执行差异

用户 2026-10-12 的 iPhone 深色饮食页截图显示：灵动岛、时间及状态图标后方为黑色横带，页面蓝色从横带下缘才开始。用户希望原桌面图标直接更新，参考彩云天气截图中状态栏与页面连续的背景。对照 [v42 同视口深色饮食页](../status-bar-bg/after-hus-dark-390.png) 和 [v43 同视口深色饮食页](hus-dark-390.png)：原页面顶部 `--mesh` 与根节点虽一致，缺少可供系统采样的明确顶部底色；v43 从顶端蓝色底色渐变到页面背景，并使浅深 `theme-color` 跟随本人身份。这里的 59px 安全区是桌面浏览器合成预览；不能据此断言已安装 iPhone 的系统状态栏也变色。

## 视觉清点

| 项目 | v42 → v43 对照结果 |
| --- | --- |
| 背景 | 顶部起点改为语义 `--app-top-color`，向页面 `--bg` 连续渐变；蓝粉、浅深各有对应底色。根节点、正文、角色选择层、训练层共用。 |
| 标题与小字 | 「饮食」、日期、「已同步」、卡片标题及说明位置和字号未改；59px 安全区后仍可读。 |
| 插图主体/姿态/道具/装饰 | 右上原版蓝粉奔跑形象、热量卡内原版就餐形象、帽子、食物与云朵保留；没有替换素材或删减装饰。 |
| 卡片与数据 | 日志、热量统计、周历布局及真实数据 helper 未改；合成预览中的记录数和热量只是固定 QA 数据。 |

## 验证

- `node capture.js`：饮食页 320/390px × 蓝粉 × 浅深共 8 组；根节点和正文背景一致，顶部颜色和激活的 `theme-color` 一致，无横向溢出或页面错误；切换本人身份后主题色更新。原始检查见 [checks.json](checks.json)。
- 390px 截图：[蓝浅](hus-light-390.png)、[蓝深](hus-dark-390.png)、[粉浅](wife-light-390.png)、[粉深](wife-dark-390.png)。
- 回归：`node tests/design-system.js`、`node tests/scenarios.js`、`node tests/meal-ui.js`、`node tests/sw-cache.js`。
- 真机验收仍需从**原有桌面图标**打开后截图。WebKit [316008](https://bugs.webkit.org/show_bug.cgi?id=316008) 记录已安装网页的状态栏布局可能保留安装时的模式；[305546](https://bugs.webkit.org/show_bug.cgi?id=305546) 记录 iOS 26.2 的状态栏背景着色及路由回退异常。网页端无法保证旧安装的灵动岛周围一定出现渐变。

## 发布

[`8c5c29f`](https://github.com/lcy1021/Fitpro/commit/8c5c29f0ff8762d3bde2e3a3a5d99f2fbb20bc8b) 已推送 `main`；[GitHub Pages 部署 38243285676](https://github.com/lcy1021/Fitpro/actions/runs/38243285676) 成功。线上 `index.html`、`design-system/tokens.css`、`sw.js` 与本地 v43 逐字节一致。
