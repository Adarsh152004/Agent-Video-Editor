---
name: presenter-intro-editor
description: Direct, design, edit, and iteratively improve the creator's branded presenter-led video intros. Use when footage needs a timestamp-driven editorial directive, face-safe overlay cards, selective full-screen motion graphics, official brand logos, GitHub screen recordings of any repo or open-source tool that is mentioned, 4K finishing, or when the creator gives feedback that should update this personal editing system.
---

# Presenter Intro Editor

Create presenter-led intros that feel intentionally directed rather than automatically decorated. Protect spoken meaning and the presenter's performance, then use motion only where it clarifies or strengthens a beat.

## Required workflow

1. Read the source inventory, any existing project memory, and [brand-system.md](references/brand-system.md). Never alter original media.
   **Theme selection prompt**: At the start of every project or directive, first prompt the creator to choose one of the three supported themes (or confirm default):
   - `personal` (Default — Signature: Warm Paper `#F5F3EE`, Cobalt `#3659E3`, Ink, Avenir Next, minimal cards & node connectors).
   - `lime-tech` (Hybrid Tech: Light grey canvas, Neon Lime `#E8FF72`, continuously rotating 8-spoke black flower wheels, un-bold Avenir Next).
   - `navy-amber` (Navy Amber: Engineering grid `#EEF1F6`, Royal Navy `#1D2070` & Golden Amber `#FEAF1D`, un-bold classy typography @ 48px, enlarged floating corner spheres, dual-tone line icons, and fluid linear typewriter pacing).
   Record the chosen theme in `editorial-directive.json` under `"theme"`.
2. When the creator supplies a final cut, lock its duration, sequence, playback speed, spoken content, and audio. Skip take selection and cutting; animate the existing timeline without inserting transition time. Obtain word-level timestamps. Prefer local transcription when suitable. Any remote media upload requires explicit approval and a manifest record.
3. **Official logos.** List every company, brand, product, and tool named in the transcript or planned on-screen copy. Always fetch each one's official logo from the brand's own press kit, brand page, or website, and use it in the graphics. Never draw, trace, recolor, or approximate a logo, and never substitute a typed name or generic icon. Store the logos under `edit/<project>/assets/logos/` and record them in the directive's `brand_logos`. If an official logo cannot be found, add it to `approval.ambiguities` and ask the creator. Follow "Brand and company logos" in [brand-system.md](references/brand-system.md).
4. **GitHub repos and open-source tools.** List every GitHub repository and open-source tool named in the transcript or planned on-screen copy. Find each one's official upstream repo, capture its page live with `scripts/capture_repo.py`, and show it as a GitHub screen recording (or a screenshot for a passing mention) at the point where it is named. Store the captures under `edit/<project>/assets/github/` and record them in the directive's `repo_captures`. If the official repo cannot be confirmed, or the narration contradicts the repo page, add it to `approval.ambiguities` and ask the creator. Follow "GitHub repos and open-source tools" in [brand-system.md](references/brand-system.md).
5. Before creating graphics, build both `director-treatment.md` and `editorial-directive.json` from the transcript. Follow [editorial-directive.md](references/editorial-directive.md) and validate the JSON with `scripts/validate_directive.py`.
6. Present the directive for approval whenever a choice could materially change meaning, pacing, or visual emphasis. Do not render through unresolved ambiguity.
7. Execute the approved directive. Load the project-local `video-use` skill for audio, cut, compositing, and verification invariants. Load the relevant Remotion guidance when authoring React motion graphics.
8. Inspect representative frames, every edit boundary, every graphics entrance and exit, and the final frame before reporting success. Run full-file decode, probe, loudness, alpha, safe-region, and checksum checks.
9. When the creator provides feedback, append the exact lesson and observed failure to [feedback-log.md](references/feedback-log.md). Promote explicit or repeated preferences into [brand-system.md](references/brand-system.md); do not turn a one-off correction into a universal rule without evidence.

## Editorial decisions

- Audio and complete thoughts lead. Never cut inside a word, sentence, or unfinished idea, and never cut merely because silence or a breath exists.
- Use `CLEAN_PRESENTER` for trust, personality, and direct promises; visual silence is part of pacing.
- Use `OVERLAY_CARD` for concise supporting information that fits the established face-safe region.
- Use `FULLSCREEN_MOTION` for processes, comparisons, roadmaps, transformations, and major reveals that need the full canvas. Keep the original narration continuous underneath unless the directive explicitly approves an audio edit.
- Use `PRESENTER_INSET` when an explanation needs a large graphics canvas while retaining presenter presence: smoothly scale and move the entire uncropped video into a corner, animate in the remaining space, then return it to full frame. Follow the inset and directional entrance rules in [brand-system.md](references/brand-system.md).
- Full-screen motion enters from the right, top, or bottom using a controlled slide or wipe; record the direction in the directive.
- Use `SELECTIVE_TEXT` for a payoff phrase when a complete card would be excessive.
- Use `TRANSITION` only to connect meaningful sections. Do not add motion merely to satisfy a fixed interval.
- Let visuals land on relevant spoken words. Reveal one independent element at a time and hold the resolved state long enough to read.
- On-screen copy may condense a spoken idea but must remain faithful. Never silently rewrite the speaker's claim.
- When a beat names a company or brand, show its official logo, landing on the spoken name. If the beat is a deliberate `CLEAN_PRESENTER` moment, record in the directive why the logo is held back. Whenever a brand appears in a graphic, it appears as its official logo.
- When a beat names a GitHub repo or an open-source tool, show its real repository page at that point: a scrolling browser capture that lands on the spoken name and then moves to what the narration describes (stars for popularity, the README for features, the license for "open source"). The repo page accompanies the official logo; it does not replace it. A product that is not open source gets its logo only.
- Alternate presenter, overlay, inset, and full-screen treatments according to meaning. Avoid a mechanical cadence and avoid stacking multiple primary treatments at once.

## Production requirements

- Preserve the source dimensions, exact rational frame rate, color metadata, and audio sample rate unless the creator requests another delivery profile.
- Keep the presenter's face, eyes, microphone, and primary gesture corridor unobstructed. Verify this on the actual footage, not a blank graphics canvas.
- Transparent deliverables must preserve alpha. Force an alpha-aware FFmpeg decoder when required and verify the alpha plane after encoding.
- Full-screen sequences are editorial cutaways, not background replacements pretending to be camera footage. Use vector/UI motion consistent with the approved brand.
- Use restrained easing driven by frames; no CSS animations, linear easing, random zoom pumping, generic AI imagery, neon particles, fake 3D, or gratuitous effects.
- Composite graphics before captions; captions, when requested, are last and remain inside the delivery safe area.
- Maintain restartable, content-addressed outputs with an EDL/directive, render receipt, verification artifacts, and hashes.

## Deliverables

Place work under `<videos_dir>/edit/<project-name>/` and include the approved directive, treatment, editable motion source, the official logos with their source records, the GitHub repo captures with their source records, reusable alpha assets, composited master, verification contact sheets, probe/loudness reports, receipt, and project log.
