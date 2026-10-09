# Museum Friends

Interactive, family-friendly 3D versions of museum artifacts. Each one is a single HTML page using three.js r128, with no build step.

```bash
cd museum-friends && python3 -m http.server 8000   # open http://localhost:8000/painted-jar/
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
