# Presenter long-form brand system

Use this reference for design and recurring editorial preferences. Adapt the themes, wordmark and presenter geometry to your own channel.

## Visual Themes

Projects support eight distinct visual themes selectable at the beginning of each edit:

### 0. `clean-tech` (Clean Tech / Kinetic Type — Studio 3D Style)
- **Aesthetic**: Calm, bright product-explainer look with kinetic typography, white floating UI cards, and electric blue emphasis.
- **Palette**:
  - Surface: Cool off-white `#F5F6F8` with a slowly drifting dot grid (pitch 32px, radius 1.4px, `#0D0F14` at 8.5% opacity), faint blue radial glow top right (`rgba(47,91,255,0.10)`), faint green glow bottom left (`rgba(24,180,107,0.05)`), and light outer vignette.
  - Ink (primary statements): `#0D0F14`
  - Muted secondary text: `#6B7280`
  - Faint labels: `#9AA1AD`
  - Structural card border: `#E3E6EC`
  - Key Accent: Electric Blue `#2F5BFF` (soft fill: `#E8EDFF`)
  - Status Complete: Green `#18B46B` (soft fill: `#E3F6EC`)
  - Card surface: `#FFFFFF` with soft diffused drop shadows (`rgba(13,15,40,0.13)` blur 44px, offsetY 16px).
- **Typography**:
  - Statements / Headlines: Inter Tight 800 (78px to 110px in 1080p, 150px+ in 4K). Never all-caps.
  - Card Body / Titles: Inter Tight 500 to 700 (26px to 36px in 1080p).
  - Small Labels & Badges: JetBrains Mono 700 in uppercase with letter-spacing (16px to 26px in 1080p, letter-spacing 2-4px).
- **Motion & Kinetic Type**:
  - Words rise from behind a mask line with exponential ease-out (`outExpo`).
  - Key focus words receive an electric blue pill highlight behind them (`pillBehind`) with text shifting from dark ink to `#FFFFFF`.
  - Floating UI cards: Prompt card with typing effect and blipping send button; process nodes that pop in with slight overshoot (`back` ease); cyclic flow arcs with travelling blue pulse dots; step counters that tick rapidly; checklist items with animated green checkmarks (`checkMark`).
  - Camera: Gentle push-in over each scene (`cam`) with landing bumps on pill arrivals.
  - Scene cuts: Clean horizontal pushes (`push`) or zoom-through cuts (`zoom`) into detailed cards.

### 1. `personal` (Signature — default for intros)
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

### 4. `dark-sketch` (Dark Sketch Explainer)
- **Aesthetic**: Hand-drawn whiteboard explainer on a dark canvas. Calm and teacherly: one question as the scene title, then a few hand-drawn elements built up beneath it.
- **Palette** (sampled from the reference):
  - Canvas: Charcoal `#181A1C`, flat. No grid, gradient, texture, or vignette.
  - Ink (text and line art): Soft white `#E2E2E2`, never pure white.
  - Blue `#578AE0`: flat fills inside line art and icon outlines. Use `#6792D1` for blue text.
  - Orange `#CB9370`: emphasis underlines, arrows, and orange text.
  - No cards, panels, or shadows. Everything sits directly on the canvas.
- **Typography**:
  - Typeface: Shantell Sans, weight 700, for everything including code. Load it with `@remotion/google-fonts/ShantellSans`. Matched against the reference by rendering it side by side.
  - 4K canvas (3840w): scene title 130px, centred key statement 124px, body and list items 96px, small labels 74px.
  - 1080p canvas: half of each.
  - Sentence case. No all-caps headings.
- **Layout** (4K):
  - Scene title top-left at x≈300 with its cap top at y≈210. It stays in place while the content beneath it changes.
  - Lists sit left-aligned under the title, bullets at x≈460, line pitch ≈180px.
  - A key statement sits centred, slightly above the vertical middle, in at most two lines.
  - Explanations use two columns: a line-art illustration on the left (x≈290–940) and short text or code on the right (from x≈2090).
  - Small labels sit directly under or beside the thing they name.
- **Line art and ornaments**:
  - Simple hand-drawn illustrations and icons: ~12px soft-white strokes with rounded joins, plus a few flat blue fills (for example, alternating awning stripes). Small icons may be drawn as blue outlines. Lines may wobble slightly, like a careful hand rather than a messy one.
  - Emphasis underline: one orange brush stroke under the key phrase only, about 16px at its thickest, tapering to a point at the right end, about 20px below the baseline.
  - Arrows: thin orange hand-drawn arrows between related labels.
  - Code: set in the same font. Colour it by meaning as the narration reaches each part (for example, the condition turns blue, then the action turns orange), not with editor syntax highlighting.
