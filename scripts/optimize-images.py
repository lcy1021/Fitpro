"""Create delivery images from the unchanged PNG/GIF masters. Requires Pillow with WebP."""
import json
from pathlib import Path
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
report = {"moves": [], "characters": []}
for source in sorted((ROOT / "assets/moves").glob("*.gif")):
    with Image.open(source) as original:
        frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(original)]
        durations = []
        for frame in ImageSequence.Iterator(original):
            durations.append(frame.info.get("duration", 100))
        entry = {"id": source.stem, "gifBytes": source.stat().st_size, "frames": len(frames), "durationMs": sum(durations)}
        for suffix, width in [("", 800), ("-small", 320)]:
            resized = [frame if frame.width == width else frame.resize((width, width * 3 // 4), Image.Resampling.LANCZOS) for frame in frames]
            dest = source.with_name(source.stem + suffix + ".webp")
            resized[0].save(dest, format="WEBP", save_all=True, append_images=resized[1:], duration=durations, loop=original.info.get("loop", 0), quality=84, method=6, minimize_size=True)
            with Image.open(dest) as saved:
                assert saved.n_frames == len(frames), source
                assert saved.size == (width, width * 3 // 4), source
                assert saved.info.get("loop") == original.info.get("loop", 0), source
                actual = []
                for frame in ImageSequence.Iterator(saved):
                    frame.load()
                    actual.append(frame.info["duration"])
                assert actual == durations, (source, actual, durations)
            entry["smallBytes" if suffix else "fullBytes"] = dest.stat().st_size
        report["moves"].append(entry)

for source in sorted([*(ROOT / "assets/mood").glob("*.png"), *(ROOT / "assets").glob("avatar-*.png")]):
    with Image.open(source) as original:
        dest = source.with_suffix(".webp")
        rgba = original.convert("RGBA")
        rgba.save(dest, format="WEBP", lossless=True, exact=True, method=6)
        with Image.open(dest) as saved:
            assert saved.size == rgba.size
            assert saved.convert("RGBA").tobytes() == rgba.tobytes(), source
    report["characters"].append({"id": str(source.relative_to(ROOT)), "pngBytes": source.stat().st_size, "webpBytes": dest.stat().st_size})

report["totals"] = {key: sum(row[key] for row in report[group]) for group, keys in [("moves", ["gifBytes", "fullBytes", "smallBytes"]), ("characters", ["pngBytes", "webpBytes"])] for key in keys}
path = ROOT / "docs/qa/image-loading/results.json"
path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
print(json.dumps(report["totals"]))
