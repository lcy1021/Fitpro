# v50 顶部运行诊断

v49 用户实测未解决。本次仅增加现有「复制连接诊断」输出，不宣称修复白条、不改视觉布局。

## 需要的证据

原桌面 App 打开 → 今日轻轻滚动一次 → 记录 → 设置 → 复制连接诊断。

输出 page 字段包括实际版本、UA、主屏幕标志、当前视口／安全区／表头位置、首开执行后快照、首次手动滚动快照及阻止原因。即使切页后复制，首开和首次滚动证据仍在。只保存在当前页面内存，刷新重置，不自动上传。

没有这些值就无法区分：用户实际加载版本、主屏幕检测是否触发、scrollTo 是否实际生效、原生预留区域是否变化。诊断值也不能替代系统截图，二者应结合判断。

## 验证

- `node tests/design-system.js`
- `node tests/scenarios.js`
- `node tests/cloud-connection.js`
- `node tests/sw-cache.js`
- `node tests/viewport-diagnostics-browser.js`：首开为 1px，首次滚动 90px，切换记录后点击真实复制按钮，首开证据保留、版本 v50、无合成私人字段或 token。结果见 browser-result.json（完全为本机合成数据）。
- `git diff --check`

没有新增 UI、替换资产、改动 config、记录格式或用户数据。核心版本 v50，独立图片缓存保留。用户实机截图未入库。