- **Motion grammar** (shared by `dark-sketch` and `warm-paper`):
  - Inside a full-screen sequence, each element appears instantly, in one frame, on its spoken cue. No fade, rise, overshoot, typewriter, draw-on, or drift.
  - Scene changes inside the sequence are hard cuts. Emphasis is a one-frame colour change or an underline appearing.
  - Between topics, cut to the empty canvas for about 1.3 s before the next title appears. This is the theme's breathing beat.
  - Static holds are part of this style, so the secondary-motion rules under "Visual character" do not apply to the sketch themes. Keep the build cadence dense instead: in the reference, a new element or emphasis lands every 1.2–6.2 s (median 2.5 s). When a hold would run past about 6 s, add a narration-synced build (a label, an underline, a colour change) rather than ambient motion.
  - The standing entrance rules still govern the boundary with footage: the full-screen canvas enters from the right, top, or bottom with a slide or wipe, and `PRESENTER_INSET` moves as specified below. Only what happens inside the canvas is instant.
- **Signature**: the optional wordmark (see "Brand signature") in Shantell Sans, first word in blue `#578AE0` and the rest in ink, upper-right, aligned to the title's cap line with a right margin matching the title's left margin (~300px).
- **Inset border**: keep `#737985`; it stays visible on charcoal.

### 5. `warm-paper` (Warm Paper Sketch — default for long-form)
- **Aesthetic**: The sketch explainer on warm paper. Light and calm, and the sketch theme closest to the `personal` brand: handwritten titles over clean body text.
- **Palette**:
  - Canvas: Warm paper `#F5F3EE`, flat.
  - Ink (titles, body, line art): `#1D2025`.
  - Muted (labels): `#6E737C`.
  - Accent: Cobalt `#3659E3` for bullets, icon fills, code conditions, and the first word of the wordmark.
  - Emphasis: Marker yellow `#FFD84D`, used only as a highlighter behind text.
  - Cards: White `#FFFFFF` with an ink border. No shadows.
- **Typography**:
  - Titles and key statements: Shantell Sans 700 (`@remotion/google-fonts/ShantellSans`).
  - Body and list items: Avenir Next 500. Labels: Avenir Next 600 in the muted tone.
  - Code: JetBrains Mono 500 (`@remotion/google-fonts/JetBrainsMono`), with ligatures off (`font-variant-ligatures: none`, `"liga" 0, "calt" 0`), so code reads exactly as typed. Otherwise `>=` renders as `≥` and `||` as one glyph.
  - 4K canvas (3840w): title 130px, key statement 124px, body 92px, labels 69px, code 77px, wordmark 58px. 1080p: half of each.
  - Sentence case.
- **Layout**: the same grid as `dark-sketch`: title top-left at x≈300 with its cap top at y≈210, list bullets at x≈460 with ≈180px pitch, centred key statements, and two-column explanations.
- **Ornaments**:
  - Bullets: short cobalt dashes, about 48×12px at 4K, tilted about -4°.
  - Line art: ~12px ink strokes with rounded joins and flat cobalt fills.
  - Cards: white, 12px ink border, ≈46px corner radius, optional speech tail.
  - Emphasis: a yellow marker stroke behind the lower half of the key phrase, extending about 0.18em past each end, with slightly uneven rounded ends and a -0.8° tilt. In code, the action is highlighted the same way while the condition turns cobalt.
  - Put the emphasised phrase on the last line of its text block so the mark never collides with the line below.
  - **Code windows**: show code in a dark IDE-style window, not as bare text.
    - Ink `#1D2025` body, 30px corner radius, and an 84px title bar `#2B2F37`.
    - Three window dots (`#FF5F57`, `#FEBC2E`, `#28C840`) and a file tab in JetBrains Mono 44px `#C9CDD4`, e.g. `store.js`.
    - Line numbers in `#6B717B`. Code text `#E8EAED`, 64–72px, ligatures off.
    - Light up meaning on cue: conditions in light cobalt `#8FA8FF` (the theme cobalt is too dark on the editor), and the action with a full-height yellow highlight behind ink text. Don't use the half-height marker inside the editor: it leaves the top of ink glyphs on the ink background, where they are invisible.
