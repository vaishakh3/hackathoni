# Hackathoni theme explorations

Generated using the built-in Imagegen tool on 2 November 2026. These are visual concepts for review before the next implementation pass. Existing website code was not changed for this exploration.

The supplied First Light and Your Place screenshots are composition references. Generated mockups can redraw small environmental details; implementation must retain the original 3D scene, boat, camera and backgrounds. Recreate typography, localized reading surfaces and controls as real HTML/CSS, not screenshot assets.

## Concepts

Latest refinement: [Open itinerary](04-open-itinerary.png), based on the user-approved italic typography from direction 2. It removes the large information card and uses prominent date numerals, full-opacity text in clear sky and one narrow calendar action. [Refinement notes and exact prompt](04-open-itinerary.md).

1. [Ink & Tide](01-ink-and-tide.png): a two-section study with bold sculptural lettering, a dark morning caption strip and compact opaque information folio.
2. [Current / Hand & Ink](02-current-and-ink.png): expressive italic lettering, an airy left composition and a dark boarding folio with a shallow curved base.
3. [Boatyard Press](03-boatyard-press.png): strong display lettering, a copper caption label, localized CTA surface and simplified route markers.

Recommended direction: Boatyard Press's stronger display scale and caption treatment, with a carefully sized dark folio for the final itinerary. Supporting text should be calmer and less heavy than the first concept. Select available, licensed fonts after choosing the direction; Imagegen lettering is an art-direction reference, not an identified downloadable font.

## Required implementation outcomes

- Keep the hero, boat and environment intact. No full-screen dimming or color wash.
- Give the morning subline a solid localized reading surface; do not rely on text over foliage.
- Keep all final-section supporting text, including the admission note, at full opacity on the same protected surface.
- Size and measure actual body text for readability at desktop and phone sizes. Generated mockups do not establish measured WCAG contrast or browser performance.
- Retain the below-scene mobile reading section and the startup behavior with no standby poster.

## Exact Imagegen prompts

### 1. Ink & Tide

Use case: ui-mockup. Create a high fidelity ART DIRECTION EXPLORATION for the Hackathoni website, using the attached screenshots as edit targets. Deliver one polished presentation image with TWO LARGE website viewports stacked vertically, top is FIRST LIGHT (image 1) and bottom is YOUR PLACE (image 2). Each viewport is wide landscape, not a tiny thumbnail. This is one cohesive theme proposal, not a collage of unrelated ideas. No laptops, device frames, browser chrome, annotations, extra stock photos, or external background.

MANDATORY SCENE INVARIANTS: Preserve the existing rendered Kerala houseboat, people, palm shoreline, water reflections, bright morning sky, camera composition and colors from each reference. Do not repaint, stylize, regenerate, dim, blur, recolor, or darken the environment. Change ONLY the website typography, colors of interface elements, labels, buttons, information panels and navigation. Keep most of the lake visible. Do not cover the boat.

DIRECTION A — INK & TIDE: An expressive contemporary independent arts festival identity rooted in Kerala print and boat lettering. Headline typography should be dramatically DIFFERENT from the references' thin conventional serif: sculptural, round, hefty low-contrast soft-serif letterforms, unusual broad terminals, confident and warm, carefully typeset with compact line spacing. Refined, characterful lettering rather than generic AI landing-page fonts. Supporting text is a sturdy, open, highly readable humanist sans with normal case and generous size. Use a disciplined palette of nearly-black deep indigo ink, warm pale gold/ivory type, and small rusty vermilion accents drawn from the existing palette. No faint gray text anywhere.

Header: Retain the houseboat emblem and lowercase name 'hackathoni', with a beautifully composed small 'thōni / തോണി' translation note. Header date '21–22 NOV 2026', place 'ALAPPUZHA, KERALA'. Navigation 'Field guide' and 'Come aboard'.

TOP VIEWPORT: '03 / FIRST LIGHT' overline. Large sculptural headline on two lines: 'Take something' and 'new ashore.' Positioned in the upper left sky, clear of tree line where practical. Critical supporting sentence 'By morning, the idea is yours to show.' MUST be unmistakably readable, at generous body size, inside a compact opaque deep-ink caption strip with warm ivory type, only as wide as the sentence, leaving the rest of the scene untouched. Integrate the strip with a small folio 03 and one subtle printmaker rule rather than generic pill UI.

