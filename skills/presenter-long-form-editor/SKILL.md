---
name: presenter-long-form-editor
description: Direct, design, edit, and iteratively improve the creator's branded presenter-led long-form videos. Use when a full-length video needs a timestamp-driven editorial directive, face-safe overlay cards, selective full-screen motion graphics, 4K finishing, or when the creator gives feedback that should update this long-form editing system. For short intros, use presenter-intro-editor instead.
---

# Presenter Long-Form Editor

Create presenter-led long-form videos that feel intentionally directed rather than automatically decorated. Protect spoken meaning and the presenter's performance, then use motion only where it clarifies or strengthens a beat.

## Required workflow

1. Read the source inventory, any existing project memory, and [brand-system.md](references/brand-system.md). Never alter original media.
   **Continuing a series**: when the new video is the next section of a series that already has a project folder (for example `edit/series-1/` for parts 2, 3 …), read that folder's `project.md` first and follow its "Adding the next section" runbook. Reuse the series' approved theme, presenter mask, window geometry, grade, loudness target, components and fetched brand icons. Don't ask the creator again about settled choices, and don't re-derive them; only measure what can differ per recording (face position, loudness, gaze).
   **Theme selection prompt**: at the start of a new project, not a new section of an existing series, first prompt the creator to choose one of the seven supported themes (or confirm the default):
   - `clean-tech` (Clean Tech / Kinetic Type — Studio 3D Style: cool off-white `#F5F6F8`, drifting dot grid, ink `#0D0F14`, electric blue `#2F5BFF` pill highlights, Inter Tight 800 rising kinetic typography, floating white cards, process loops, counters).
   - `warm-paper` (Warm Paper Sketch: warm paper `#F5F3EE`, ink `#1D2025`, cobalt `#3659E3`, yellow marker emphasis `#FFD84D`, Shantell Sans titles over Avenir Next body, JetBrains Mono code, instant on-cue builds).
   - `personal` (Signature: Warm Paper `#F5F3EE`, Cobalt `#3659E3`, Ink, Avenir Next, minimal cards & node connectors).
   - `lime-tech` (Hybrid Tech: Light grey canvas, Neon Lime `#E8FF72`, continuously rotating 8-spoke black flower wheels, un-bold Avenir Next).
   - `navy-amber` (Navy Amber: Engineering grid `#EEF1F6`, Royal Navy `#1D2070` & Golden Amber `#FEAF1D`, un-bold classy typography @ 48px, enlarged floating corner spheres, dual-tone line icons, and fluid linear typewriter pacing).
   - `dark-sketch` (Dark Sketch Explainer: flat charcoal `#181A1C`, soft-white hand-drawn line art, Shantell Sans 700, blue `#578AE0` fills and orange `#CB9370` brush underlines, instant on-cue builds instead of animated entrances).
   - `blackboard-style` (Blackboard Live Pen: pure black `#000000`, Gochi Hand handwriting written on live like a tablet pen, a few bright inks by meaning (white, grey notes, blue `#5454FC`, green `#6CFC6C`, yellow `#FCFC84`, pink, orange), solid red pointer arrows, and an infinite-canvas camera that zooms in on the first drawing, pulls out as the diagram grows and pans to new areas).
   - `colorful-purple` (Hand-Drawn Infographic: near-white paper with a faint crumple, black + periwinkle `#8B97EE` Archivo Black headline, Schoolbell marker handwriting, coral `#EE8E72` / blue `#A2AEF5` boxes with fills offset from wobbly ink outlines, green `#1E7B46` notes, lavender highlight row, mint `#D4F2CB` callout pill in Fredoka, everything written and drawn on from its spoken cue).
   Record the chosen theme in `editorial-directive.json` under `"theme"`.
