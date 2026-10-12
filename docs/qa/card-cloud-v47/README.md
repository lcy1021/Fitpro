# 共用卡片去云层 · v47 QA

日期：2026-10-13。状态：v47 已发布，手机视觉待验收。

## 对照与变更

以当前 App 的共用卡片为基线，同一合成数据、390px 视口、蓝粉及浅深主题截图逐项核对。用户指出卡片云图扎眼，偏好蓝色渐变或更弱的云；深色工位起身卡顶部的云层尤其明显。沿用方案一的卡片尺寸、两级投影与原版角色，选择移除共用卡片和餐卡标题的云图，改用身份对应的低对比度渐变。蓝色身份为浅蓝／深蓝，粉色身份为浅粉／深粉；餐区外壳保留与白色内卡的区分。

| 项目 | 修改前 | 修改后 |
| --- | --- | --- |
| 卡片外壳 | 云朵贴图覆盖标题区，深色时轮廓突兀 | 共用 `--ds-surface-gradient`，不再叠云图 |
| 今日餐区 | 浅色底上叠云层 | `--ds-meal-scene-bg` 柔和渐变，白色餐卡边界可辨 |
| 餐卡标题 | 图片云纹覆盖食物图与餐名附近 | `--ds-meal-header-gradient` 极浅渐变，食物图完整保留 |
| 标题小字、插图 | 原版角色、手写小字、餐图、道具 | 位置、姿态、帽子／发带、服装、餐品不变 |
| 内容、投影 | 真实计划／记录数据、一级外壳与二级内卡 | 布局、文案、投影和交互不变 |

同屏截图：[深色蓝色工位起身修改前](before-stand-hus-dark-390.png) / [修改后](after-stand-hus-dark-390.png)；[浅色蓝色今日餐区修改前](before-today-meals-hus-light-390.png) / [修改后](after-today-meals-hus-light-390.png)；[浅色粉色工位起身修改前](before-stand-wife-light-390.png) / [修改后](after-stand-wife-light-390.png)。其余蓝粉浅深状态与饮食日志截图也保存在本目录。截图为本机合成数据，不含真实健康记录。

## 验证

`node docs/qa/card-cloud-v47/check.cjs` 检查四页 × 蓝粉 × 浅深 × 320/390px 共 32 组：共用外壳是渐变、卡片与餐卡标题不加载云图、无横向溢出或脚本错误；320px 长说明自然换行、不压到内卡。工位起身加一次与餐次状态选择可操作。`node tests/design-system.js`、`node tests/scenarios.js`、`node tests/sw-cache.js`、`node tests/meal-ui.js` 和 `node docs/qa/page-hero-dark-v45/check-resilience.cjs` 均通过；场景底部 32 组准确衔接、老婆四页离线图能解码。`git diff --check` 通过。真实手机视觉待发布后确认。

本次没有修改页面场景图、角色原版素材、食物图片、`config.js`、身份格式、记录 ID 或用户数据。

## 发布

应用提交 [`fbe2200`](https://github.com/lcy1021/Fitpro/commit/fbe2200bcbf3053d7b574d14ad9a6a699665cd81) 已推送 `main`，[Pages 构建 38283271992](https://github.com/lcy1021/Fitpro/actions/runs/38283271992) 成功。[线上核对](release-verification.json)覆盖 11 项，均为 HTTP 200 且 SHA-256 与本地一致。SW 核心缓存 v47，图片缓存独立保留 `duofit-images-v1`。