BOTTOM VIEWPORT: headline upper left, 'Leave the' / 'ordinary ashore.' Upper right a compact vertically composed deep-indigo information plaque with warm ivory text and pale-gold date numerals, fully opaque only within its own limited area. Shape is deliberate and architectural: straight edges with one subtle inset corner or restrained curved base borrowed from a boat hull, no rounded SaaS rectangle. Avoid a large empty box. Information hierarchy: 'YOUR PLACE ABOARD'; two dates '21 Nov / 16:00' and '22 Nov / 09:00'; 'Two houseboats · Solo · Free entry'; 'Applications opening soon'; integrated warm-gold calendar action 'Keep the night free'; readable 'Add it to your calendar'; and very clearly visible full-contrast admission note 'Saving the date does not reserve a place.' The note belongs INSIDE the same protected reading surface. All body text must be large enough to read comfortably, no pale gray or low opacity. Do not fill page with marketing.

Footer both viewports: compact horizontal voyage line on LEFT with 'Jetty', 'Aboard', 'Midnight', 'First light', 'Your place', and a deliberate custom two-stroke current-shaped navigation arrow at right. Unobtrusive, coherently designed. Make this look like an award-quality cultural event website with personality, not a generic luxury hotel, nostalgia tourist poster, dashboard, or landing page with cards everywhere. No frosted glass, no drop shadows, no giant full-screen overlay, no full-page tint. The UI should feel printed and crafted while the exact live scene stays cinematic and bright.

### 2. Current / Hand & Ink

Use case: ui-mockup. EDIT THE ATTACHED WEBSITE SCREENSHOT into a much more expressive, exceptionally sophisticated theme concept for Hackathoni. Output ONE full-browser-viewport design, landscape 16:9, high resolution. Do not make a design board, contact sheet, split screen or collage. Input image 1 is the final section of the existing website and is the edit target.

IMMUTABLE: Keep the actual 3D Kerala houseboat, trees, lake, reflections, bright blue morning sky, framing, positions, brightness and colors as in the attached screenshot. Change the interface only. No scene-wide dimming, gradient scrim, blur, sepia, tint or new scenery. Keep the boat visible and all of the original natural daylight.

THEME B — CURRENT / HAND & INK. An art directed independent cultural-festival website, informed by expressive broad-nib lettering and Kerala boat signage. Sophisticated, airy, sensuous, contemporary. This must be a significant departure from the current conventional upright thin serif. Main headline uses beautiful custom Latin lettering: moderately bold calligraphic italic with sweeping generous lowercase curves, long expressive ascenders, warm flared terminals, graceful asymmetry, open counters, subtle brush character. NOT generic wedding script; NOT connected cursive; NOT a high-contrast Didone; NOT Cooper Black; NOT all-caps condensed sans. Give the letters air. A human hand should be felt in the display type, while real UI labels use a very readable, calm medium-weight humanist sans. Do not make all supporting labels bold or uppercase. The core palette is the existing very deep blue ink, warm ivory, and sparing copper. Typography and graphic elements are crisp flat solids, no distressed text effects.

Composition:
Top masthead retain the current houseboat emblem at left with 'hackathoni' in a strong but elegant companion wordmark, tiny legible translation 'thōni / തോണി', not a whole Malayalam name. Centered '21—22 NOV 2026' and 'Alappuzha, Kerala'. Right 'Field guide' and a small editorial link 'Come aboard' with a purposeful custom flowing arrow. Give elements comfortable breathing space. Preserve enough top padding.

Left upper sky: tiny restrained section folio '04 / Your place'. A beautiful two/three-line headline in large custom brush-influenced italic lettering, deep blue solid:
'Leave the'
'ordinary'
'ashore.'
Use an inventive tasteful oversized initial L and elegant sweeping baseline rhythm. One or two words may be copper but do not put a low-contrast copper stroke on the tree line. The text stays in the clear sky at left, doesn't cover the center boat. Avoid the original very wide horizontal headline.

Right upper sky: a NARROW COMPACT editorial boarding folio, ~25% viewport width and ~36% height, with an opaque very-deep-blue ink surface and warm ivory readable text. This is the only information reading surface. It is smaller and quieter than a generic CTA card. Distinctive crafted silhouette: straight top and sides, slender copper top rule and a subtle shallow bow-like curved lower edge. Do not add shadows, glow, floating layered cards, grainy textures or frosted glass. Meticulous alignment and generous readable type. Body text not tiny or light. Exact information:
'On the water, together.'
'21 Nov 16:00 — 22 Nov 09:00'
'Alappuzha, Kerala'
'Two houseboats · Solo · Free entry'
'Applications opening soon'
A calendar action 'Keep the night free' with one fine copper underline and a simple current-arrow, NOT an enormous filled ribbon button.
'Add it to your calendar'
'Saving the date does not reserve a place.'
The final admission note MUST use the same full-contrast ivory as primary body text, never faded gray; it is entirely within the protected reading surface. No excessive empty area. Date numerals feel lovely and typographic rather than dashboard statistics.

