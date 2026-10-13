# 表头手写字体交付

`LongCang-Regular.ttf` 为原始母版（5,162,508 bytes），`LongCang-OFL.txt` 保留原版权与 SIL OFL 1.1 许可。

运行使用 `DuoFit-Header-v1.woff2`（14,488 bytes），仅包含四页、训练/休息两状态的固定手写文案。字体内部名称改为 DuoFit Header；CSS 的 DuoFit Long Cang 别名与既有布局保留。原字形轮廓和 advance metrics 逐字核对一致，记录见 `docs/qa/startup-resilience-v60/font-subset.json`。

维护时安装 fonttools/brotli 后运行 `scripts/subset-header-font.py`；这些是维护工具，App 无运行时依赖或构建要求。新增手写文案须补齐字符、生成并核对，然后将素材递增为 v2（同步脚本目标、components.css 与 SW CORE），不能覆盖母版或静默使用系统字。
