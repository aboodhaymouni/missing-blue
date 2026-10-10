import json, sys, os, base64, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from orkey import key
K = key()
VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(VIDEO, 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
model = sys.argv[1] if len(sys.argv) > 1 else 'google/lyria-3-pro-preview'
tag = sys.argv[2] if len(sys.argv) > 2 else 'music'
PROMPT = """Instrumental cinematic film-trailer score for a technology documentary about finding lost water in the desert. No vocals, no lyrics. About 90 seconds, 100 BPM, D minor resolving to F major.
Structure:
0:00-0:25 dark and tense: deep sub-bass drone, slow heartbeat pulse, distant metallic ticks, sparse low piano notes, airy desert wind texture. Mysterious, serious.
0:25-0:30 a rising swell and reverse-cymbal riser into a short silence, then one huge cinematic impact hit.
0:30-1:15 the reveal: modern hybrid orchestral-electronic build. Pulsing arpeggiated synths, staccato string ostinato, confident driving drums that grow in intensity, shimmering high pads. Hopeful, determined, innovative.
1:15-1:30 triumphant resolve with a final big chord and a clean fade-out tail.
Premium, polished, epic cinematic trailer sound meets modern tech keynote. The mix leaves room for a narrator voice."""
body = {'model': model, 'messages': [{'role': 'user', 'content': PROMPT}], 'modalities': ['text', 'audio'], 'stream': True}
req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions', data=json.dumps(body).encode(), headers={'Authorization': 'Bearer ' + K, 'Content-Type': 'application/json'})
chunks = []; text = []; first = None; n = 0
try:
    with urllib.request.urlopen(req, timeout=900) as r:
        rawall = r.read().decode('utf-8', 'ignore')
        for line in rawall.splitlines():
            line = line.strip()
            if not line.startswith('data:'): continue
            payload = line[5:].strip()
            if payload == '[DONE]': break
            try: ev = json.loads(payload)
            except Exception: continue
            n += 1
            if first is None:
                first = {k: v for k, v in ev.items() if k != 'choices'}
            for ch in ev.get('choices', []):
                dl = ch.get('delta', {}) or {}
                a = dl.get('audio')
                if isinstance(a, dict):
                    if a.get('data'): chunks.append(a['data'])
                    if a.get('transcript'): text.append(a['transcript'])
                if dl.get('content'): text.append(str(dl['content']))
                if n < 4: print('delta keys', list(dl.keys()), {k: (str(v)[:80]) for k, v in dl.items()})
except urllib.error.HTTPError as e:
    print('HTTP', e.code, e.read()[:800]); raise SystemExit(1)
print('events', n, 'audio chunks', len(chunks), 'text', ''.join(text)[:300])
if chunks:
    b = b''.join(base64.b64decode(c) for c in chunks)
    ext = 'wav' if b[:4] == b'RIFF' else ('mp3' if (b[:3] == b'ID3' or b[0] == 0xFF) else 'bin')
    p = f'{OUT}/{tag}.{ext}'
    open(p, 'wb').write(b); print('saved', p, len(b), b[:4])
