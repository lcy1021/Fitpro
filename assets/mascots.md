# DuoFit 原版角色资产

当前入口：`design-system/mascots.js`。2026-10-09用户明确要求新增视觉细节与原有动画形象一致。

| 场景 | 老公 | 老婆 |
| --- | --- | --- |
| 登录 / 今日跑步 | `login/hus-running.webp` | `login/wife-running.webp` |
| 饮食吃饭 | `mood/hus-meal.webp` | `mood/wife-meal.webp` |
| 头像 | `avatar-hus.webp` | `avatar-wife.webp` |
| 情绪 / 训练 / 称重 | `mood/hus-*.webp` | `mood/wife-*.webp` |

记录页用用户在方案一中认可的 `meal-art/record-couple-v1.webp?v=meal1`；该图是现有认可的双人构图，不应误称为最早的登录动画原图。

身份核对：蓝色深蓝发卷、青色帽檐、深蓝白条纹短裤、青色运动鞋；粉色高马尾与发带、白条纹运动裙、珊瑚鞋。脸部眼睛、腮红、云朵边缘、材质与身体比例也必须对照来源图。不得只根据蓝粉颜色认定是一套角色。

优先直接复用现有文件；UI背景、字体、爱心可单独调整。若确实缺少新姿势，必须以原版为编辑输入，逐项验收上述身份特征；不允许只通过文字重绘。新图另存版本，不覆盖旧源文件。未达到一致性时沿用原版，不发布漂移角色。

v37的 `today-{hus,wife}-detail-v1.webp`、`diet-{hus,wife}-detail-v1.webp`、`record-couple-detail-v1.webp` 保留用于历史定位，禁止用于新模块。源码与组件页使用相同注册入口，缓存版本保持原图原URL。
