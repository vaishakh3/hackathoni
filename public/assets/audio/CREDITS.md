# Water sounds

Source: “Water-lap-against-rocks-lake.wav” by **salilnair**.

- Original: https://freesound.org/people/salilnair/sounds/524688/
- License: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- Recording location listed by the creator: Thiruvananthapuram, Kerala, India.
- Retrieved: 2 November 2026.

The recording is used as a Kerala lake texture, not represented as the event location.

`water-bed.m4a` is a 12-second mono loop with a one-second seam crossfade,
750 Hz low-pass filtering and restrained peaks. Its player gain is 0.16,
with another low-pass filter at 900 Hz. It is decoded only after interaction.
`water-touch.m4a` is a faded 0.85-second lap, played with a short gain envelope
for navigation, controls and boat rotation. Effects are rate-limited and
limited to two concurrent voices. The mute control covers both layers.

`tools/prepare-interactive-water.py` reproduces the PCM derivatives from
`work/audio/lapping-source.wav`. Encode the bed as mono AAC at 48 kbit/s
and the interaction at 64 kbit/s. Both are served locally (about 88 KB total).
Web Audio gain provides consistent attenuation on iOS as well as desktop.