- **Presenter mask**: crop the camera to the presenter in a shape so no dead wall shows. A circle suits an angled tutorial camera, for example a laptop camera while the presenter looks at another screen.
  - **No full-frame with such a camera**, when the creator asks for it: the angle only suits tutorials because the presenter looks at another screen. The masked window replaces the full-frame presenter everywhere, and the stage size is the "presenter-led" mode.
  - Derive the crop from a whole-section face pass, and keep it static. Record the crop in the project (for example x540 y80 1000×1000 of a 1080p frame), and check that each new recording's face pass still sits inside it.
  - Cap the upscale at 1.2x.
  - Chrome: a 16px white mat, then an 8px ink ring `#1D2025`, constant on screen, with no shadow. This replaces the `#737985` rounded-inset border.
  - Window states at 4K:
    - `stage` circle: 1200px at (1960, 510).
    - `corner` circle: 800px at (2920, 1240).
    - `below`: off-canvas at (2920, 2260), for full-canvas moments.
    - Moves: smootherstep about the centre path, 1.1–1.3 s, with a 180° shutter.
  - The corner size comes from the measured clearance to the lowest corner-side graphic. Reflow graphics upward to make room rather than shrinking the presenter. Err toward a larger corner: smaller windows (540, then 690) were rejected in favour of 800.
  - Side: if the presenter looks screen-left at a second monitor, the window stays on the right and faces the graphics. Variety comes from stage ↔ corner ↔ off-canvas, not from left/right swaps.
  - Clearances: at stage, graphics stay at x ≤ 1856. In the corner, graphics stay at x ≤ 2780, or above y ≈ 1136 further right. The compositor audits an 80px clearance on every frame.
  - The canvas clears when a move starts, and new graphics wait for the landing. A column already clear of the path may stay during the move.
  - A rhythm that works:
    - stage for claims, definitions, story beats and the section's opening and closing;
    - corner (20–30 s holds) for comparisons, diagrams and code;
    - one full-canvas moment of about 15–20 s per 1.5–3 min section.

    Each section opens and ends at the stage size, so sections join cleanly.
- **Motion grammar**: shared with `dark-sketch`, above.
- **Signature**: the optional wordmark in Shantell Sans 700, first word in cobalt and the rest in ink, upper-right, aligned to the title's cap line.
- **Inset border**: `#737985`, as in `personal`, for an uncropped rectangular inset only. A masked presenter uses the white mat and ink ring above.

### 6. `blackboard-style` (Blackboard Live Pen)
- **Aesthetic**: A live tablet-pen explainer on pure black. Diagrams grow as the narration goes, in a few bright inks, and the view moves over the canvas like a camera. It uses an infinite-canvas camera (below).
- **Palette** (sampled from the reference):
  - Canvas: pure black `#000000`, flat.
  - Ink: white `#F8F8F8` for drawings and main labels. Grey `#B4B4B4` for side notes.
  - Inks by meaning: blue `#5454FC` (fills; `#7C7CFC` for blue text), green `#6CFC6C`, yellow `#FCFC84`, pink `#EC6CEC`, orange `#E49C3C` underlines, bracket red `#E46C6C`.
  - Pointer: a solid red `#F0302A` block arrow that points at the thing being discussed.
- **Typography**: Gochi Hand (`@remotion/google-fonts/GochiHand`) for everything; it was the closest of six handwriting fonts to the reference handwriting. At 4K: title 130px, labels 84–92px, side notes 72–88px, wordmark 66px. Sentence case.
- **Line art**: simple monoline drawings (~11px strokes at 4K, rounded joins) with flat blue or green fills, curved hand-drawn arrows, a blue/green globe, brackets around groups. Brand icons follow "Brand icons" below: white tile on black, or the brand's own white wordmark bare.
- **Motion grammar** (differs from the sketch themes): every element is written or drawn on from its spoken cue, like a live pen. Text writes left to right at about 24–32 characters per second. Line art traces in 0.5–0.7 s, and fills settle in at the end. Logos appear in one frame. The red pointer pops in with a 0.25 s nudge toward its target.
- **Camera (option C)**: each scene is a canvas larger than the screen. It opens zoomed in (about 1.25–1.35×, anchored at the title corner) on the first drawing, pulls out to 1× as the diagram grows, and pans to a new area (for example down to a statistic) instead of cutting. Camera moves use smootherstep over 1.2 s and are recorded per beat in the directive's `camera` field. At every camera state the visible graphics must respect the window clearances.
- **Presenter**: the circle window with its stage, corner and below states, a 16px `#E2E2E2` mat and an 8px `#737985` ring. The crop is measured per recording.
- **Signature**: the optional wordmark in Gochi Hand, first word in `#7C7CFC`, upper-right, fixed in screen space (never moved by the camera).

