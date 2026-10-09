# 图片加载优化 · 2026-10-09

## 找到的问题

- 旧 Service Worker 每次发布都会删除旧 `duofit-v*` 缓存，训练图随应用更新一起失效。
- 旧策略在缓存命中后仍向网络请求同一张图，增加流量与首次加载其他资源时的竞争。
- 列表里 72–108 CSS px 的小图与跟练大图使用同一个 800×600 GIF。32 个 GIF 合计 6,834,461 bytes，最大 540,644 bytes。
- 安装 Service Worker 时一次性下载多个尺寸的 App 图标、头像和跑步图，和首屏请求竞争。
- 当前机器一次公开图片请求的 TTFB 约 1.25 秒、总耗时约 1.91 秒。这只描述该次 GitHub Pages 请求，不能代表手机网络或证明服务器故障。

## 修改

- 从原 GIF 生成 800×600 跟练 WebP 与 320×240 小动图。原始 GIF/PNG 继续留作源文件和不支持 WebP 的浏览器回退。
- `<picture>` 在现代浏览器中选择 WebP；列表、今日预览、热身清单用小动图，当前跟练用大动图。当前大图 eager/high，其他图 lazy/async。
- 所有转换后的动图保持原帧数、逐帧时长、循环方式。两套图片都通过读取文件验证；大图所有帧的最大平均 RGB 差值为 1.75/255，已查看对比图和手机尺寸页面。
- 头像和 14 张表情 PNG 转为无损 WebP，逐像素验证 RGBA 相同。
- 独立 `duofit-images-v1` 图片缓存保留已下载图片；命中时不请求网络，冷请求并发去重。页面、脚本、样式继续优先获取最新版本。
- 激活新版本时先迁移旧 DuoFit 缓存中的图片，再删除旧应用缓存；保留其他应用缓存，不缓存 Supabase/API 数据。
- CORE 只预缓存应用文件，取消在安装阶段下载一批图片。图片按实际使用保存到独立缓存。
- 跟练提前加载一个下一动作，重复动作不重复预加载；省流量/2G 模式跳过，退出训练会取消尚未开始的预加载。

## 文件体积

| 资源 | 原大小 | 新大小 | 减少 |
|---|---:|---:|---:|
| 32 张跟练大动图 | 6,834,461 B | 1,601,682 B | 76.6% |
| 32 张列表小动图 | 6,834,461 B | 494,982 B | 92.8% |
| 头像 + 14 张表情 | 1,026,311 B | 615,726 B | 40.0% |

这是文件体积对比，不是声称手机加载时间一定缩短同样比例。页面按实际需要加载部分动作，不会一次下载两套共 64 张图。未引用的设计源文件不计入页面下载量。

## 验证

- `scripts/optimize-images.py`：生成文件并校验帧数、时长、循环及无损角色像素；需要 Pillow 支持 WebP。
- `node tests/sw-cache.js`：新页面优先、离线回退、图片命中无网络、冷请求去重、素材版本更新、旧图片迁移、外部数据绕过。
- `node tests/image-browser.js`：需要 Playwright 和本机 8765 HTTP 服务，仅使用合成档案；实际浏览器检查三个页面使用小 WebP、跟练大 WebP、没有 GIF 下载、下一动作只预加载一次、320px 布局以及已下载图片离线可读。
- `results.json`、`browser-results.json` 为文件统计和浏览器结果；`comparison.png` 及 `*-mobile.png` 为视觉核对。
- 既有 `scenarios`、`default-plan`、`meal-ui`、`cloud-connection` 回归通过。

## 后续素材更新

只修改页面/业务代码时，递增应用缓存版本，保留图片缓存名称。改图片内容时递增相关图片 URL 的 `media1`（图标仍用 `logo3`）并同步模板；否则独立缓存会继续使用旧素材。不要把所有训练图加入 CORE 或在首页一次预加载。

参考：[MDN 缓存策略](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)、[图片格式](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)、[加载优先级](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority)。
