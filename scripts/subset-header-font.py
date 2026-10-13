"""Generate the fixed-copy header font; requires fonttools and brotli only for maintenance."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
import hashlib, json

root = Path(__file__).resolve().parent.parent
copy = "把今天过好就很棒好好吃饭慢慢记下来休息，也是计划的一部分照着计划，一点点动起来每一次记录都在靠近自己"
source = root / "assets/fonts/LongCang-Regular.ttf"
target = root / "assets/fonts/DuoFit-Header-v1.woff2"
font = TTFont(source)
options = subset.Options()
options.flavor = "woff2"
options.name_IDs = ["*"]
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=copy)
subsetter.subset(font)
for record in font["name"].names:
    if record.nameID in {1,3,4,6,16}:
        name = "DuoFitHeader-Regular" if record.nameID == 6 else "DuoFit Header"
        record.string = name.encode(record.getEncoding())
font.flavor = "woff2"
font.save(target)

# Check actual outlines and advance metrics, not just glyph presence.
original, derived = TTFont(source), TTFont(target)
for char in set(copy):
    glyph = original.getBestCmap()[ord(char)]
    generated = derived.getBestCmap()[ord(char)]
    assert original["hmtx"][glyph] == derived["hmtx"][generated]
    pens = [DecomposingRecordingPen(original.getGlyphSet()), DecomposingRecordingPen(derived.getGlyphSet())]
    original.getGlyphSet()[glyph].draw(pens[0])
    derived.getGlyphSet()[generated].draw(pens[1])
    assert pens[0].value == pens[1].value, char
report = {"sourceBytes":source.stat().st_size,"outputBytes":target.stat().st_size,
          "sourceSHA256":hashlib.sha256(source.read_bytes()).hexdigest(),
          "characters":"".join(sorted(set(copy))),"outlineAndMetricsMatch":True,
          "license":"LongCang-OFL.txt","originalPreserved":True}
(root / "docs/qa/startup-resilience-v60/font-subset.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False))
