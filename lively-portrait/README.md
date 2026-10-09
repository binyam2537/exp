# Living portrait: Sheikh Sultan bin Saqr Al Qasimi

- `index.html`: v2, the portrait speaks.
- `v1-silent.html`: v1, motion only. It is also kept in git as commit `7f2976b`.

An interactive 2.5D version of the 1924–1951 portrait. It runs in the browser with three.js r128 and needs no build step.

```bash
cd lively-portrait && python3 -m http.server 8000   # open http://localhost:8000
```

Opening it straight from `file://` won't work because the textures have to be fetched over HTTP.

## What moves

| Effect | How |
| --- | --- |
| Look-around parallax | A 420×272 mesh displaced by the depth map. The camera follows the pointer or a touch drag, and drifts slowly when idle. |
| Breathing | The chest and shoulders swell slightly about every 4.9 s, and the head rises with each breath. |
| Head | A slow small roll around the neck, plus a slight lean toward the pointer. Tapping the face makes him nod. |
| Blinking | The upper lid slides down using skin colour taken from just above each eye, every 2–6 s, with an occasional double blink. |
| Headdress tails | A slow ripple runs down the ghutra tails. The face is masked out. |
| Light | The image is relit from `normal.png`, and the light follows the pointer. |
| Atmosphere | Silver-gelatin or sepia toning, animated grain, vignette, slight lamp flicker, and dust drifting in a light shaft. |

## Speech (v2)

- **Greetings:** two short clips (`voice-ar.wav`, `voice-en.wav`) made with Meta MMS-TTS. The Arabic clip was lowered 3 semitones. Whisper-small transcribes both back to the right text.
- **Typed text:** uses the browser's own speech voice. Browsers don't expose that audio to the page, so the lip shapes are estimated from the letters as they are spoken.
- **Audio file:** any recording you upload is analysed live with a Web Audio analyser. Energy in the 250–1000 Hz band opens the jaw, against a decaying-peak automatic gain. The balance of mid and high frequencies spreads or rounds the lips.
- **Shader:** the jaw drops below the lip seam, the upper lip lifts slightly, and a soft lens-shaped mouth opening fades in. The head nods with emphasis while he talks.
- **Disclosure:** the page labels the voice as synthetic, and says it is not his voice and the words are not his.

All the warps are inverse UV maps written in GLSL (`lifeWarp` in `index.html`), so the photo is never cut into pieces. Press Alt+M to show the motion masks.

## Asset pipeline (`pipeline/`)

Every step ran on CPU, with torch, transformers, mediapipe and opencv in a venv. The scripts expect the source image at `../images/1.png` and write to `work/` and `site/`.

1. `depth.py <img> work/depth_large depth-anything/Depth-Anything-V2-Large-hf`: relative depth.
2. `sr.py <img> work/sr4.png`: Swin2SR ×4 real-world restoration, which also removes the halftone texture.
3. `lm.py work/sr4.png`: MediaPipe Face Landmarker eye, brow and mouth points. These are the `EYE_*` constants.
4. `prep.py`: crops off the museum caption, applies a gentle CLAHE and exports `photo.jpg` and `depth.png`.
5. `normals.py`: makes a smooth normal map from the float depth. Using it avoids the banding that 8-bit depth causes.
6. `tts.py <model> <text> <out.wav>`: MMS-TTS clips. `asr.py`: Whisper check of the clips.
