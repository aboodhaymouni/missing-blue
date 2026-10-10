"""Trims each narration clip and lays out the video timeline (frames at 30 fps) into src/timeline.json."""
import os
import wave, json, subprocess, numpy as np
FPS = 30
VOICE_CHAIN = 'highpass=f=70,equalizer=f=150:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=2.2,equalizer=f=7500:t=q:w=1:g=-1,acompressor=threshold=-21dB:ratio=2.6:attack=8:release=140:makeup=2.2'
VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(VIDEO, 'public', 'audio')
def trim(tag):
    with wave.open(f'{A}/vo_{tag}.wav') as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    fr = int(0.01 * sr)
    env = np.array([np.sqrt(np.mean(x[i:i+fr].astype(np.float32) ** 2)) for i in range(0, len(x) - fr, fr)])
    idx = np.where(env > 250)[0]
    a = max(0, idx[0] * fr - int(0.06 * sr)); b = min(len(x), (idx[-1] + 1) * fr + int(0.18 * sr))
    y = x[a:b].copy()
    # short fades to avoid clicks
    n = int(0.01 * sr); ramp = np.linspace(0, 1, n)
    y[:n] = (y[:n] * ramp).astype(np.int16); y[-n:] = (y[-n:] * ramp[::-1]).astype(np.int16)
    with wave.open(f'{A}/vo_{tag}_t.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{A}/vo_{tag}_t.wav', '-af', VOICE_CHAIN, '-ar', '24000', f'{A}/vo_{tag}_p.wav'], check=True)
    return len(y) / sr
# (tag, gap before in seconds)
PLAN = [('01', 1.4), ('02', 0.35), ('03', 0.55), ('04', 0.5), ('05', 0.5), ('06', 1.5), ('07', 1.0), ('08', 0.55), ('09', 0.55), ('10', 0.75), ('11', 0.9)]
SCENE_OF = {'01': 'desert', '02': 'desert', '03': 'loss', '04': 'attacks', '05': 'records', '06': 'reveal', '07': 'detect', '08': 'verify', '09': 'remember', '10': 'proof', '11': 'close'}
INTRO = 3.0  # seconds of the AI Quest ident before the story starts
t = INTRO; vo = []
for tag, gap in PLAN:
    t += gap; d = trim(tag)
    vo.append({'id': tag, 'file': f'audio/vo_{tag}_p.wav', 'start': round(t * FPS), 'dur': round(d * FPS)})
    t += d
total = round((t + 4.8) * FPS)
scenes = []
for v in vo:
    sid = SCENE_OF[v['id']]
    if scenes and scenes[-1]['id'] == sid: continue
    lead = 0 if not scenes else (round(0.9 * FPS) if sid == 'reveal' else round(0.35 * FPS))
    scenes.append({'id': sid, 'start': max(0, v['start'] - lead)})
scenes[0]['start'] = round(INTRO * FPS)
scenes.insert(0, {'id': 'ident', 'start': 0})
for i, s in enumerate(scenes):
    s['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else total
json.dump({'fps': FPS, 'total': total, 'vo': vo, 'scenes': scenes}, open(os.path.join(VIDEO, 'src', 'timeline.json'), 'w'), indent=1)
print('total %.1fs' % (total / FPS))
for s in scenes: print(s['id'], round(s['start'] / FPS, 2), round((s['end'] - s['start']) / FPS, 2))
for v in vo: print(v['id'], round(v['start'] / FPS, 2), round(v['dur'] / FPS, 2))
