# 设置齿轮裁切修复 · 2026-10-08

上一轮将问题判断为底部导航遮挡，仅修复了页面留白；用户再次指出截图未解决原问题。重新查看设置入口和 SVG 源码后，确认齿轮本身仍被裁切。

旧图标线段端点范围为 x=0.8…23.2、y=2.8…25.2，而 viewBox 为 0…24。1.85 px 描边使下沿进一步越界，齿轮中心也与中心圆偏离。替换为官方 Lucide `settings` 路径，画板仍为 24×24，显示仍为 19 px，保留圆角线端与 1.85 px 线宽。

同步修改 `index.html` sprite、`UIset/icons/settings.svg` 和图标总览；许可证见 `UIset/icons/LICENSE.lucide`。缓存升至 `duofit-v21`。

下面的两张局部截图来自真实本机页面的同一位置，放大 4 倍并排展示：左为旧图标，右为修复后。展开、收起设置已检查；`tests/scenarios.js` 和 `tests/sw-cache.js` 通过。

![左旧右新：齿轮下缘完整闭合](comparison.png)

[修复后的完整页面](page-after.jpg)
