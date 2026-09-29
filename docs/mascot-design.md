# 双人减脂搭子形象设计规范

这套形象不是用来评价“做得好不好”，而是让老公和老婆在打卡时得到轻量、温暖的反馈。所有状态都沿用现有角色：老婆是粉色软糖云朵，老公是蓝色软糖云朵；角色的轮廓、脸部比例、腮红、头饰和鞋子保持一致。服装用于清楚区分两人：老婆穿运动短裙，老公穿运动短裤。

## 1. 统一视觉语言

- **造型**：圆润的 3D 软糖 / 毛绒玩具质感，身体由连续的柔软曲面构成，不增加手指、鼻子或写实肌肉。
- **云朵轮廓与手臂**：静态动作中身体是一整块连续的云朵，手臂从下侧自然伸出并保持短小；不要在头带下方生成悬垂的 C 形大凸起，避免看起来像耳朵。称重时保留扶下巴的小手，吃饭时保留拿食物的小手。
- **镜头与侧脸**：正面或轻微 3/4 视角，完整角色居中，四周至少留 10% 安全边距；用于卡片时仍能清楚读出动作。身体侧转时让脸略朝镜头，眼睛、眉毛、嘴和腮红都贴合脸部同一连续曲面；远侧眼睛与腮红略小。避免正面五官平贴在侧面凸起上，也避免画出独立的头、脖子或断开的接缝。
- **光线**：柔和棚拍光，左上方主光、右侧轻微轮廓光；高光柔和，不出现硬阴影。
- **色彩与服装**：老婆保持粉色身体、莓红帽带、藏蓝色运动短裙、珊瑚粉鞋。短裙带莓红色细滚边和白色侧条，内衬短裤适合运动姿势。老公保持青蓝身体、青色帽带、藏蓝帽顶与短裤、青色鞋。
- **表情**：眉、眼、嘴保持简洁黑色贴片感；情绪主要靠眉形、嘴形、姿势表达，避免夸张眼泪和羞辱感。
- **背景**：最终交付为透明 PNG；不包含文字、边框、地面、投影、水印或额外人物。
- **尺寸**：母版 2048 × 2048 px；应用导出 1024 × 1024 px 和 512 × 512 px，使用 sRGB。

## 2. 状态矩阵

每个状态都同时制作 `hus` 和 `wife` 两版，共 14 张。两版采用相同构图与道具，以便在双人进度区域中并排展示。

| 状态 | 文件名后缀 | 动作与道具 | 表情与语气 | 推荐触发位置 |
|---|---|---|---|---|
| 运动中 | `workout` | 弓步向前，一手握小哑铃，另一手自然摆动；额头有两颗小汗珠 | 张嘴微笑、眼神专注 | 跟练页、开始训练 |
| 控制饮食中 | `meal` | 坐在一只小餐盘前，双手举着西兰花与小碗 | 平静微笑，不表现忍饿 | 饮食页、按计划吃 |
| 检查体重中 | `weigh` | 双脚站在圆角体重秤上，低头看读数，一手轻扶下巴 | 好奇、客观，不紧张 | 记录页、保存体重 |
| 开心 | `happy` | 双手举高，身体轻轻跃起，两侧各一颗小星星 | 弯眼大笑 | 连续打卡、普通成功反馈 |
| 沮丧 | `sad` | 坐下，肩膀微收，双手放在膝上 | 轻微扁嘴、眉毛内收；不哭泣 | 数据为空或计划被打断 |
| 完成今日计划 | `day-done` | 双手捧一枚无文字的金色圆形勋章，身体挺直 | 闭眼满足地微笑 | 当日四餐和训练均完成 |
| 未完成今日计划 | `day-missed` | 手拿一张带空白圆点的计划卡，另一手轻挠头 | 温和遗憾，嘴角略下；保持可重新开始的感觉 | 跨日后回顾未完成日期 |

## 3. 生成提示词模板

将对应的角色图作为 **角色与风格参考图**，每次只生成一个人物。女生使用 `UIset/fit-mascot-female-skirt-v1.png`，男生使用 `UIset/fit-mascot-male-v4.png`。`{角色描述}`、`{动作描述}` 与 `{表情描述}` 分别替换为下表内容。

```text
Use case: stylized-concept
Asset type: mobile habit-tracking app mascot state, square transparent cutout
Primary request: Create a new pose of the exact same mascot from the reference image.
Input image: character and style reference; preserve the mascot's identity exactly.
Subject: {角色描述}. {动作描述}. {表情描述}.
Style/medium: polished rounded 3D soft-gummy character render, soft tactile surfaces, the same modeling, proportions, facial construction, material detail and studio lighting as the reference.
Composition/framing: single full-body character, centered, slight three-quarter view, fully visible, generous even padding, readable at 160 px.
Lighting/mood: soft bright studio lighting, warm and encouraging.
Constraints: preserve the exact body silhouette, body color, face proportions, cheek placement, headwear, shoes and their colors from the reference; wife wears the navy athletic skort with berry-red hem trim and white side stripes, husband wears navy athletic shorts; in three-quarter poses, place all facial features on one curved facial surface with slight far-side foreshortening and a seamless face-to-torso volume; anatomically coherent pose; transparent background; no cast shadow.
Avoid: text, numbers, logo, watermark, floor, scenery, border, second character, photorealistic human anatomy, extra limbs or fingers, dramatic sadness, body-shaming cues.
```

### 角色描述

