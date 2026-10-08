# DuoFit 图标

本目录包含 25 个界面图标和 `preview.html` 总览。图标采用 24 × 24 画板、1.85 px 圆角线条；蓝色与粉色分别沿用 App 的双人身份色。

App 使用 `index.html` 中的内联 SVG sprite，并通过 `currentColor` 跟随当前身份及深色模式。本目录的单文件 SVG 用于设计交付或其它页面复用。更新图标时，应同步修改 `index.html` 内的同名 `<symbol>`。

`send.svg` 使用 [Lucide arrow-up](https://github.com/lucide-icons/lucide/blob/main/icons/arrow-up.svg)，线宽调整为 1.85 px；许可证保存在 `LICENSE.lucide`。发送按钮使用 44 × 44 px 点击区域、22 px 图标，空输入禁用，发送中显示旋转状态。
