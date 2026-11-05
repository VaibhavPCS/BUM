# models/ — optional rigged character

The game ships with a procedural Nawab runner (no downloads needed). If you want a
professionally rigged, animated character instead, drop a single **`models/runner.glb`**
here and it is used automatically. The photo head keeps working: it follows the model's
head bone.

## 5-minute Mixamo workflow

1. Go to [mixamo.com](https://www.mixamo.com) (free Adobe login).
2. Pick a character (Y-Bot, or any "casual business" character).
3. Download these animations **with skin**, FBX, 30 or 60 FPS:
   - `Running` (or `Fast Run`)
   - `Running Jump` (or `Jump`)
   - `Running Slide` (or `Roll`)
   - `Stumble Backwards` / `Falling` / `Death`
4. Combine them into one GLB. Easiest options:
   - **Blender:** import the FBX files, keep one armature, stash each action in the NLA, export as glTF Binary (`.glb`) with animations.
   - **gltf.pmnd.rs** (or any FBX → glTF converter) if you only need one clip per file: you can also export one GLB per clip and merge later.
5. Make sure the clip names contain `run`, `jump`, `slide`/`roll` and `death`/`fall` (the loader matches by regex, case-insensitive).
6. Save as `models/runner.glb`, reload the page.

Notes
- Height is normalised to the game's runner (1.9 units), feet are placed on the ground, and the model is turned to face the running direction.
- Keep the file under ~10 MB for quick loading on mobile.
- Free CC0 alternatives with run/jump/roll clips: Quaternius "Universal Animation Library", KayKit character packs, Kenney "Animated Characters".
