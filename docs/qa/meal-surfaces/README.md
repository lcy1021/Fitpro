# 三处餐次设计统一 · v34

## 范围与审查

用户希望优化今日餐卡、饮食计划和本人/伴侣历史食物区域。修改前实际打开真实应用的合成场景并保存截图；没有将用户真实健康截图放入仓库。

| 表面 | 已确认的问题 | 统一设计 |
| --- | --- | --- |
| 今日 | 个性建议套通用黄色提示；蓝色实际记录内食物被单行截断；边框/色块/状态按钮争抢重点 | 单一餐卡；标题和计划范围一行；建议为小标签+正文；实际热量突出，细线区分；三态分段选择 |
| 饮食计划 | 每餐单独阴影卡片并套蓝色建议块，重复留白和大色块 | 四餐一个清晰列表，细线分餐，标题/热量与今日共用组件 |
| 历史 | 外卡内再叠四张灰卡，状态、食物和热量的对齐/字号与其他页不一致 | 扁平餐次行，标题/状态与热量分层，食物完整换行；空餐保留说明；本人/伴侣只读 |

参考：[Lifesum 餐次记录说明](https://help.lifesum.com/en/article/traditional-food-tracking-4nzcd7/) 的分餐入口、[Cronometer 官方日记说明](https://support.cronometer.com/hc/en-us/articles/360018593112-Mobile-Diary-Overview) 的摘要和日记分组。仅参考公开说明；官方图片未能完成视觉读取，未声称体验其原生应用或复刻截图。保留 DuoFit 现有蓝粉角色、主题与导航。

## 实现与行为边界

- `mealHeading / mealEnergy / mealPlanContent / mealActions` 共用；历史和饮食日记仍共用 `dietDayRows`。旧 `.meal-top / .logged` 和旧分段按钮选中覆盖样式已移除，避免下次只改某一条路径。
- 食物原文转义，名称/份量完整自然换行，没有隐藏或截断；建议里的份量、饮食限制原文不改写。
- 个性餐食优先，有饮食限制但缺少个性计划则提示待确认；不夹带默认菜单。历史只使用保存的食物/热量。
- 今日没吃不显示旧食物热量，与历史和摄入计算一致；仍可重新记食物，没有删除保存数据。
- 分段按钮统一显示「按计划 / 吃多了 / 没吃」，选中含勾和文字；无障碍标签保留餐次及「按计划吃了」。初版320px五字选项加勾出现换行，视觉复查后缩短可见标签并设置不换行。
- 操作触摸高度至少40px，记食物入口44px；蓝粉和浅/深色变量继续继承，历史的颜色跟随正在查看的角色。
- SQL、同步请求、分享默认和个人开关均未调整。

## 验证证据

- `layout-results.json`：2角色×2主题×2宽度×3页面，共24组；无横向溢出，食物不强制单行/越界，操作高度不小于40px，伴侣历史无编辑入口。
- `final-content-results.json`：最后加入长食物名称/份量并修正窄屏按钮后的6组复查；无溢出、食物裁切或打卡文字换行。
- 复查「吃多了」在今日与饮食页的选中底色/文字相同，40px操作高度；有饮食限制但缺少计划时显示待确认，不回退默认菜单。
- 浏览器实际点击：今日早餐改成没吃后不再出现旧210kcal与食物，仍可打开食物弹窗；食物记录可编辑。
- `node tests/scenarios.js`：新增个性计划/默认优先级、限制缺计划、HTML转义、历史保存热量和没吃旧食物隐藏验证；原历史/恢复/权限场景通过。
- `node tests/meal-ui.js`、`node tests/cloud-connection.js`、`node tests/default-plan.js`、`node tests/sw-cache.js`：全部通过。
- 既有 `tests/checkin-browser.js` 和 `tests/partner-records-browser.js`：均通过，包括周/日/角色切换、今天打卡/食物弹窗、历史/伴侣只读、未保存身体输入、默认共享与个人关闭、320/390px浅/深色。复跑截图临时写 `/tmp/duofit-checkin-qa` 和 `/tmp/duofit-partner-qa`，不覆盖旧发布的截图证据。
- 浏览器场景没有生产配置和真实AI请求；没有用户手机实机效果、字体缩放或完整无障碍认证的结论。

## 可复现的合成场景

本地启动仓库HTTP服务，在 `/tests/theme-preview.html` 设：

- `view=today|diet|record`
- `person=hus|wife`，`theme=light|dark`
- `journal=1&sharing=on&meal-design=1`：长个性餐食、保存的真实结构食物、伴侣历史；所有内容均合成。
- 再加 `missing-plan=1`：有饮食限制但个性计划缺失。
- 不加 `meal-design`：原有默认菜单、日志/共享回归场景。

记录页点击另一个角色看同日详情。检查320/390px并在结束时重置临时视口。

## 截图

| 区域 | 修改前 | v34 |
| --- | --- | --- |
| 今日个性餐卡 | [之前](today-personal-before.jpg) | [之后](today-after.jpg) |
| 饮食计划 | [之前](plan-before.jpg) | [之后](plan-after.jpg) |
| 伴侣历史 | [之前](history-before.jpg) | [之后](history-after.jpg) |

[320px深色今日](today-wife-dark-320.jpg) · [320px深色计划](plan-wife-dark-320.jpg) · [320px深色历史](history-wife-dark-320.jpg) · [之前默认餐卡](today-before.jpg)

应用核心版本为v34；图片缓存仍为 `duofit-images-v1`。发布使用现有GitHub Pages main流程；维护记录在 [maintenance-history.md](../../maintenance-history.md)。

## 发布核对

应用提交 [`d16d0b6`](https://github.com/lcy1021/Fitpro/commit/d16d0b6efd62c12a803ded60bacee76416ffc644) 的 [Pages构建](https://github.com/lcy1021/Fitpro/actions/runs/37913975617) 已成功；公开站点的 index.html、sw.js、private-coach.js、private-coach.css 与本地逐字节相同，SHA-256 见 [release-results.json](release-results.json)。本节记录应用发布核对，随后补充文档的提交不修改应用文件。