### 7. `colorful-purple` (Hand-Drawn Infographic)
- **Aesthetic**: A hand-drawn infographic on white paper. Bold caps headline, marker handwriting, boxes with a flat colour fill shifted off a wobbly ink outline, a lavender highlight on the key row, and a mint callout pill. Generate the paper texture procedurally (a faint crumple and grain).
- **Palette**:
  - Canvas: near-white paper with only a whisper of crumple and grain (`paper.jpg`, mean ≈ 249). A visible crumple is too loud; never make it louder.
  - Headline: line 1 black `#1D1D1D`, line 2 periwinkle `#8B97EE`. Grey headlines were rejected.
  - Ink `#222222` for hand text, outlines, arrows and icons.
  - Box fills: coral `#EE8E72` and blue `#A2AEF5`, alternating by meaning.
  - Notes: green `#1E7B46` hand text (labels on arrows, figures).
  - Highlight row: lavender `#CCD2F6` band. Callout: mint `#D4F2CB` pill with deep green `#17462B` text. Accent underline: coral.
- **Typography**: headline Archivo Black caps (`@remotion/google-fonts/ArchivoBlack`), 118px at 4K, two lines centred. Hand text Schoolbell with a 2.2% text-stroke (closest of nine handwriting fonts to the reference), labels 80–84px. Callout pill text Fredoka 600, 92px, sentence case.
- **Line art**: one-stroke hand-drawn shapes (`roughRect`, `roughCircle`): bowed sides, uneven corners, the pen overshooting its start; ~13px ink strokes at 4K, round joins. Boxes are flat fills offset about 12px up-left of the drawn outline. Icons are simple ink monoline drawings inside the boxes. Arrows are gently curved with open heads.
- **Motion grammar**: as `blackboard-style`, on spoken cues: text writes on left to right (handwriting ~26 cps, headline 60–70 cps), outlines, icons and arrows trace in 0.4–0.6 s with fills settling in at the end, and the band and pill paint on left to right as marker sweeps (0.45 s, smootherstep). No camera moves by default.
- **Presenter**: the circle window, with a periwinkle disc offset up-left behind it and a hand-drawn ink ring (the box look). No mat. The crop is measured per recording.
- **Signature**: the optional wordmark in Schoolbell, first word in periwinkle, centred below the circle window.

---

## Visual character

These apply to every theme except where the sketch motion grammar (`dark-sketch`, `warm-paper`) overrides them.

- Premium educational/editorial rather than futuristic or game-like.
- Clear hierarchy, minimal chrome, and one focal idea per composition.
- Frame-driven fade-and-rise entrances, line draws, node progressions, and restrained sequencing.
- Avoid gradients unless nearly imperceptible, glossy glassmorphism, neon, particles, emojis, stock icons, fake dashboards, and generic AI imagery.
- **Brand icons**: when the narration names a brand (a company, model or product, such as TypeSafe, OpenAI/GPT, Claude, Gemini or Amazon), show its real, current icon. Don't use a drawn stand-in or generic icon, and don't make it text-only. This is the exception to "stock icons" above.
  - Fetch the latest mark, and confirm it has not been replaced by a rebrand. Amazon's 2012 logo was retired in 2025.
  - Prefer the brand's own site icon or SVG. Fall back to the Wikimedia Commons file of the current mark when the site blocks downloads.
  - Never redraw, distort or restyle a logo. A wordmark may be recoloured only to the brand's own dark-on-light version.
  - In the sketch themes, put square icons on a white tile with an 8px ink border and a corner radius of about 24% of the size, at roughly 64% fill. A disc-shaped icon fills about 84%. The brand name goes underneath as a label.
  - At 4K, tiles are 170–250px. Show wide wordmarks such as Amazon bare, at about 1000px wide.
  - Each icon lands on the word that names it.
  - Keep `SOURCES.json` beside the files with the source URL, date, hash and any recolouring.
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

## Long-form rhythm

- Choose a mode per section, not per sentence:
  - Full-frame presenter: the hook, opinions, stories, links between sections, and the call to action. This is where trust comes from.
  - `PRESENTER_INSET`: explanations of about a minute or more that need space while the creator stays present.
  - `FULLSCREEN_MOTION`: short moments that need the viewer's full attention, and every audio-only section.
