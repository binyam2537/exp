import asyncio, json, sys, ssl, os, edge_tts
import edge_tts.communicate as _c
if os.path.exists("/root/.ccr/ca-bundle.crt"): _c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
# voice id -> (language column, rate, pitch)
VOICES = {
  "en-US-AnaNeural":    ("en", "+0%", "+0Hz"),
  "en-US-AndrewNeural": ("en", "+0%", "+8Hz"),
  "en-US-JennyNeural":  ("en", "+0%", "+0Hz"),
  "en-GB-RyanNeural":   ("en", "+0%", "+0Hz"),
  "ar-AE-FatimaNeural": ("ar", "-4%", "+0Hz"),
  "ar-AE-HamdanNeural": ("ar", "-4%", "+6Hz"),
}
lines = json.load(open(sys.argv[1])); out = sys.argv[2]
async def main():
    for vid, (lang, rate, pitch) in VOICES.items():
        os.makedirs(f"{out}/{vid}", exist_ok=True)
        for key, (en, ar) in lines.items():
            dst = f"{out}/{vid}/{key}.mp3"
            if os.path.exists(dst): continue
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(en if lang == "en" else ar, vid, rate=rate, pitch=pitch).save(dst); break
                except Exception as e:
                    print("retry", vid, key, e); await asyncio.sleep(2 ** attempt)
asyncio.run(main())
