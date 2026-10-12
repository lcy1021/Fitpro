# 四页场景表头实现 QA · v44

日期：2026-10-12。状态：**v44 已发布线上**。依据为用户确认的[高清规格稿](../page-header-proposal/spec/README.md)；正式 App 继续使用原生 iOS 状态栏，规格图顶部的 9:41 / 灵动岛 / 信号为演示图层。

## 同屏证据

同一 390px 视口、同一合成数据、蓝色身份／浅色／休息日，均为 3× 图片。下面每组左为确认稿、右为改后 App：

| 页面 | 确认稿 | v44 实装 |
| --- | --- | --- |
| 今日 | [目标](../page-header-proposal/spec/proposed-today-390@3x.png) | [实装](../page-header-proposal/implementation/today-hus-light-390@3x.png) |
| 饮食 | [目标](../page-header-proposal/spec/proposed-diet-390@3x.png) | [实装](../page-header-proposal/implementation/diet-hus-light-390@3x.png) |
| 训练 | [目标](../page-header-proposal/spec/proposed-train-390@3x.png) | [实装](../page-header-proposal/implementation/train-hus-light-390@3x.png) |
| 记录 | [目标](../page-header-proposal/spec/proposed-record-390@3x.png) | [实装](../page-header-proposal/implementation/record-hus-light-390@3x.png) |

同屏人工核对：四页背景分别为湖岸晨光、厨房窗景、晨光运动室、傍晚记录室；蓝角色的发卷／帽檐、短圆手臂、条纹短裤、青色鞋与道具和姿态逐页一致。记录页蓝粉围桌、开书、杯子、窗景与目标相同。手写句为独立 Long Cang 文字层，线条同一 SVG；标题／日期／同步为独立 DOM，数据未烧进场景。饮食热量卡的小吃饭角色及记录首卡的双人标题插画／重复日期已去重；原餐次、统计、起身、训练与双人数据仍为真实组件。规格稿状态栏演示层没有放进正式页面。

四页精确坐标在 390px 均为：表头高 520px，标题 x=24/y=393.375，日期 y=450，同步 y=479，首卡 y=520；320px 均为：表头高 426.656px，标题 x=24/y=304.266，日期 y=356.656，同步 y=385.656，首卡 y=426.656。与[规格测量](../page-header-proposal/spec/spec-checks.json)相同。背景后的页面底色改为 `--bg`，避免旧顶部渐变继续透入首卡区域。

## 蓝粉与深浅扩展

[`implementation/checks.json`](../page-header-proposal/implementation/checks.json)记录 4 页 × 2 身份 × 2 主题 × 2 宽度，共 32 张截图的几何、字体加载、横溢、重复插画和脚本错误检查。全部通过。可抽查[粉色今日](../page-header-proposal/implementation/today-wife-light-390@3x.jpg)、[粉色饮食深色 320px](../page-header-proposal/implementation/diet-wife-dark-320@3x.jpg)、[粉色训练 320px](../page-header-proposal/implementation/train-wife-light-320@3x.jpg)、[双人记录深色](../page-header-proposal/implementation/record-hus-dark-390@3x.jpg)。

粉色单人场景以规格场景与原版粉色角色编辑输入生成，遵守高马尾、发带、短圆手臂、条纹运动裙／短裤结构、珊瑚鞋的身份清单；这些是按用户要求补齐的粉色变体，蓝色浅色四图才有此前逐屏确认的视觉参考。深色主题只叠统一遮罩并换文字色，不重绘场景。浏览器截屏无原生系统状态栏，iPhone 安全区／灵动岛仍需在已安装 App 真机核验。

## 状态与回归

- `node docs/qa/page-header-implementation/check-states.cjs`：320/390px 下无已确认时间时同步行留空、首卡 y 不动；成功显示「已同步 · 9:41」，离线显示真实告警；切换饮食更新标题／场景／手写句，换粉色身份加载对应图；最长休息日手写句未越屏。
- `node tests/design-system.js`、`node tests/scenarios.js`、`node tests/meal-ui.js`、`node tests/sw-cache.js` 及 Chrome 通道的 `tests/startup-browser.js`：全部通过。启动测试覆盖缓存、首次进入、本机模式、访客、跳过动效与减弱动效；组件展示页四图、粉色切换、深色切换及本地字体加载无脚本错误。
- 视觉截屏来自 `capture-implementation.cjs`，仅使用本机合成预览，不载入 `config.js` 或真实账户数据。线上发布、真机点击与云端写入未在本次执行。

## 发布

应用提交 [`6c8ae86`](https://github.com/lcy1021/Fitpro/commit/6c8ae86b3c63badf2267e81fbdb366e2c82b2c2b) 已推送 `main`，[Pages 构建 38267761692](https://github.com/lcy1021/Fitpro/actions/runs/38267761692) 成功。线上入口、SW、设计系统、字体与 7 张场景图共 15 项均为 200，逐字节匹配本地提交，详见[发布核对](release-verification.json)。核心缓存 v44；CSS／JS 查询参数、SW CORE、主题预览与版本测试已同步，图片缓存仍独立 `duofit-images-v1`。新场景图使用独立文件名，不覆盖历史角色素材。已安装主屏幕入口读取新版网页内容，无需重新分享；原生 iOS 状态栏效果仍需用户手机实测。
