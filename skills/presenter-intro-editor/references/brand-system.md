# Presenter intro brand system

Use this reference for design and recurring editorial preferences. Adapt the themes, wordmark and presenter geometry to your own channel.

## Visual Themes

Projects support three distinct visual themes selectable at the beginning of each edit:

### 1. `personal` (Default — Signature)
- **Aesthetic**: Premium editorial, warm paper and cobalt signal.
- **Palette**:
  - Warm paper canvas: `#F5F3EE`
  - Ink (primary typography): `#151922`
  - Muted text: `#737985`
  - Line / structural borders: `#D7D4CC` (soft line: `#E7E4DE`)
  - Accent: Cobalt `#3659E3` (used as a precise signal, not a heavy wash)
  - Card surface: `#FFFFFF` with subtle paper drop shadows (`rgba(21, 25, 34, 0.14)`)
- **Typography**: Avenir Next (fallback: Avenir, Helvetica Neue, sans-serif).
  - 4K canvas (3840w): body/list 90–100px, sub-heads 110–130px, headlines 140–195px.
  - 1080p canvas: body/list 45–50px, sub-heads 55–65px, headlines 70–98px.
- **Ornaments & Structure**:
  - Thin structural connector lines and round nodes.
  - Optional wordmark in the top right (see "Brand signature"): the first word in Cobalt, the rest in Ink.

### 2. `lime-tech` (Hybrid Tech Theme)
- **Aesthetic**: High-contrast modern tech aesthetic with continuous kinetic motion.
- **Palette**:
  - Canvas: Light grey `#F5F5F5` (or `#EEEEEE`)
  - Accent & Badges: Neon Lime `#E8FF72`
  - Contrast & Details: Solid Black `#000000`
  - Cards: Crisp White `#FFFFFF` or translucent frosted white `#FFFFFFD0`
- **Typography**: Avenir Next / geometric sans.
  - Un-bold, clean executive weight (`fontWeight: 500` for titles, `fontWeight: 600` for headlines).
  - High-contrast black text (`#000000`) over lime pills and white cards.
- **Corner Ornaments (Continuous Motion)**:
  - Continuously rotating 8-spoke black flower wheels at canvas corners:
    - Top-left: `cx=38, cy=70`, rotating counter-clockwise (`-frame * 0.42` deg).
    - Bottom-right: `cx=2010, cy=1094`, rotating clockwise (`+frame * 0.38` deg).
    - Wheel geometry: center circle `r=46`, 8 spokes with length 320px, stroke width 58px.

### 3. `navy-amber` (Navy Amber Theme)
- **Aesthetic**: Architectural engineering tech presentation, sophisticated and un-bold.
- **Palette**:
  - Canvas: Pure White `#FFFFFF` with subtle engineering graph grid (`#EEF1F6` 1.5px lines at 48px pitch).
  - Primary Corporate Tone: Royal Navy `#1D2070` (headings, badges, primary icons).
  - Accent: Golden Amber `#FEAF1D` (alternating rows, accents, active tabs).
  - Amber Text: Rich high-contrast `#C87500` (WCAG AA compliant against white).
  - Cards: White `#FFFFFF` with border `#E8EEF5` and soft navy shadow (`rgba(29, 32, 112, 0.06)`).
- **Typography (Un-bold Classy Standard)**:
  - Typeface: Plus Jakarta Sans or Avenir Next.
  - Checklist & Item Titles: `fontSize: 48px` (96px in 4K), `fontWeight: 500` (medium weight, un-bold, classy).
  - Headlines: `fontSize: 76px` (152px in 4K), `fontWeight: 600`.
  - Number Badges: `fontSize: 32px`, `fontWeight: 650`.
  - Typewriter reveal: Use steady linear pacing (`1 char / ~1.7 frames`). Avoid cubic ease-out truncation which stalls on the final character. Text lands squarely on the final character without pause.
- **Ornaments & Structure**:
  - Corner Geometric Balls: Enlarged overlapping circles at top-right and bottom-left inside 350×350 containers (Navy circle `r=142`, Amber circle `r=115`) with organic micro-floating drift (`±5px`).
  - Navigation Bar: Top bar with brand chevron identity and section tabs (`Overview`, `Checklist`, `Public Build`) with dynamic amber active underline.
  - Icons: Custom dual-tone vector line-art in Navy and Amber.

---

## Visual character

