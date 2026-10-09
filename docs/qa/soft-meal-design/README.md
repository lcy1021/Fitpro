# 方案一浅色餐卡与角色标题 · v35

## 确认范围

用户确认[最终参考稿](selected-design.png)：恢复方案一浅色餐卡，不采用深色热量标题；餐次内只12/14/16px、同级模块标题17px；打卡选中无边框；记录切换只写老公/老婆，选中白底轻阴影、未选灰字，没有下划线；我的一天无蛋白质头注，使用吃饭角色；日期在标题下，图标底色与角色一致，记录用双人角色。

## 实现与原因

`mealSectionHeading / mealArt / mealHeading / mealPlanContent / mealActions / dietDayRows`和Shared meal surfaces一起维护。v34本来有10/11/12/13/16/17/20px，提示标签每餐重复；候选图的标题又比真实17px模块标题大。新版本用字号、字重、正文/辅助/角色三类文字色收敛层级，插画负责装饰。

旧空状态`.empty`在浏览器第一次检查中覆盖了历史「未打卡」字号；用`.meal-status.empty`修正字体与空态留白，所有空/非空餐次一起通过复查。选中差异以底色、阴影和字重表达，不依赖双方同时亮起的身份色，也不增加下划线。

新增四餐与双人透明WebP共61,598 bytes（约60KiB），按需加载，图片缓存继续独立复用；原始PNG只保存为设计源，不被页面下载。现有`mood(person,'meal')`直接复用。通用餐次插画不是用户实际食物/份量，不参与热量计算；历史不引用今日计划重算。

保留既有连续打卡、四周日历、目标、趋势、身体输入与共享设置，因此实际完整页面不等于概念稿只展示的几个片段。匿名身份、RPC、默认共享及本人关闭、伴侣只读、历史日期范围都沿用原逻辑；无SQL/云函数改动，config.js未动。

## 验证

- [layout-results.json](layout-results.json)：CUA在应用内浏览器实际检查2角色×2主题×320/390px×3页面，共24组；无横向溢出或食物/热量裁切，标题17px，餐次12/14/16px，控件≥40px。
- [edge-results.json](edge-results.json)：320px老婆深色默认菜单/受限但缺计划，今日和饮食各一组；默认食品自然换行，受限状态仅显示餐食待确认，全部字号仍在三档。
- CUA实际点击今日早餐没吃，旧实际热量/食物隐藏，仍能打开食物编辑弹窗；点击另一个历史角色，aria-pressed切换，选中白底阴影、未选中灰色，::after为空且没有下划线，伴侣编辑入口为0；控制台error/warn为空。
- `node tests/scenarios.js`：历史计划、餐单、保存热量、跳过旧食品、HTML转义、权限与恢复场景通过。
- `node tests/meal-ui.js`：AI部分结果/未知热量/重复请求/迟到回复通过。
- `node tests/sw-cache.js`：核心更新、离线回退、独立图片缓存/去重/素材版本通过。
- 原有`tests/checkin-browser.js`与`tests/partner-records-browser.js`通过，包含日/周/角色切换、历史与伴侣只读、未保存身体输入、默认共享与手动关闭、320/390px明暗布局。截图写到`/tmp/duofit-v35-checkin-qa`和`/tmp/duofit-v35-partner-qa`，旧发布证据未覆盖。
- 所有资料均为本地合成数据；未加载生产config.js，未发真实AI或私人请求。没有用户手机实机或字体缩放认证的结论。

## 视觉证据

[真实实现三界面对照](implementation-overview.jpg) · [记录标题与双人角色](record-header-hus-light-390.png)

- [今日 / 参考对照](today-hus-light-390-comparison.jpg)
- [我的一天 / 参考对照](diet-hus-light-390-comparison.jpg)
- [老婆历史 / 参考对照](record-wife-light-390-comparison.jpg)
- [标题与切换局部对照](header-selection-comparison.jpg)

本地场景：`tests/theme-preview.html?view=today|diet|record&person=hus|wife&theme=light|dark&journal=1&sharing=on&meal-design=1`；`focus=meals|plans|history`仅用于定位截图，不改变生产页面。主题参考页使用v35脚本。

设计QA结论见根目录[design-qa.md](../../../design-qa.md)。发布后补充release-results.json；核心v35，媒体meal1，旧角色和动作仍media1，图片缓存duofit-images-v1。
