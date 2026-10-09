# Wife detail asset generation prompts

Date: 2026-10-09. Generated with the built-in `image_gen.imagegen` tool, one call per asset. `transparent_background: true`. No new generation is required to use the saved assets.

## Shared reference inputs

Both calls used these exact `referenced_image_paths`, in this order:

1. `/Users/luchenyang/Documents/Fitpro/docs/qa/soft-meal-design/selected-design.png` — approved composition and art direction reference.
2. `/Users/luchenyang/Documents/Fitpro/assets/avatar-wife.webp` — existing wife's identity reference.

Both references were inspected before generation. Output PNGs and compressed WebPs were also inspected. Compression preserved RGBA transparency and aspect ratio using Pillow `thumbnail` with LANCZOS, WebP quality 85, method 6. No UI source code was changed by the asset production task.

## 1. Today wife

### Exact prompt

```text
Use case: identity-preserve. Produce one standalone transparent header illustration asset, no UI, no screen. Reference 1 is only art-direction and composition guidance: its top-left header has a cheerful cyan cloud mascot jogging beside a small slanted hand-lettered Chinese message. Recreate that complete header illustration in the pink wife's character identity from reference 2. Preserve her pink cloud lobed silhouette, pink sun visor, high fluffy side ponytail, small expressive black eyes, rosy cheeks, and cute glossy soft 3D clay style. Change her seated pose to an energetic happy jogging pose, entire character on the right, visible limbs, playful smile. On the LEFT occupying about 40% of the design width, render exactly two lines of small pink handwritten Chinese text, tilted about minus 15 degrees: first line '好好吃饭', second line '就是爱自己'. Text is integral to the image, crisp and legible, no extra words. Include a tiny pink heart near bottom left, matching reference. Landscape art composition approximately 240:180 with close clean edges and minimal outer padding, transparent background throughout, no clouds or colored background behind asset. Soft studio light, saturated fresh pink, same scale/detail density as the reference's cyan header mascot. Do not include white canvas, checkerboard, UI cards, navigation, frame, or watermark.
```

### Output paths

- Built-in source: `/Users/luchenyang/.codex/generated_images/01a120d2-9c72-79e0-aa3f-be3fb2d6c26d/exec-85e26d0b-f93e-48f3-aab7-311c1c69669e.png`
- Project PNG: `/Users/luchenyang/Documents/Fitpro/docs/qa/visual-details/assets/today-wife-detail-v1.png` — 1448×1086 RGBA.
- Runtime WebP: `/Users/luchenyang/Documents/Fitpro/assets/meal-art/today-wife-detail-v1.webp` — 720×540 RGBA, 68,760 bytes.

## 2. Diet wife

### Exact prompt

```text
Use case: identity-preserve. One standalone transparent 3D mascot illustration for a mobile dietary page header, no UI. Reference 1 top of second panel shows a cyan cloud character cheerfully eating from a visible white round bowl with a spoon. Recreate that exact visual idea and compact approximately square 160:160 composition using the pink wife's character from reference 2. Preserve the pink cloud lobed silhouette, pink sun visor, fluffy high side ponytail, black expressive eyes, tiny eyebrows, rosy cheek blush, cute glossy soft clay 3D art rendering. Seat her behind a white ceramic bowl of warm pale soup/oatmeal, both cloud hands clearly visible: one holding a small metal spoon at mouth level, the other gently holding the bowl. Front view with slight 3/4 perspective, delighted open smile, fluffy cloud feet partly visible. Include two very small golden sparkles beside the mascot as in reference, nothing else. Match source character identity and header-friendly proportions; bowl is entirely visible foreground bottom center, character hat and ponytail do not clip. Transparent alpha background, close clean edges and little outside padding, no text, no white rectangle, no checkerboard, no frame, no screen elements, no watermark.
```

### Output paths

- Built-in source: `/Users/luchenyang/.codex/generated_images/01a120d2-9c72-79e0-aa3f-be3fb2d6c26d/exec-c2cec1fe-ac99-4e07-890a-f771daa5414a.png`
- Project PNG: `/Users/luchenyang/Documents/Fitpro/docs/qa/visual-details/assets/diet-wife-detail-v1.png` — 1254×1254 RGBA.
- Runtime WebP: `/Users/luchenyang/Documents/Fitpro/assets/meal-art/diet-wife-detail-v1.webp` — 480×480 RGBA, 32,762 bytes.

## Reproduction notes

The prompt texts above are the actual submitted strings. A repeat generation is not guaranteed to yield identical pixels. Use the saved project files for deterministic reuse and maintain the same reference input order when producing a future version. Both files contain alpha values spanning 0–255; their backgrounds are genuinely transparent rather than baked checkerboards.
