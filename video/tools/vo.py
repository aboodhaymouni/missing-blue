import json, sys, os, wave, urllib.request, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
from orkey import key
K = key()
VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(VIDEO, 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
BASE = "Deep, resonant, cinematic documentary narrator with a low pitch and real gravitas. "
TENSE = BASE + "Serious and tense, quietly alarming. A steady, natural pace: do not drag, keep pauses short."
REVEAL = BASE + "A dramatic title reveal: proud and powerful, like the title moment of a film trailer."
DRIVE = BASE + "Confident, inspiring and energetic. A brisk, driving pace with short crisp pauses."
PROOF = BASE + "Confident and assured, presenting proof. A brisk pace with short pauses."
FINAL = BASE + "Warm, powerful and final, like the closing line of a trailer."
LINES = [
 ("01", "Jordan is one of the most water-scarce countries on Earth.", TENSE),
 ("02", "Its water is pumped hundreds of kilometres across the desert.", TENSE),
 ("03", "Yet more than forty percent of it never reaches a bill.", TENSE),
 ("04", "Along the carrier lines, illegal taps hide in plain sight. In twenty twenty-five, the Disi line alone logged over eighteen hundred attacks.", TENSE),
 ("05", "And when crews find one, the report is free Arabic text, and the map rarely catches up.", TENSE),
 ("06", "This is Missing Blue.", REVEAL),
 ("07", "Detect. Free satellite imagery flags new green patches beside the lines, ranked by a published formula.", DRIVE),
 ("08", "Verify. Crews report by voice, text, or photo. Claude turns it into fields, each one quoting the crew. Nothing invented.", DRIVE),
 ("09", "Remember. An engineer approves, and the fix lands in the utility's own GIS, with a full audit trail.", DRIVE),
 ("10", "Imagery cost: zero. Ninety-four percent field accuracy. And two extra cases per hundred kilometres a year pay for it.", PROOF),
 ("11", "Missing Blue. Where records end, evidence begins.", FINAL),
]
only = set(sys.argv[1:])
def gen(item):
    tag, text, instr = item
    body = json.dumps({'model': 'google/gemini-3.8-flash-tts', 'input': text, 'voice': 'Charon', 'instructions': instr, 'response_format': 'pcm'}).encode()
    req = urllib.request.Request('https://openrouter.ai/api/v1/audio/speech', data=body, headers={'Authorization': 'Bearer ' + K, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read(); ct = r.headers.get('Content-Type')
    rate = 24000
    for p in (ct or '').split(';'):
        p = p.strip()
        if p.startswith('rate='): rate = int(p[5:])
    path = f'{OUT}/vo_{tag}.wav'
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(data)
    return tag, len(data) / 2 / rate
with cf.ThreadPoolExecutor(6) as ex:
    for tag, dur in ex.map(gen, [l for l in LINES if not only or l[0] in only]):
        print(tag, round(dur, 2))