- As a starting point, keep about half of the camera runtime full-frame. This is a guide, not a quota.
- Exception: when the creator has ruled out full-frame for a camera setup, the stage-size masked window takes the full-frame role. Roughly balance stage and corner time instead (about 40% each).
- Stay in a mode for a whole idea. Avoid entering and leaving the inset within about 30 s.
- A constant inset suits live demos and screen recordings, where the screen is the subject. With authored graphics it reads as a webinar and forces filler graphics.

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
- Hold explanatory graphics until the inset has landed, then fade them in (in the sketch themes, build them instantly instead). Derive that timing from the transition duration; hardcoding it desynchronises the moment either one changes, and text arriving mid-move competes with the travelling picture.
- Full-screen animations enter from the right, top, or bottom via a clean slide or wipe. Choose direction to suit the composition and maintain continuity across related scenes; do not randomize it or cycle directions by quota.
- Transition the scene as a coherent composition, then reveal its internal elements in sequence. Keep the brand signature at its established position and scale in the resolved layout. Allow reading time after the entrance and plan the exit back to footage.
- Choose inset when continued presenter presence benefits a spacious explanation; choose full-screen when the visual needs undivided attention or the entire canvas. Neither has a fixed runtime quota.

### Corner moves while floating (long-form)

- While the inset floats, move it to another corner every now and then so the screen feels responsive. Tie each move to a new sub-idea or to a layout that needs the other side, never to a timer.
- Hold each corner for at least about 20 s. Roughly one move per 45–90 s of continuous inset time is enough.
- Move only between sentences, never during a narration-synced reveal.
- Use the corners that the scene title and the wordmark leave free. In the sketch themes the title holds the top-left and the wordmark holds the top-right, so the inset moves between bottom-left and bottom-right.
- Keep the inset's size and edge margins identical in every corner, so a move is a pure translation with constant scale and constant chrome. Default at 4K: 960×540 with 120px margins (bottom-left x=120, y=1500; bottom-right x=2760, y=1500). This applies to the uncropped rectangular inset. A masked presenter uses the "Presenter mask" geometry under `warm-paper`.
- When the presenter gestures or looks to one side, prefer the corner from which that gesture points into the graphics. If they look to one side for the whole recording (an angled laptop camera, for example), keep the window on the side they face and skip side swaps. Moving it to the other side would make them look out of frame.
- Mechanics: move the centre along one straight path with smootherstep, in the same single-pass compositor with a 180° shutter. Budget about 1.3 s along the bottom edge (peak ≈127 px/frame at 4K, 29.97 fps), and audit the peak per-frame travel as for every inset move.
- Keep the travel path clear. Prefer moving during the empty-canvas beat between scenes, then build the next scene around the new corner. If graphics stay on screen during the move, none may intersect the band the inset sweeps through.
- While the inset sits in a bottom corner, keep that side's content above y≈1420 at 4K and put anything tall on the other side.
- In the directive, a move is two contiguous `PRESENTER_INSET` beats with the same inset size and different positions, with `transition_out: "corner-move"` on the first and `transition_in: "corner-move"` on the second. The validator checks this.

## Final-cut input

When the creator provides a final cut, treat it as the locked base: no trimming, take selection, reordering, retiming, or audio changes unless explicitly requested. Add visual animation within its existing duration. Transcription is for visual synchronization, not spoken editing. A long-form cut may arrive as several camera and audio-only sections; see "Audio-only sections".

## Audio-only sections

The creator may supply some sections as audio only. Graphics take the full screen for the whole of each such section.

- Ask for the order of camera and audio-only sections if the creator hasn't given it. Assemble them in that order into one locked program without trimming, reordering, or retiming. An audio-only section gets a plain canvas in the theme background for its full duration.
- Hash every segment and the assembled program. `source` describes the assembled program, directive times are program seconds, and `segments` records each piece (see `editorial-directive.md`).
- Cover every second of an audio-only segment with `FULLSCREEN_MOTION` beats. No presenter, inset, overlay, or selective text inside it. The validator enforces this.
- Enter an audio-only section with the standing full-screen entrance (slide or wipe from the right, top, or bottom). Leave it back to full-frame camera, or straight into the inset when the next section opens with an explanation.
- With no face on screen, the canvas carries the section. Keep the build cadence dense (in the sketch themes, a build every 2–6 s) and use the empty-canvas beat between topics.
- Separately recorded voiceover often differs from camera audio in loudness and room tone. Measure each segment. If they differ by more than about 1 LU, propose per-segment gain to the program target and record it in the directive. Do not EQ or denoise without approval. Listen to and inspect every join for clicks.
- The full-screen share warning counts camera time only; audio-only sections are full-screen by design.

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