- **老婆**：`the pink wife mascot with berry-red hat band, navy athletic skort with berry-red hem trim, and coral-pink sneakers`
- **老公**：`the cyan-blue husband mascot with turquoise hat band, navy hat top and shorts, and turquoise sneakers`

### 动作与表情变量

1. `workout`
   - 动作：`The mascot is doing an energetic forward lunge, holding one small rounded dumbbell, with the free arm naturally counterbalancing; two tiny sweat droplets near the temple.`
   - 表情：`Focused bright eyes and an open confident smile; energetic, never exhausted.`
2. `meal`
   - 动作：`The mascot sits behind a small round plate, holding a broccoli floret in one hand and a small plain bowl in the other.`
   - 表情：`Calm eyes and a gentle satisfied smile; mindful eating, never hunger or deprivation.`
3. `weigh`
   - 动作：`The mascot stands with both feet on a simple rounded bathroom scale, looks down at it, and lightly touches the chin with one hand.`
   - 表情：`Curious neutral-positive expression; the measurement is information, not a judgment.`
4. `happy`
   - 动作：`The mascot makes a small joyful jump with both arms raised; two tiny decorative golden stars float beside the body.`
   - 表情：`Happy crescent eyes and a wide joyful smile.`
5. `sad`
   - 动作：`The mascot sits with shoulders slightly lowered and both hands resting on the knees.`
   - 表情：`Slightly inward eyebrows and a small downturned mouth; mildly disappointed but still lovable, no tears.`
6. `day-done`
   - 动作：`The mascot stands proudly and holds a small blank golden round medal with both hands close to the chest.`
   - 表情：`Closed relaxed eyes and a deeply satisfied smile, calm pride rather than loud celebration.`
7. `day-missed`
   - 动作：`The mascot holds a small blank checklist card with subtle empty circular marks in one hand and gently scratches the side of the head with the other.`
   - 表情：`A soft regretful half-smile and slightly raised inner eyebrows; communicates “tomorrow is another chance,” never guilt.`

## 4. 文件与接入约定

全部角色素材统一放在 `UIset/`：两位角色各七种状态，每个状态同时提供透明 PNG 与循环 WebP。`assets/mascots/` 保留同名副本供页面使用。

```text
UIset/
  hus-workout.png       wife-workout.png
  hus-meal.png          wife-meal.png
  hus-weigh.png         wife-weigh.png
  hus-happy.png         wife-happy.png
  hus-sad.png           wife-sad.png
  hus-day-done.png      wife-day-done.png
  hus-day-missed.png    wife-day-missed.png
  （以上每个文件另有同名 .webp 动效版）
  fit-mascot-male-v4.png
  fit-mascot-female-v4.png
  fit-mascot-female-skirt-v1.png
  mascot-overview.png
```

接入时使用 `<img>`，不要把角色图设成 CSS 背景，这样才能保留替代文本和明确的内容语义。建议根据场景使用以下替代文本：`老公正在运动`、`老婆正在按计划吃饭`、`老公正在记录体重`、`老婆开心地庆祝`、`老公有一点沮丧`、`老婆满足地完成今日计划`、`老公遗憾地回顾今日计划`。

## 4.1 App 里的接入

页面使用 `assets/mood/` 里缩小到 256px 的同名副本（每张约 60KB），`assets/mascots/` 保留原图。

| 表情 | 出现在哪里 |
|---|---|
| `meal` 按计划吃 | 点"按计划吃了"或"吃多了"后的反馈弹窗；饮食页热量环旁边 |
| `day-done` 完成今日计划 | 当天四餐（训练日还有训练）全部打卡时，屏幕中间的大号庆祝弹窗；今日页进度行里已完成那个人的头像；饮食页四餐都打卡后的热量环旁边 |
| `happy` 开心 | 训练打卡后的反馈（当天还没全部完成时）；跟练页"这一轮完成"的休息页；练完页 |
| `workout` 运动中 | 跟练页动作之间的休息页 |
| `weigh` 检查体重 | 记录页洞察卡；保存身体数据后的反馈弹窗 |
| `day-missed` 未完成 | 今日页顶部：昨天没打满、今天还没打卡时，提示"昨天还差 x 项没打卡，没关系，今天重新开始就好"（最近一周没用过就不提示；今天打了第一个卡就消失） |
| `sad` 沮丧 | 只用在"还没有数据"的空状态：趋势图没有数据、最近更新为空 |

"吃多了""没吃"不用 `sad`，避免让人有负罪感。

## 5. 验收清单

- 缩至 160 × 160 px 后，仍能在 1 秒内辨认动作与情绪。
- 同一人物的身体轮廓、眼睛大小与间距、腮红位置、服装配色没有漂移；老婆每个状态都穿同款运动短裙，老公保持短裤。
- 侧向动作的远侧眼睛和腮红有一致的透视缩小，五官与云朵轮廓衔接自然；脸与身体没有分层或断开感。
- 吃饭和称重状态的左侧外轮廓从头带下方连续过渡到身体，不能出现耳状大凸起或悬空的粗手臂。
- 两个人同一状态下的姿势、道具尺寸和镜头高度一致。
- 身体、帽子、鞋和道具没有被裁切；透明边缘无白边或杂色。
- `sad` 与 `day-missed` 不使用眼泪、警告色、叉号、碎裂心形或体重数字。
- `meal` 不出现秤食物、卡路里数字或过小份量，避免传达激进节食。
- 所有道具均为无品牌、无文字的简化造型。
