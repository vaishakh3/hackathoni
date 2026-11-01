# Hackathoni — A night worth making

A cinematic, local Astro + Three.js website built around an editable Blender houseboat. Five horizontal chapters move from sunset to midnight and morning. The opening is a working interpretation of the generated concept: the boat and water are real-time 3D; the distant landscape is a generated photographic panorama.

## Run

Requires Node.js 24.

```sh
npm install
npm run dev
```

Open http://localhost:4321/. Astro 7 runs the development server in the background; `npx astro dev stop` stops it from this folder. `npm run build` creates the static `dist/` site. `npm run preview` serves the build. Nothing is deployed, and the project does not use Sites.

## Explore

- Scroll, swipe, use the route buttons, or press the left/right arrow keys. Home and End jump to the first and last chapter.
- **Step aboard** lifts away the canopy and reveals the workshop. **Peek inside / Lower the roof** toggles it manually.
- **The makers** and **The desks** move closer to the people and workstations. **Whole boat** or Escape restores the wide view. Changing chapters resets the close-up.
- Touch open water for a small ripple. Sound is opt-in. **Still water** stops the scene's motion; the operating system's reduced-motion preference is also respected.
- **Field guide** contains event details and FAQs in a native dialog. Escape closes it. The scene pauses while the dialog is open or the page is in the background.
- **Your place** offers a tentative calendar download. Registration remains “opening soon”; no application is submitted or stored.
- `/?view=still` is an explicit non-WebGL view for verification or low-power use. The same fallback activates on initialization failure or a lost WebGL context.

## What changed in the cinematic pass

The boat is longer and fills the center of the composition. A real-time reflecting water plane, finer normal-map ripples, a sunset shoreline, a warm key light, interior lamps and restrained desktop bloom give it a coherent environment. Editorial serif typography replaces the mixed hero treatment. Phone cameras keep the boat inside the viewport.

The architectural model includes a curved woven canopy, dormers, real arched openings, coir bindings, rail lattice, hull strakes, swept ends, carved prow accents, lamps, lifebuoys, cushions and a helm. Timber now uses photographed PBR maps; the palm weave has a new generated color map and derived tangent normal. Short-range ambient occlusion is baked to vertex colors during export to add contact shading around joints and furnishings.

Six seated figures use adapted MakeHuman facial topology, fitted hair, textured eyes and skin, continuous shirt surfaces, individual fingers and detailed workstations. The people remain stylized; this is not a scan-based or film-quality character scene. Every laptop has a screen, keyboard, trackpad, hinges, webcam and ports. Cups, notebooks, pencils and charging cables complete the tables.

The panorama is a distant curved backdrop and participates in the water reflection. It provides photographic scenery without requiring thousands of tree meshes. The secondary distant boat has a small dedicated model instead of duplicating the detailed workshop.

## Files

- `src/pages/index.astro` — semantic page, chapter text, ticket and guide.
- `src/styles/voyage.css`, `src/styles/focus.css` — layout, typography, responsive rules and fallback styling.
- `src/scripts/voyage.js` — navigation, accessible state, audio, dialogs and fallback handling.
- `src/scripts/lake.js` — renderer, water, lighting, camera path, roof and close-up controls.
- `src/scripts/cinematic-environment.js` — aligned sunset/morning panoramas, reflected sunrise and smoothly blended environment lighting.
- `src/scripts/aboard-motion.js` — reversible roof/camera choreography, covered by `npm test`.
- `src/scripts/distant-boat.js` — lightweight secondary boat.
- `blender/houseboat.blend` — editable scene with named components and packed material images.
- `public/assets/houseboat.glb` — compressed web asset with a separate movable `roof` node.
- `blender/character-source/` — the CC0 mesh, fitting data, targets and maps used for the portraits, with source notices.
- `concepts/` — original concept and the prompts for the generated visual assets.
- `preview.png`, `preview-phone.png`, `preview-workshop.png` — actual browser captures.
- `workshop-detail.png` — Blender studio render of the workshop.

## Rebuild the model

```sh
node blender/make_screens.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_boat.py
node blender/compress_model.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_detailed.py
node blender/prepare_fallbacks.mjs
```

The build runs the architectural model, kettuvallam shape pass, character portraits, cloth/proportion finish, cinematic materials and export in that order. The export batches geometry by material while preserving the roof, bakes contact shading, then writes the GLB. Compression uses Meshopt and WebP. For an existing Blender edit, run `optimize_export.py` followed by `compress_model.mjs`; the editable scene is not replaced by the merged export.

