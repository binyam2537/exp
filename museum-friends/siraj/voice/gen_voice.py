import asyncio, json, sys, ssl, os, edge_tts
import edge_tts.communicate as _c
if os.path.exists("/root/.ccr/ca-bundle.crt"): _c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
lines = json.load(open(sys.argv[1])); out = sys.argv[2]
VOICES = {"en": ("en-US-AndrewNeural", "+0%", "+8Hz"), "ar": ("ar-AE-HamdanNeural", "-4%", "+6Hz")}
async def one(key, lang, text):
    v, rate, pitch = VOICES[lang]
    await edge_tts.Communicate(text, v, rate=rate, pitch=pitch).save(f"{out}/{key}-{lang}.mp3")
async def main():
    for key, (en, ar) in lines.items():
        await one(key, "en", en); await one(key, "ar", ar)
asyncio.run(main())