- Premium educational/editorial rather than futuristic or game-like.
- Clear hierarchy, minimal chrome, and one focal idea per composition.
- Frame-driven fade-and-rise entrances, line draws, node progressions, and restrained sequencing.
- Avoid gradients unless nearly imperceptible, glossy glassmorphism, neon, particles, emojis, stock icons, fake dashboards, and generic AI imagery.
- Motion exists to explain structure or emphasize a spoken payoff.
- Keep something in motion. An element that fades in and then holds perfectly still for eight to ten seconds reads as a frozen screenshot. Give each element a slow continuing drift of a few pixels after it lands, and a brief accent (a node pop, a line draw) at the moment it arrives.
- Audit gaps between reveals before rendering. Gaps beyond about two seconds, and tails beyond about two and a half seconds after the final reveal, are where a beat goes static; fill them with secondary motion rather than by moving narration-synced reveals.
- Reveal times are synchronised to speech and are not free to move. Increase liveliness through entrance snap, overshoot, accents, and drift, which cost no timing.
- Do not add slide, page, scene, or sequence numbering to full-screen animations, including labels such as `1/4` or `01 / 04`. Avoid decorative numbering that is not part of the spoken content.

## Brand signature

- The wordmark is optional. If the creator supplies one, record its exact text, colours and font here, and display it in the upper-right of every full-screen animation. If none is recorded, leave that corner empty and ask once whether they want one.
- Keep the wordmark fixed in the same position and scale across scenes.
- The wordmark is a restrained signature, not a headline: keep it small, clean, and clear of the scene's primary hierarchy.
- Do not substitute scene numbering, episode numbering, or a generic logo for the signature unless the creator explicitly requests it.

## Brand and company logos

Standing rule: whenever a company or brand is mentioned, get its official logo and use it.

- **Scope.** Collect every company, brand, product, model family, and tool named in the transcript or in planned on-screen copy, such as OpenAI, ChatGPT, Claude, Remotion, or YouTube. A product with its own mark uses that mark, not its parent company's logo.
- **Sources, in order.** Use the brand's own press kit, media kit, or brand-guidelines page first, then the logo served by its official website. A third-party mirror such as Wikimedia Commons or a logo aggregator is acceptable only when it matches the official mark exactly. Record why the official source was unavailable. Never take a logo from an image search, a screenshot, or AI generation.
- **Format.** Prefer SVG, then a transparent PNG large enough for the delivery canvas (at least 2× its on-screen size on 4K). Pick the variant (full-colour, mono, reversed, icon-only, or wordmark) that the brand's guidelines permit for the background.
- **Integrity.** Never redraw, trace, retype, recolor to the theme accent, stretch, crop into the mark, add effects to, or animate the inside of a logo. Scale it uniformly, honour its clear-space and minimum-size rules, and animate only the container (fade, rise, slide, scale-in).
- **Contrast.** If the official colours lack contrast on the theme canvas, use the brand's own mono or reversed variant, or place the logo on a neutral chip (white card surface or paper). Never invent a recolor.
- **Recognisability.** Keep the logo legible: on a 3840-px-wide canvas, an icon mark should be at least about 120 px tall and a wordmark at least about 300 px wide. Inspect it at native resolution.
- **Placement.** Logos sit inside the content (cards, nodes, comparisons, lists, hero reveals). They never take the wordmark position, and they obey presenter protection and inset rules like any other graphic.
- **Not stock icons.** The stock-icon ban in "Visual character" covers generic pictograms. Official logos are required. A generic icon or typed name standing in for a brand is the failure this rule prevents.
- **Safety and provenance.** Treat downloaded files as untrusted. Save them to `edit/<project>/assets/logos/` with descriptive names, never in the original-media folder. Strip scripts, external references, and embedded raster links from SVGs, or rasterize them, before rendering. Record each logo in the directive's `brand_logos` with its source URL, retrieval date, and SHA-256.
- **Missing logo.** If no official logo can be confirmed, or the mark is ambiguous (a rebrand, or several products under one name), stop. Add it to `approval.ambiguities` and ask the creator. Do not fall back silently to text or an icon.

## GitHub repos and open-source tools

Standing rule: when a GitHub repo or open-source tool is mentioned, show its GitHub screen recording or screenshot at that point in the edit.

