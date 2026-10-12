# v40 饮食补打卡与历史餐次修改

## 依据与改前差异

2026-10-12 用户提出在饮食页进入对应日期，增加或修改当天内容；看到首版本地界面后进一步确认：未打卡时只保留「未打卡」状态和补打卡入口，输入食物并确认后才识别「按计划/吃多了」并显示常规控件。已打开用户确认的 [蓝粉方案一](../soft-meal-design/selected-design.png)、v39 [同视口日志截图](../module-unification/diet-log-hus-dark-390.png) 和首版空白日截图。视觉稿中的历史详情原为只读；本次用户要求改变本人饮食记录的操作范围。

| 项目 | v39 | v40 |
| --- | --- | --- |
| 过去日期 | 只能查看；空白旧周不可进入 | 近 120 天任意日期可进入，空白日也能补记 |
| 餐次操作 | 仅今天本人有食物编辑和三态打卡 | 未打卡保持空态，只显示「补打卡」；确认食物后显示常规状态与修改操作 |
| 食物弹窗 | 默认读写今天 | 标题标明历史日期，读写所选日期；热量完整后才能确认，异步估算校验日期 |
| 伴侣与记录页 | 只读 | 继续只读 |

没有新增视觉组件。背景/渐变与云层、标题小字、原版角色的帽子/发型/轮廓/服装/比例及吃饭姿态/饭碗/西兰花、餐图底托、图标和装饰均未修改。历史餐次在空态仅复用编辑入口，在确认后才复用三态控件；蓝粉和浅深色由现有 token 控制。空输入时确认按钮使用现有 `--sunk/--muted` 表示禁用。餐卡仍用12/14/16px，模块标题仍19px/800；长食物自然换行。

## 数据与权限

- 只允许本人近 120 天的非未来日期；超出范围的日期按钮禁用。过去周即使没有记录也可进入，补记沿用 `person_YYYY-MM-DD` ID、原 `putCheckin` 本地保存和云端同步。
- 未打卡时不预设状态，也不显示三态选择；补打卡先进入记食物弹窗，食物热量全部确定后按当前计划范围生成状态，随后呈现常规记录。未打卡但残留旧食物字段时，不显示旧食物/热量，弹窗从空白开始。
- 今日热量汇总继续读取今天。过去餐次的打卡/食物修改不会误写今天。伴侣入口、记录页历史详情均不显示编辑控件；共享白名单未改。
- 关闭食物弹窗或切换身份后，旧 AI 响应不能覆盖当前餐次；食物保存、删除再次校验打开时的身份与日期。
- 删除食物沿用既有数据语义，保留独立的餐次打卡状态；弹窗文案明确说明这一点。
- 食物热量和“按计划/吃多了”仍沿用当前估算与既有手动状态控件；历史计划没有快照，本轮没有添加追溯过去计划的推断。

## 验证

本机静态服务、合成资料、无生产配置。`before-*` 来自 HEAD v39 的 `index.html`/预览；`after-*` 来自本地 v40；均在选中昨天、含长食物文案的同状态下拍摄。矩阵为老公/老婆 × 浅/深 × 320/390px，各 8 张。两组无页面横溢或 JS 错误：[改前矩阵](before-matrix.json)、[改后矩阵](after-matrix.json)。

同屏样例：[已有记录浅色老公改前](before-hus-light-390.png) / [改后](after-hus-light-390.png)；[深色老婆改前](before-wife-dark-320.png) / [改后](after-wife-dark-320.png)。逐项复查：背景、标题、角色与装饰未变化；新增控件随主体色切换，长文不截断，320px无横溢。

针对用户二次确认，另拍首版本地空白日与修正后的 8 组同状态截图：[蓝色浅色改前](blank-before-correction-hus-light-390.png) / [改后](blank-after-correction-hus-light-390.png)，[粉色深色改前](blank-before-correction-wife-dark-320.png) / [改后](blank-after-correction-wife-dark-320.png)；完整结果见 [首版矩阵](blank-before-correction-matrix.json) / [修正矩阵](blank-after-correction-matrix.json)。四餐仍显示「未打卡」，三态按钮消失，改为单一补打卡入口。补打卡的 [空输入弹窗](backfill-dialog-hus-light-390.png)、[320px 粉色深色弹窗](backfill-dialog-wife-dark-320.png) 与 [确认后记录](backfill-confirmed-hus-light-390.png) 也已截图；空输入禁用样式清楚，长日期/提示自然换行。

`tests/checkin-browser.js` 在蓝粉×浅深下实际点击昨天已记录餐次的三态、保存/修改/删除食物；进入五周前空白日确认四餐无状态按钮，食物未确认时不能提交，补记后仅该餐出现常规状态控件。今天保留原值；继续检查未来禁用、记录页未保存身体输入、320/390px布局。结果见 [浏览器结果](browser-results.json)，对应 `diet-*` / `record-*` 截图保存在本目录。`tests/partner-records-browser.js` 也通过共享开/关、伴侣只读和未保存身体输入回归，证据在 `partner/`。`tests/scenarios.js` 检查空态、旧食物隐藏、本人历史日期附着、伴侣/超范围/未来只读。`tests/meal-ui.js` 检查部分热量与迟到 AI 响应。`tests/design-system.js`、`tests/sw-cache.js` 和 `git diff --check` 通过。

未用真实健康数据、真实手机或生产云端写入验证。浏览器预览中的云端同步是本机模拟；实际发布后需用本人账户核对跨设备同步。

## 发布

应用提交 [`ff20e29`](https://github.com/lcy1021/Fitpro/commit/ff20e29af44f6776018a01192773cc00e5a7e38e) 已推送 `main`；[Pages 构建 38212563503](https://github.com/lcy1021/Fitpro/actions/runs/38212563503) 成功。线上 `index.html`、`sw.js`、`private-coach.js`、设计系统展示页、设计规范及本机主题预览，共 6 个文件 HTTP 200，SHA-256 与本地逐字节一致，见 [发布核对](release-verification.json)。核心 CSS/JS 查询版本、SW CORE、本机预览已同步；图片缓存独立保持 `duofit-images-v1`。
