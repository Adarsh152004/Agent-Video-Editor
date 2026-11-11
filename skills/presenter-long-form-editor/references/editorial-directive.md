# Editorial directive stage

Create the directive after word-timestamped transcription and before motion design. Its job is to separate editorial judgment from execution.

## Analysis order

1. Group words into complete semantic beats using sentence completion, pauses, delivery, and speaker intent.
2. Mark the role of each beat: hook, context, problem, promise, reveal, definition, process, proof, reassurance, or CTA.
3. Decide whether the beat benefits from visuals. A clean presenter moment is an affirmative editorial choice, not a missing effect.
4. Select exactly one primary treatment per timeline interval: `CLEAN_PRESENTER`, `OVERLAY_CARD`, `FULLSCREEN_MOTION`, `PRESENTER_INSET`, `SELECTIVE_TEXT`, or `TRANSITION`.
5. Define on-screen copy, layout, reveal timing, exit timing, and the relevant spoken payoff word.
6. Note ambiguity and approval requirements. Never use a graphic to resolve uncertain meaning.

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

A corner move while the inset floats is two contiguous `PRESENTER_INSET` beats. Both keep the same `presenter_layout` width and height and change only its position. Set `transition_out` to `corner-move` on the first and `transition_in` to `corner-move` on the second, and describe the path and duration in `rationale`.

Report each primary treatment's share of total runtime in the treatment document, counting unassigned gaps as clean presenter. Count inset and scene entrance/exit time within their owning treatment, without double counting. Percentages describe the plan; they are not quotas. Report audio-only time separately from camera time.

## Segmented long-form input

When the program is assembled from camera and audio-only sections, `source` describes the assembled program and an optional `segments` array records each piece in program order:

```json
"segments": [
  {"id": "seg-01", "kind": "camera", "path": "/absolute/path/part-1.mp4", "sha256": "64-character lowercase SHA-256", "start": 0.0, "end": 312.4},
  {"id": "seg-02", "kind": "voiceover", "path": "/absolute/path/how-it-works.wav", "sha256": "64-character lowercase SHA-256", "start": 312.4, "end": 498.1}
]
```

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
- `PRESENTER_INSET` beats need a `presenter_layout` inside the delivery frame, and their `layout` must not intersect it.
- When the delivery frame differs from the source (for example a 1080p camera in a 4K master), add `"delivery": {"width": 3840, "height": 2160, "fps": "30000/1001"}`. All layout coordinates are in delivery pixels.
- `segments`, when present, are contiguous from 0 to `source.duration_s` with kind `camera` or `voiceover`. Every second of a `voiceover` segment is covered by `FULLSCREEN_MOTION` beats, and no other treatment may overlap it.
- Run `scripts/validate_directive.py editorial-directive.json` before execution.

Also write a brief `director-treatment.md` explaining the visual rhythm, why full-screen moments were selected, how presenter visibility is protected, and what remains intentionally clean.