Footer compact left horizontal chapter rail with five deliberate markers and 'Jetty', 'Aboard', 'Midnight', 'First light', 'Your place'. Subtle ivory over dark lake, readable. Right a SINGLE beautifully drawn current-like arrow with 'Follow the current', no arrows in square boxes, avoid duplicated decorative swooshes.

Overall artistic restraint, asymmetry with purpose, a memorable lettering identity and clear functional typography. Preserve the quiet cinematic background. No giant overlay, no big white card, no beige web-template blocks, no generic AI/SaaS glass cards, no pill buttons, no giant illegible microtype. This is a concept of a website a careful designer can actually recreate in HTML/CSS.

### 3. Boatyard Press

Use case: ui-mockup. Create ONE precise high-resolution full-viewport website theme concept by EDITING the attached morning section screenshot. Landscape 16:9. No browser chrome, device frame, collage, presentation board, inset thumbnails or design annotations. This is a professional production-looking web interface, not a poster pasted over an image.

SCENE IS LOCKED: The attached screenshot is the edit target. KEEP THE EXACT boat, its size, angle and location, the figures, roof, trees, horizon, sky, sun, water and reflections. No change in camera or environment; no dimming, color wash, blur, new scenery or full-screen overlay. Only replace typography, brand lettering and UI components.

DESIGN DIRECTION C — BOATYARD PRESS: A distinctive contemporary making-festival identity grounded in working Kerala boatyards and screen-printed cultural posters. More intelligent restraint than decorative nostalgia. Two robust print inks taken from the existing palette: deep nearly-black blue and rich burnt copper, plus warm ivory for contrast on localized controls. Every small label is fully opaque and easily legible. No faded text.

TYPOGRAPHIC CONCEPT: Main heading uses exceptionally distinctive custom sign-painted display lettering, an upright energetic semi-condensed slab/grotesque HYBRID: strong vertical strokes, broad open counters, flared wedge terminals, one unexpected cut in the R and a curved t, carefully irregular human rhythm, very slight forward energy without slanting whole words. It should feel like commissioned festival lettering, with real anatomy and beautiful tight kerning. NOT conventional thin serif, NOT generic geometric sans, NOT default bold Arial, NOT soft Cooper Black, NOT cursive wedding lettering, NOT all-over decorative swashes. Confident large words, precise line breaks. Supporting UI uses calm open humanist sans in normal case at generous readable size, medium weight, not all bold.

MASTHEAD: Retain existing houseboat emblem. New artfully kerned wordmark 'hackathoni', small word-translation 'thōni / തോണി' beneath. Center date '21—22 Nov 2026' and place 'Alappuzha, Kerala'. At right 'Field guide' and 'Come aboard' with a spare custom nautical arrow. No huge logo container. Thoughtful clear spacing.

MAIN CONTENT: Recompose the heading in upper LEFT SKY, clear of boat and avoiding the dark trees: small folio '03 / First light'. Main large type, exactly:
'Take something'
'new ashore.'
Deep blue main line, rich copper accent line. Fit the heading in clear sky by choosing appropriate scale and line lengths, not by covering the boat.
The critical sentence 'By morning, the idea is yours to show.' should be immediately readable. Set it at comfortable body size in warm ivory on a small SOLID copper caption panel beneath the headline. It is a precisely fitted reading surface, about the sentence width, with flat straight edges and a small purposeful offset print-registration corner. One slim ink divider or index 03, not an ornamental ribbon. Do NOT write dark text directly on palm trees. Do NOT dim the trees to make text readable. Generous breathing space separates caption and heading.

SMALL ONBOARD DETAIL: At lower left above navigation, tastefully typeset 'പുലരി' paired with 'Pulari / First light' as a tiny translation-poster motif. Keep this deliberately secondary but readable.

BOTTOM CONTROLS: Left-aligned compact horizontal voyage progress line with labels 'Jetty', 'Aboard', 'Midnight', 'First light', 'Your place'. Fourth marker is active in copper with a warm-ivory outline. Thin custom route marks, one perfectly placed rule. At right one generous custom ARROW resembling a slender boat prow and one flowing current line, with 'Drift on'. Simple and memorable. Center above footer a compact text link 'Find your place aboard' and a single bespoke arrow on its own small solid ink tab, no ghost typography over water.

CRAFT: A carefully composed asymmetric grid. Readability comes from solid localized surfaces and intelligent placement. UI clear at human viewing distance. Main environment remains cinematic and unobscured. No white cards, no giant card, no all-screen tint, no glassmorphism, no soft shadows, no SaaS badges, no decorative noise. Do not invent or add any extra marketing text, slogans, seals or mock company logos. Make it distinctive through lettering, spacing and purposeful construction.