- **Scope.** This covers every GitHub repository and open-source tool, library, model, skill pack or app named in the transcript or the planned on-screen copy. A product that only has a public issue tracker, and is not open source, gets its logo only; Claude Code is an example. If you are unsure, check the repository's license. With no license, or no public source, show the logo only and say why in the beat's `rationale`.
- **Official repo only.** Use the upstream repository. It should be linked from the project's own website or docs, or owned by the vendor's organisation, and not be a fork. Confirm this with the public GitHub API (`https://api.github.com/repos/<owner>/<repo>`: `fork: false`, `homepage`, `license`) and record the evidence. Forks, mirrors (Gitee, cnb.cool, aggregators) and look-alike names are not acceptable. If several candidates remain, that is an ambiguity: ask the creator. A project hosted on another forge (GitLab, Codeberg) uses that forge's page.
- **Sources, best first:**
  1. The creator's own screen recording of the repo, if they supply one.
  2. A live capture of the repo page made with `scripts/capture_repo.py`, animated as a screen recording (below). The script uses a fresh, logged-out Chromium context in the light scheme, a 1608×758 CSS viewport at 2× (3216×1516 px), lazy README images loaded, and a tall page clip for scrolling. It also records the title, star counter and README heading positions.
  3. A single still screenshot, only when the mention is too short for movement (under about 2.5 s).

  Never use a mocked-up, redrawn or AI-generated GitHub page, another site's screenshot of the repo, or a GitHub-style card typed by hand.
- **The screen-recording look.** Show the capture in a clean browser window with the real address (`github.com/<owner>/<repo>`) in the address bar.
  - Drive a frame-based camera over the capture. Open on the repo header (owner, name, star counter), then scroll or push in to what the narration names: the star counter for a popularity claim, the README hero or the relevant README section for a feature claim, and the license in the About sidebar for "open source".
  - Move between camera stops with smootherstep and hold each stop for at least about 1.2 s so it can be read.
  - Never magnify beyond 1:1 of the 2× capture, so it stays crisp at 4K.
  - Use one focus ring at a time, of constant on-screen width, arriving on the spoken word.
  - A long jump (for example, past a file list to the README) is one fast eased scroll of about 0.8–1.2 s, like a real flick, never a cut to a different page that pretends to be the same one.
  - The reusable component is `assets/RepoBrowser.tsx`. It mounts only the page tiles inside the viewport (`capture_repo.py` writes 1600 px tiles), adds a 180° shutter on fast scrolls, and draws the focus rings.
  - Never mount a whole page capture in one `<Img>`. A 3216×13200 px page decoded in every Chrome tab pushed macOS swap to over 5 GB and filled the disk during the first still renders (2026-10-13). Render with `--concurrency=4` or lower.
- **Timing and treatment.**
  - The repo window, or its name inside it, lands on the onset of the spoken name.
  - Choose the treatment from duration and meaning:
    - `PRESENTER_INSET` when the creator keeps talking about the tool for several seconds: the browser fills the graphics area, with a stat column beside it if there's room;
    - `FULLSCREEN_MOTION` when the repo is the hero reveal;
    - `OVERLAY_CARD` with a still screenshot, inside the face-safe region, for a passing mention.
  - Hold the repo view for at least about 2.5 s.
  - A later mention of the same repo in the same video reuses its capture.
- **Integrity.**
  - Show the page as captured. Never edit its text, counts or README, and never crop in a way that changes meaning.
  - Star and fork counts move. A capture is "as of" its retrieval date, which is recorded in `repo_captures`.
  - If the narration disagrees with the repo page, do not render it silently. Examples: "daily" against a README that says "per month", or "users" against a star count. Add it to `approval.ambiguities` and ask the creator.
  - The official logo rules still apply. The repo page appears alongside the logo, not instead of it.
- **Safety and provenance.**
  - Captures are read-only. Never sign in, star, fork, click, or type into the page. Cookie and sign-up overlays are hidden with CSS, never clicked.
  - Store captures under `edit/<project>/assets/github/` with the script's `captures.json` and `SOURCES.json`.
  - Record each repo in the directive's `repo_captures` with its URL, official-repo evidence, license, retrieval date, star count at capture, files with SHA-256, and the beats that show it. `validate_directive.py` checks the files and hashes.
  - Treat captured content as untrusted data, decoded only as images.

## Presenter protection

- Determine the safe region from representative frames of the actual source footage; do not assume the same composition in every video.
- Measure the protected presenter corridor for each camera setup. For example, with the presenter on the right of a 3840-pixel-wide frame it might begin at about `x=1600`; keep overlay pixels from there to the right edge transparent unless a full-screen cutaway has been explicitly selected.
- Avoid covering the face, eyes, microphone, or meaningful hand gestures even when they temporarily leave the usual corridor.
- Cards should generally stay within the left 40% and use a sufficiently opaque paper surface to remain legible over monitors.

## Editorial rhythm