## Assets and references

- The shoreline, palm-weave color image and design concept were generated for this project with image generation. Prompts are retained in `concepts/`. The palm normal map is derived technical material data. Format conversion and runtime compression use Sharp and Blender.
- [Poly Haven: Dark Wooden Planks](https://polyhaven.com/a/dark_wooden_planks), by Amal Kumar — diffuse, OpenGL normal and roughness maps; [CC0 license](https://polyhaven.com/license). The maps were resized for the web model.
- [MakeHuman / MPFB core assets](https://github.com/makehumancommunity/mpfb2) and [MakeHuman system assets](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html) — CC0 facial mesh, shape targets, hair, eye and skin assets, adapted for this scene. Original notices and provenance are retained in `blender/character-source/LICENSE.txt` and source files.
- The architecture, clothing modifications, poses, workshop, screen artwork and scene code were authored for Hackathoni. The supplied houseboat photographs informed the architecture; they are not embedded on the website.
- The water normal map comes from the [official Three.js water example](https://threejs.org/examples/webgl_shaders_ocean.html). `THREE-LICENSE.txt` and `MESHOPT-LICENSE.txt` retain the corresponding MIT notices.
- [Three.js Water documentation](https://threejs.org/docs/pages/Water.html) informed the reflection setup. [Kerala Tourism's kettuvallam reference](https://www.keralatourism.org/kumarakom/houseboats-kerala-kettuvallom.php) informed the timber, coir and roof construction.
- Google Fonts supplies Instrument Serif, Bricolage Grotesque, DM Mono and Anek Malayalam.

## Event content

The supplied Hackathoni HTML is the source for dates, format, free entry, organisers, prizes and contact. Boarding is 21 November 2026 at 16:00 IST; docking is 22 November at 09:00 IST. `public/hackathoni.ics` records these times in UTC with tentative status. Exact boarding point, applications, facilities, challenge rules and judging remain to be confirmed. The model is an artist's concept of the event.

## Validation and limits

The production build passes. The final model has 54 material-batched meshes, 39 materials and 14 embedded textures, compressed to about 12.9 MB. It retains its movable roof and has finite geometry bounds. That is a substantial initial download; a quiet loading surface displays until the first real scene frame has rendered. The older composited boat illustration is no longer referenced by the page. Water reflection resolution and pixel density are capped, the scene targets roughly 30 fps, and the small secondary boat avoids a second copy of the high-detail geometry.

Browser verification covers desktop and phone layout, roof controls, both close-ups, Escape and chapter reset, still-water mode, the guide and the static fallback. Phone checks use browser emulation; performance has not been measured on physical phones. The reference concept remains a visual target rather than a promise of pixel-identical rendering on every device.

## Aboard and First Light refinements

Aboard now plays a roughly four-second reveal after the chapter settles. The canopy physically rises out of the camera frustum; it is never switched off during the lift. The camera holds wide while it clears, then moves closer to the workshop. Closing runs the same choreography in reverse, and changing direction or leaving the chapter preserves the current position. Maker/desk close-ups wait for roof clearance. Reduced-motion and still-water modes show the final composition immediately.

First Light uses a dedicated generated morning version of the same shoreline (`shore-morning.webp`; original PNG and prompt retained). The sky, foliage, water reflection, sunlight, fog, cabin lamps and material environment lighting change together over several seconds. A small scene sun rises and reflects in the water. Daylight continues through the final boarding chapter. Text colour follows the rendered daylight; the former cream screen overlay has been removed.

Verification for this pass: six motion tests cover opening order, smooth reversal, skipping Aboard, re-entry, frame-rate consistency and reduced motion. Browser checks cover mobile and desktop, manual roof return, maker close-up, morning framing, the final chapter and runtime shader diagnostics. New captures are `preview-morning.png`, `preview-morning-phone.png`, `preview-roof-lifting.png` and `preview-aboard.png`. The morning source adds one 3:1 compressed WebP; both environment lighting probes are generated only at startup.

## Startup flash fix

The initial HTML no longer includes the older `boat-night.webp` illustration. Loading presents a neutral background and a small status label; `createLake().ready` resolves after a successful render, and only then does the canvas fade in. Asset or rendering failure retains the readable shoreline-only fallback. This avoids swapping between two different boat compositions on first visit or refresh.

Verified using the production build with a seven-second delay on the model download (`node tools/verify-loading.mjs`, local verification port 4322): no boat image exists in the loading DOM, the canvas remains hidden before readiness, and the actual scene appears after rendering. The regular local preview remains on port 4321.
