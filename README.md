# Hackathoni — A night worth making

An Astro + Three.js journey through an overnight solo hackathon on two houseboats in Alappuzha. Five chapters, vertical on phones and horizontal on desktop, move from sunset to midnight and first light. The boat, water and reflections are rendered in real time; the distant shore is a photographic panorama generated for the project.

## Run

Use Node.js 24 or newer.

```sh
npm ci
npm run dev
```

Open [the local site](http://localhost:4321/). `npm run build` creates the static `dist/` site; `npm run preview` serves it. The repository does not use Sites. These changes do not publish a deployment.

## The visual direction

The approved Hand & Ink concept is implemented with expressive Cormorant Garamond bold italic headings and date numerals, an upright Fraunces wordmark, and calm Hanken Grotesk labels. The three-line conclusion follows the approved diagonal lettering arrangement; its date composition stays open in the sky, with an underlined calendar text link. The stage caption, calendar and boarding notes have transparent backgrounds; there are no filled scene panels. Fonts, including a tiny Noto Serif Malayalam subset for the translation note and first-light caption, are self-hosted WOFF2 with their OFL licenses in `public/assets/fonts/`. The branding pairs a generated kettuvallam emblem with a live HTML wordmark and a small dictionary-like note: **thōni / തോണി / a boat; a way elsewhere.** The full Malayalam event name is no longer repeated in the header.

The design follows a backwater atlas: a flowing route stroke, folio numerals and numbered observations. The stroke appears in the chapter arrows, stage actions and calendar link. The boat has no detail labels, numbered callouts or popup cards; the miniature stays unobstructed. Its camera views use three custom pictograms and an underlined selection, rather than filled tabs. The canopy and views share one control dock above a reserved footer area. The artist’s caption sits with the chapter copy, so it cannot collide with the voyage rail.

The morning subline is placed in the clear sky, above the title on phones and beside the folio on desktop. Its caption and stage action use no filled background. The final chapter keeps the natural daylight, with no full-screen wash or itinerary background. Its supporting text and admission note use full opacity, with date numerals using lining figures. The chosen display font adds 22,396 bytes as a locally hosted Latin WOFF2; the concept images are design references and are not requested by the website. Its framing leaves open sky for dark ink typography, while the boat and water stay visible below. Header colours follow the rendered light. On phones and short landscape windows the scene gets the first screen and a boarding-notes action scrolls to a open reading layout beneath it. The notes retain the visible lake, with dark text for sky-positioned dates and light text with a fine shadow for copy over the water. The field guide is a dark, two-column voyage journal on desktop and a single readable column on phones. A compact horizontal progress bar is anchored at the lower left.

Research informed the direction rather than supplying a template:

- [The Type Founders: Typography Trends in 2026](https://thetypefounders.com/world-of-type/typography-trends-in-2026/) — expressive type supported by restrained secondary typography.
- [Pentagram: Harbor Way](https://www.pentagram.com/work/harbor-way) — place-specific directional graphics, rather than interchangeable interface arrows.
- [Pentagram: National Museum of Qatar](https://www.pentagram.com/work/national-museum-of-qatar?page=0&rel=search) — wayfinding and pictograms that complement the subject.
- [Undercase Type: Fraunces](https://github.com/undercasetype/Fraunces) — optical sizing, soft shapes and distinctive letterforms. The upright soft instance remains in the wordmark and small supporting numerals.
- [Catharsis Fonts: Cormorant](https://github.com/CatharsisFonts/Cormorant) — the open-license display family used to recreate the approved italic direction. The generated mockup lettering is a reference; the implementation uses real font glyphs and selectable HTML text.
- [web.dev: Font best practices](https://web.dev/articles/font-best-practices) — compressed local fonts, deliberate preload, and visible fallback text.

The tab icon uses a self-contained SVG luminance mask of the approved emblem, with a transparent PNG fallback; it fills the icon width without a dark tile and the SVG adapts to light/dark browser themes. Rebuild it with `node tools/build-favicon.mjs`.

The final emblem was generated using the built-in Imagegen tool. Its original raster, web export, favicon and final prompt are retained in `public/assets/brand/`. A CSS luminance mask removes the emblem’s dark export ground over the scene; the wordmark and translation remain real text.

## Explore

- On the hero, drag sideways with a mouse or finger to turn the boat. Releasing a flick gives it briefly decaying momentum. On phones, vertical swipes scroll natively and settle at the neighbouring chapter; sideways boat drags stay in the hero. Pinch zoom remains available.
- Scroll, swipe, choose a chapter, or press the left/right arrows. Up/down also navigate on phones. Home and End jump to the first and last chapter.
- **Step aboard** lifts the canopy and reveals the workshop. **Peek inside / Lower it** reverses the canopy manually.
- **Company** and **Workspace** show closer compositions, with more distance than the original cameras. **Whole boat**, Escape, or changing chapters restores the wide composition.
- Six new sculpted miniature faces replace the photo-textured portraits, eye meshes and transparent hair cards. Their simple features and opaque hair are designed for the scale of the scene.
- The boat keeps drifting. There is no still-water switch. The operating system's reduced-motion preference still produces a settled composition.
- A quiet, filtered water bed starts after the first interaction. Short water laps respond to chapter changes, selected controls and boat rotation, with throttling and a two-voice limit. One mute control covers both layers and persists across refreshes; hidden tabs suspend audio.
- The locally served bed and interaction samples total about 88 KB, derived from [salilnair’s CC0 Kerala lake recording](https://freesound.org/people/salilnair/sounds/524688/). Web Audio gain controls volume consistently on iOS. [Source and preparation](public/assets/audio/CREDITS.md).
- Unsupported bow bunting is omitted from the web export, so no ribbons float when the canopy lifts. The editable Blender source remains intact.
- The native **Field guide** dialog uses a river-chart cover and an ink-on-paper reading layout for the schedule, FAQs and registration. Escape closes it. Rendering pauses while the guide is open or the tab is hidden.
- **Register** is available in the fixed header, conclusion and field guide, linking to [Luma](https://luma.com/60zajedj). The phone conclusion keeps a compact action above the navigation; full details open in the guide instead of scrolling over the boat. Calendar saving is a separate action and does not reserve admission.
- `/?view=still` uses the scene poster without WebGL. The poster also remains available if the 3D assets fail or the graphics context is lost.

## Loading and rendering

Normal page loads and refreshes do not display or download a standby image. Critical scene assets preload immediately. The actual live shoreline and water appear while the boat decodes; the boat joins the same canvas. Morning textures and their lighting probe load after the first boat frame. Navigation, event details and the calendar do not wait for WebGL. Independent model, water and shoreline requests run together. A responsive still image is instantiated only if the scene fails or `?view=still` is requested.

The runtime boat asset is **2,235,948 bytes**, down from the previous **5,564,360 bytes** (60% smaller). Draco encoding retains the same geometry, with quantized attributes and smaller textures. The previous Meshopt asset remains the reproducible master. It has 46 meshes, 35 materials, 8 textures and 292,769 triangles, with the movable roof retained. The export bakes contact shading into vertex colors. The runtime avoids per-frame shadow maps and bloom, compiles shaders asynchronously, caps reflection resolution and pixel density, and reduces pixel work when frames are consistently missed. It uses display-paced animation instead of the former 30 fps cap. Scroll updates are coalesced into animation frames and progress uses a transform.

The animated scene still has a real model download and GPU setup cost. The live environment renders before model decoding finishes, with no poster-to-scene swap. Performance on a physical phone depends on its GPU, browser and connection.

## Verification

```sh
npm run build
npm test
npm run test:browser
node tools/verify-mobile-flow.mjs
```

The browser script uses an installed Google Chrome by default. Alternatively run `npx playwright install chromium` and `PLAYWRIGHT_CHANNEL=chromium npm run test:browser`. It starts its own local production-file server and writes screenshots and `report.json` to ignored `work/verification/`.

The checks cover all five chapters, roof opening and closing, the company view, removed labels/popups, hero dragging and flick momentum, keyboard navigation, guide/FAQ interactions, paused rendering behind the guide, default ambience, mute/re-enable controls, calendar download, phone and small-phone layouts, reduced motion, held model downloads, throttled loading, refreshes without a standby image or poster download, and a failed-model fallback. They also assert that the emblem loads, branding fits narrow screens, the daylight chapter has no full-screen wash, and the caption, canopy and view selector avoid the route rail at 1512×790, 1512×776, 1024×768, and a short landscape viewport.

The latest mobile pass uses Chrome's native touch input to verify vertical swipes, sideways boat rotation, returning from the final notes, action sound throttling, and persisted mute. It also measures a cold page with 4× CPU throttling, 100 ms latency and 1 MB/s download throughput. Under those same conditions the previous build took **8.84 seconds** to show the boat; the updated build took **3.79 seconds**, with the actual shoreline visible at **1.76 seconds**. The first-load transfer fell from about **6.96 MB to 3.30 MB**. A saved baseline in ignored `work/loading-baseline/dist/` enables comparison; without it the script measures the current build only. These are local browser measurements, not physical-phone or production field data.

The filled caption and reading panels from the initial implementation were removed following visual review. Contrast figures from that intermediate treatment do not validate the final transparent phone notes. The current desktop text is checked against rendered sky backgrounds, and phone/landscape notes are also inspected visually with the lake visible beneath their type.

Six motion tests separately cover roof/camera order, smooth reversal, skipping Aboard, re-entry, frame-rate consistency and reduced motion.

## Main files

- `src/pages/index.astro` — semantic chapters, branding, itinerary and journal dialog.
- `src/styles/voyage.css` — consolidated typography, layout, responsive rules, shared footer exclusion area and fallback styling.
- `src/components/CurrentArrow.astro`, `ViewGlyph.astro` — the current-line navigation and purpose-drawn camera pictograms.
- `src/scripts/voyage.js` — navigation, accessible state, audio, dialogs and progressive initialization.
- `src/scripts/lake.js` — rendering, water, lighting, camera paths, roof, hero rotation and adaptive pixel density.
- `src/scripts/backwater-audio.js` — quiet Web Audio bed, interaction laps, rate limits, background pause and remembered mute.
- `tools/build-favicon.mjs` — transparent SVG/PNG packaging of the existing emblem.
- `tools/prepare-interactive-water.py` — filtered loop and short interaction preparation for the credited recording.
- `tools/build-light-boat.mjs` — Draco runtime asset and local decoder packaging.
- `src/scripts/cinematic-environment.js` — sunset/morning panoramas, reflected sunrise and blended environment lighting.
- `src/scripts/aboard-motion.js` — reversible roof/camera choreography.
- `src/scripts/distant-boat.js` — lightweight secondary boat.
- `blender/houseboat.blend` — original editable scene with packed material images.
- `blender/friendly_crew.py` — reproducible miniature crew replacement and contact-shaded export; leaves the original editable scene intact.
- `blender/compress_model.mjs` — simplification, Meshopt compression and resized WebP textures.
- `public/assets/houseboat.glb` — model master with a separate `roof` node; `houseboat-light.glb` is the smaller runtime derivative.
- `public/assets/voyage-poster*.webp` — captures reserved for a failed scene or explicit still-image view.
- `tools/verify-voyage.mjs` — browser and performance verification.
- `model-stats.json` — current exported model counts.

## Rebuild the model

To replace the crew and export from the existing editable scene:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/friendly_crew.py
node blender/compress_model.mjs
node tools/build-light-boat.mjs
```

For a complete architectural rebuild, run `node blender/make_screens.mjs` and Blender with `blender/build_boat.py` first, then run the export and compression commands above. The final crew pass replaces the legacy portraits, batches by material, preserves the roof and bakes contact shading. Compression simplifies geometry and uses Meshopt and WebP. Always start compression from a fresh Blender export, since repeated simplification is destructive.

Use `/?diagnostics` to expose a bounded rolling frame/render sample in `window.__lakeDiagnostics`. Ordinary visits do not collect these samples. Standard Performance entries record `voyage-scene-init`.

## Assets and event information

- Devin and TinkerHub white wordmarks were supplied by the project owner; the local WebP versions preserve transparency and remove empty margins.

- The shoreline, palm-weave color image and original concept were generated for this project; prompts remain in `concepts/`. The palm normal is derived material data.
- [Poly Haven: Dark Wooden Planks](https://polyhaven.com/a/dark_wooden_planks), by Amal Kumar — diffuse, OpenGL normal and roughness maps under [CC0](https://polyhaven.com/license), resized for the web model.
- The original editable scene's legacy portraits use [MakeHuman / MPFB core assets](https://github.com/makehumancommunity/mpfb2) and [MakeHuman system assets](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html). Source notices remain in `blender/character-source/`. The final web model replaces those portrait meshes and textures with the project-authored miniature heads.
- Architecture, clothing modifications, poses, workshop, laptop screens and scene code were authored for Hackathoni. Supplied reference photographs are not embedded in the site.
- The water normal map comes from the [official Three.js example](https://threejs.org/examples/webgl_shaders_ocean.html). `THREE-LICENSE.txt` and `MESHOPT-LICENSE.txt` retain the corresponding notices.
- [Three.js Water documentation](https://threejs.org/docs/pages/Water.html) and [Kerala Tourism's kettuvallam reference](https://www.keralatourism.org/kumarakom/houseboats-kerala-kettuvallom.php) informed the scene.

Boarding is 21 November 2026 at 15:30 IST; docking is 22 November at 09:30 IST. `public/hackathoni.ics` records those times in UTC with tentative status. Registration is through Luma with selection required. Exact boarding point, facility details, challenge rules, judging and prize terms remain to be confirmed. The model is an artist's impression.