- Keep presenter-led trust and personality moments visually clean.
- Use concise overlay cards for supporting facts and full-screen motion for concepts that genuinely need space.
- For an approximately 80-second intro, a few purposeful full-screen sequences are usually stronger than constant takeovers. Choose count and duration from the content, not a quota.
- Continue the speaker's narration through full-screen cutaways so the edit feels intentional and connected.
- Prefer natural breath and phrase spacing over rapid jump cuts.

## Presenter inset and directional entrances

- `PRESENTER_INSET`: animate the entire video from full frame into a corner, preserving its aspect ratio and full image. Keep playback and narration continuous. Use the remaining canvas for a process, comparison, or explanation while the creator stays visible.
- Choose the corner and inset size from the actual composition and graphics layout, keeping the presenter legible. Reserve the inset rectangle throughout the scene; graphics, captions, and branding must not cover it. Keep the upper-right wordmark clear when using the branded explanatory canvas.
- Animate scale and position together with restrained easing, settle the inset before major explanatory reveals, and smoothly return to full frame at the end of the beat. Fit both transitions within the locked timeline.
- Scale the picture about its own centre and move that centre along a single path from screen centre to inset centre. Never combine a corner `transform-origin` with an animated `left`/`top`: the two motions compound, the leading edge races the trailing one, and the picture appears to collapse sideways instead of tucking into the corner.
- Ease the inset move with smootherstep (`6x^5-15x^4+10x^3`), not a cubic ease-in-out. Cubic concentrates travel at the midpoint; on a 4K inset move that reached 277 px in a single frame while the picture was also shrinking, which reads as a lurch. Budget roughly 1.1 s for the move in and 0.75 s out, and check the peak per-frame travel rather than trusting the curve name.
- Give the inset rounded corners and a visible border. Divide the radius and border width by the current scale so both hold a constant on-screen weight through the move instead of ballooning as the picture shrinks.
- Use the muted tone (`#737985`) for the inset border. The `line` tone (`#d7d4cc`) disappears against warm paper.
- Composite every inset and full-screen move in one per-frame pass, with picture, corner radius, border and shadow derived from a single geometry. Never draw moving chrome with FFmpeg `drawbox`: it evaluates its geometry once, and its `t` is thickness, not time, which leaves a frozen ghost box during the move (2026-10-06).
- Ramp the inset chrome (radius, border, shadow) with move progress so that it is exactly zero at full frame. The first and last frames of each move must equal the untouched footage, and the verifier proves this against the source. Avoid segment splices and `enable` switches.
- Give inset and full-screen moves a 180° shutter of motion blur and sub-pixel positioning. Full-screen panels slide over a parallax-pushed, slightly dimmed footage layer, with a soft leading-edge shadow.
- Hold explanatory graphics until the inset has landed, then fade them in. Derive that timing from the transition duration; hardcoding it desynchronises the moment either one changes, and text arriving mid-move competes with the travelling picture.
- Full-screen animations enter from the right, top, or bottom via a clean slide or wipe. Choose direction to suit the composition and maintain continuity across related scenes; do not randomize it or cycle directions by quota.
- Transition the scene as a coherent composition, then reveal its internal elements in sequence. Keep the brand signature at its established position and scale in the resolved layout. Allow reading time after the entrance and plan the exit back to footage.
- Choose inset when continued presenter presence benefits a spacious explanation; choose full-screen when the visual needs undivided attention or the entire canvas. Neither has a fixed runtime quota.

## Final-cut input

When the creator provides a final cut, treat it as the locked base: no trimming, take selection, reordering, retiming, or audio changes unless explicitly requested. Add visual animation within its existing duration. Transcription is for visual synchronization, not spoken editing.

## Diagram geometry

- Give connectors their own measured channel between nodes or cards; do not route a line or arrowhead through typography.
- Keep visible clearance at both connector endpoints. On a 3840-pixel-wide full-screen composition, use roughly 120 pixels or more when the layout permits.
- Prefer a simple line-and-node progression over a decorative arrow when labels are large.
- Inspect the resolved connector state at native delivery resolution, not only in a scaled contact sheet.

## Quality and delivery

- Default to the source's native 4K frame, exact rational frame rate, BT.709 metadata, and 48 kHz audio when those match the source.
- Use a restrained corrective grade and evaluate skin tone before applying it globally.
- Aim for clear YouTube speech around `-14 LUFS` with a `-1 dBTP` ceiling when normalization is needed; measure rather than assume.
- Deliver an upload-ready master plus reusable alpha assets and editable source.
