# Museum Friends

Interactive, family-friendly 3D versions of museum artifacts. Each one is a single HTML page using three.js r128, with no build step.

```bash
cd museum-friends && python3 -m http.server 8000   # open /jarra/, /siraj/, /siraj-v2/ or /painted-jar/
```

## painted-jar

- **Model:** a hand-built model of a painted clay jar recorded by the Sharjah Archaeology Authority with Global Digital Heritage. It is not a scan.
- **Shape:** the profile was measured from the reference photo, then turned into a lathe surface with ridges added on the neck.
- **Texture:** painted procedurally on a canvas: clay gradient, grooves, 10 striped triangles, and cracks.
- **Cracks:** each crack is the edge of a seeded, warped Voronoi cell. The puzzle pieces are cut along those same cells, so the pieces match the painted cracks.
- **Activities:**
  - Tap for facts.
  - "Fix the jar": the jar breaks into 14 pieces, and you tap each one to send it home.
  - "Count the triangles": tap each triangle to number it.
  - "Wake it up": an optional friendly face with eyes that follow the pointer.
- **Languages and sound:** English and Arabic, with small synthesized sound effects. Reduced-motion settings are respected.

## jarra

The painted jar as a character, named Jarra (جرّة means "jar" in Arabic). It is a copy of `painted-jar`, which stays unchanged as the version without a face.

- **Face:** always on, with eyes that follow the pointer, eyebrows, blush, and blinking.
- **Expressions:**
  - idle smile
  - surprised when tapped
  - talking: the mouth moves while the speech bubble is showing
  - happy when a triangle is found or the jar is fixed
  - "hmm" on a wrong tap
  - dizzy "Wheee!" after a fast spin
- **Turning:** after a spin, Jarra turns back to face you. In the counting game it doesn't turn back, so children can find the triangles on the back.
- **Nap time:** closed eyes and floating "z"s. Tapping Jarra wakes it up.
- **Greeting:** says hello when the page opens.

## siraj

A bronze oil lamp as a talking character. Siraj (سراج) is an Arabic word for "lamp". The model is hand-built from a reference photo: lathe base, body and lid, a lofted open spout, and a tube handle.

- **Voice:** 18 lines, each recorded in English (`en-US-AndrewNeural`) and Emirati Arabic (`ar-AE-HamdanNeural`) with edge-tts. The files are `voice/<line>-<lang>.mp3`, and the text is in `voice/lines.json`. Regenerate them with `python voice/gen_voice.py voice/lines.json voice`.
- **Lip-sync:** the clip's 250–1000 Hz energy, measured live with a Web Audio analyser, opens the mouth. The lid nods while Siraj talks and pops up when he's surprised.
- **Light my flame:** rub the lamp until it glows warm and the wick lights. The scene turns to night, lit by the flame. Tapping the flame makes Siraj say "Ouch!", and "Blow it out" puts the flame out with a puff of smoke. Siraj explains that rubbing a lamp is magic only in stories.
- **Polish me:** rubbing paints shiny bronze through the green patina, using per-part colour and roughness/metalness canvases. Siraj then explains that museums never polish real objects, and "Bring back my patina" restores the green.
- **Also:** nap time, spin to "Wheee", and tap for facts, the same as Jarra.

## siraj-v2

A copy of `siraj` with a **Voice & sound** settings window. The original `siraj` is unchanged.

- **Voice options:** turn Siraj's voice on or off, turn sound effects on or off, and pick a voice for each language. Each voice has a "Hear" preview button.
- **English voices:** Ana (`en-US-AnaNeural`, the default), Andrew, Jenny, Ryan.
- **Arabic voices:** Fatima (`ar-AE-FatimaNeural`, the default), Hamdan.
- **Saved choices:** settings are remembered in the browser.
- **Kid-talk wording:** lines use sound words and rhymes ("swishy-swish", "wipy-wipe"), and the patina is Siraj's "green coat". The About note gives grown-ups the real word.
- **Voice files:** every line is pre-recorded for every voice as `voice/<voice id>/<line>.mp3` (108 files). The page can't call the TTS service live, so the clips are generated ahead of time. Regenerate them with `python voice/gen_voices.py voice/lines.json voice`.