2. When the creator supplies a final cut, lock its duration, sequence, playback speed, spoken content, and audio. Skip take selection and cutting; animate the existing timeline without inserting transition time. Obtain word-level timestamps. Prefer local transcription when suitable. Any remote media upload requires explicit approval and a manifest record. Some sections may arrive as audio only; assemble and record them as described under "Audio-only sections" in [brand-system.md](references/brand-system.md).
3. Before creating graphics, build both `director-treatment.md` and `editorial-directive.json` from the transcript. Follow [editorial-directive.md](references/editorial-directive.md) and validate the JSON with `scripts/validate_directive.py`.
4. Present the directive for approval whenever a choice could materially change meaning, pacing, or visual emphasis. Do not render through unresolved ambiguity.
5. Execute the approved directive. Load the project-local `video-use` skill for audio, cut, compositing, and verification invariants. Load the relevant Remotion guidance when authoring React motion graphics.
6. Inspect representative frames, every edit boundary, every graphics entrance and exit, and the final frame before reporting success. Run full-file decode, probe, loudness, alpha, safe-region, and checksum checks.
7. When the creator provides feedback, append the exact lesson and observed failure to [feedback-log.md](references/feedback-log.md). Promote explicit or repeated preferences into [brand-system.md](references/brand-system.md); do not turn a one-off correction into a universal rule without evidence.

## Editorial decisions

- Audio and complete thoughts lead. Never cut inside a word, sentence, or unfinished idea, and never cut merely because silence or a breath exists.
- Use `CLEAN_PRESENTER` for trust, personality, and direct promises; visual silence is part of pacing.
- Use `OVERLAY_CARD` for concise supporting information that fits the established face-safe region.
- Use `FULLSCREEN_MOTION` for processes, comparisons, roadmaps, transformations, and major reveals that need the full canvas. Keep the original narration continuous underneath unless the directive explicitly approves an audio edit.
- Use `PRESENTER_INSET` when an explanation needs a large graphics canvas while retaining presenter presence: smoothly scale and move the entire uncropped video into a corner, animate in the remaining space, then return it to full frame. Follow the inset and directional entrance rules in [brand-system.md](references/brand-system.md).
- When the creator has said not to show them full-frame (for example an angled laptop tutorial camera), there is no full-frame state. The presenter lives in a masked window on the canvas for the whole video, and `PRESENTER_INSET` means moving that window between its stage, corner and off-canvas sizes. See "Presenter mask" under `warm-paper` in [brand-system.md](references/brand-system.md).
- Full-screen motion enters from the right, top, or bottom using a controlled slide or wipe; record the direction in the directive.
- Use `SELECTIVE_TEXT` for a payoff phrase when a complete card would be excessive.
- Use `TRANSITION` only to connect meaningful sections. Do not add motion merely to satisfy a fixed interval.
- Let visuals land on relevant spoken words. Reveal one independent element at a time and hold the resolved state long enough to read.
- On-screen copy may condense a spoken idea but must remain faithful. Never silently rewrite the speaker's claim.
- Alternate presenter, overlay, inset, and full-screen treatments according to meaning. Avoid a mechanical cadence and avoid stacking multiple primary treatments at once.
- Choose modes per section following "Long-form rhythm" in [brand-system.md](references/brand-system.md): full-frame for trust moments, inset for longer explanations, full-screen for short focus moments and every audio-only section.
- While the inset floats, move it to another corner now and then at a natural break, following "Corner moves while floating".
- Audio-only sections are full-screen graphics for their whole duration.
- When the narration names a brand, show its current icon, fetched from the brand's own source, on that word. See "Brand icons" in [brand-system.md](references/brand-system.md).

## Production requirements

- Preserve the source dimensions, exact rational frame rate, color metadata, and audio sample rate unless the creator requests another delivery profile.
- Keep the presenter's face, eyes, microphone, and primary gesture corridor unobstructed. Verify this on the actual footage, not a blank graphics canvas.
- Transparent deliverables must preserve alpha. Force an alpha-aware FFmpeg decoder when required and verify the alpha plane after encoding.
- Full-screen sequences are editorial cutaways, not background replacements pretending to be camera footage. Use vector/UI motion consistent with the approved brand.
- Use restrained easing driven by frames; no CSS animations, linear easing, random zoom pumping, generic AI imagery, neon particles, fake 3D, or gratuitous effects.
- Composite graphics before captions; captions, when requested, are last and remain inside the delivery safe area.
- Maintain restartable, content-addressed outputs with an EDL/directive, render receipt, verification artifacts, and hashes.

## Deliverables

Place work under `<videos_dir>/edit/<project-name>/`. A series delivered in sections shares one project folder: the first section uses the plain file names, and later sections add a `-<section>` suffix. Include the approved directive, treatment, editable motion source, reusable alpha assets, composited master, verification contact sheets, probe/loudness reports, receipt, and project log.
