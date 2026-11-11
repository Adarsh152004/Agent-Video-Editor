# Editorial directive stage

Create the directive after word-timestamped transcription and before motion design. Its job is to separate editorial judgment from execution.

## Analysis order

1. Group words into complete semantic beats using sentence completion, pauses, delivery, and speaker intent.
2. Mark the role of each beat: hook, context, problem, promise, reveal, definition, process, proof, reassurance, or CTA.
3. Decide whether the beat benefits from visuals. A clean presenter moment is an affirmative editorial choice, not a missing effect.
4. Select exactly one primary treatment per timeline interval: `CLEAN_PRESENTER`, `OVERLAY_CARD`, `FULLSCREEN_MOTION`, `PRESENTER_INSET`, `SELECTIVE_TEXT`, or `TRANSITION`.
5. Define on-screen copy, layout, reveal timing, exit timing, and the relevant spoken payoff word.
6. Mark every company, brand, product, or tool named in a beat. Fetch its official logo per "Brand and company logos" in `brand-system.md`, list it in `brand_logos`, and sync its reveal to the spoken name. Never show a brand as a typed name or a generic icon.
7. Mark every GitHub repository or open-source tool named in a beat. Confirm its official upstream repo, capture it with `scripts/capture_repo.py`, list it in `repo_captures`, and plan the screen-recording camera: which part of the page shows on which spoken word. Follow "GitHub repos and open-source tools" in `brand-system.md`.
8. Note ambiguity and approval requirements. Never use a graphic to resolve uncertain meaning. A narration claim that the repo page contradicts is an ambiguity.

## Treatment rubric

- `CLEAN_PRESENTER`: personal promise, credibility, emotion, direct address, or a moment where gestures carry the idea.
- `OVERLAY_CARD`: a short list, definition, label, number, or supporting structure that can live beside the presenter.
- `FULLSCREEN_MOTION`: a sequence, system, transformation, comparison, roadmap, or hero announcement requiring a larger canvas.
- `PRESENTER_INSET`: a spacious explanation that benefits from continued presenter presence; animate the entire video into a corner while graphics occupy the remaining canvas.
- `SELECTIVE_TEXT`: one short phrase whose timing is the effect.
- `TRANSITION`: a visual bridge between adjacent approved treatments; it must not invent a new message.

## Locked-cut visual planning

For a supplied final cut, preserve the source timeline and audio; do not propose cuts. For each beat, explain the viewer benefit and treatment rationale before designing. Record exact spoken passage, concise on-screen copy, reveal timing, reading hold, and return to presenter.

`PRESENTER_INSET` is a primary treatment, not a separate transition interval. Record its destination rectangle as `presenter_layout`, graphics region as `layout`, and the scale/move entrance and return in `transition_in` and `transition_out`. Keep both regions within the delivery frame and non-overlapping, and inspect the animated path on the actual footage. The original full-frame presenter region does not describe the transformed inset; protect the entire inset in this mode.

For `FULLSCREEN_MOTION`, specify `slide-from-right`, `slide-from-top`, `slide-from-bottom`, or the corresponding `wipe-from-*` in `transition_in`; describe the exit in `transition_out`. Fit entrances, holds, and exits within the beat with uninterrupted narration.

Report each primary treatment's share of total runtime in the treatment document, counting unassigned gaps as clean presenter. Count inset and scene entrance/exit time within their owning treatment, without double counting. Percentages describe the plan; they are not quotas.

## JSON shape

```json
{
  "version": 1,
  "project": "descriptive-project-name",
  "theme": "personal",
  "source": {
    "path": "/absolute/path/to/source.mp4",
    "sha256": "64-character lowercase SHA-256",
    "width": 3840,
    "height": 2160,
    "fps": "30000/1001",
    "duration_s": 80.547
  },
  "approval": {
    "status": "approved",
    "approved_scope": "Plain-language summary of what was approved",
    "ambiguities": []
  },
  "protected_regions": [
    {"name": "presenter", "x": 1600, "y": 0, "width": 2240, "height": 2160}
  ],
  "brand_logos": [
    {
      "brand": "OpenAI",
      "source_url": "https://openai.com/brand/",
      "retrieved": "2026-10-11",
      "path": "assets/logos/openai-wordmark-black.svg",
      "sha256": "64-character lowercase SHA-256 of the stored file",
      "variant": "wordmark, black on light",
      "beats": ["beat-01"]
    }
  ],
  "repo_captures": [
    {
      "repo": "Sponsor 7",
      "url": "https://github.com/sponsor-7/sponsor-7",
      "official_evidence": "GitHub API: fork false, homepage sponsor-7.example",
      "license": "MIT",
      "retrieved": "2026-10-13",
      "kind": "page-capture",
      "stars_at_capture": "76k",
      "files": [
        {"path": "assets/github/sponsor-7-page.png", "sha256": "64-character lowercase SHA-256 of the stored file"}
      ],
      "beats": ["beat-04"]
    }
  ],
  "beats": [
    {
      "id": "beat-01",
      "start": 0.35,
      "end": 7.2,
      "spoken_text": "Verbatim or tightly faithful transcript excerpt",
      "role": "hook",
      "treatment": "OVERLAY_CARD",
      "purpose": "Show the outcome sequence without competing with the presenter",
      "on_screen_copy": ["BUILD", "LAUNCH", "PAYING CUSTOMERS"],
      "layout": {"x": 150, "y": 160, "width": 1320, "height": 720},
      "reveal_sync": [{"element": "PAYING CUSTOMERS", "time": 4.3}],
      "transition_in": "fade-rise",
      "transition_out": "fade-up",
      "audio_continuity": "continuous",
      "rationale": "The sequence is concrete and readable beside the presenter",
      "review_status": "approved"
    }
  ]
}
```

## Requirements

- Times use source seconds and must be finite, non-negative, ordered, and within source duration.
- Beats must not overlap. Leave intentional clean-presenter gaps rather than stacking treatments.
- `on_screen_copy` contains concise visual language, not an invented claim.
- Overlay layouts must not intersect protected regions. Full-screen treatments may fill the canvas because they replace the camera visually while narration continues.
- Reveal events must fall inside their beat.
- An unresolved ambiguity sets `approval.status` or the affected beat's `review_status` to `pending`; rendering must stop.
- Every brand that is named in a beat or appears in a graphic has a `brand_logos` entry pointing to its official logo file. `path` is absolute or relative to the directive's folder, and `sha256` must match the stored file. A brand without a confirmed official logo is an ambiguity, not a reason to use text.
- A beat that names a brand but deliberately shows no logo states why in its `rationale`.
- Every GitHub repo or open-source tool named in a beat has a `repo_captures` entry. `kind` is `page-capture` (a live capture animated as a screen recording), `screen-recording` (The creator's own recording) or `screenshot` (a still, for a passing mention). Every file's `sha256` must match, and every listed beat must exist and must not be `CLEAN_PRESENTER`.
- A beat that names an open-source tool but deliberately shows no repo page states why in its `rationale`.
- Run `scripts/validate_directive.py editorial-directive.json` before execution.

Also write a brief `director-treatment.md` explaining the visual rhythm, why full-screen moments were selected, how presenter visibility is protected, and what remains intentionally clean.
