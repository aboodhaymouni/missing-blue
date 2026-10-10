"""OpenRouter key for regenerating the narration and music.

Read from the OPENROUTER_API_KEY environment variable, or from video/.env (git-ignored):
    OPENROUTER_API_KEY=<your key>
The key is never written into this repository.
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)


def key():
    k = os.environ.get('OPENROUTER_API_KEY')
    if k:
        return k.strip()
    env = os.path.join(VIDEO, '.env')
    if os.path.exists(env):
        m = re.search(r'^OPENROUTER_API_KEY\s*=\s*"?([^"\s]+)', open(env, encoding='utf-8').read(), re.M)
        if m:
            return m.group(1)
    raise SystemExit('Set OPENROUTER_API_KEY (or put it in video/.env) to regenerate audio.')
