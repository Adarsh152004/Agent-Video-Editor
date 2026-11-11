#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any


ALLOWED_TREATMENTS = {
    "CLEAN_PRESENTER",
    "OVERLAY_CARD",
    "FULLSCREEN_MOTION",
    "PRESENTER_INSET",
    "SELECTIVE_TEXT",
    "TRANSITION",
}

ALLOWED_THEMES = {
    "personal",
    "lime-tech",
    "navy-amber",
    "dark-sketch",
    "warm-paper",
    "blackboard-style",
    "colorful-purple",
    "clean-tech",
}

SEGMENT_KINDS = {"camera", "voiceover"}
CORNER_MOVE = "corner-move"
MIN_CORNER_HOLD_S = 20.0
TOLERANCE_S = 0.05
RECT_KEYS = ("x", "y", "width", "height")

REQUIRED_BEAT_FIELDS = {
    "id",
    "start",
    "end",
    "spoken_text",
    "role",
    "treatment",
    "purpose",
    "on_screen_copy",
    "reveal_sync",
    "transition_in",
    "transition_out",
    "audio_continuity",
    "rationale",
    "review_status",
}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def overlaps(a: dict[str, Any], b: dict[str, Any]) -> bool:
    return not (
        a["x"] + a["width"] <= b["x"]
        or b["x"] + b["width"] <= a["x"]
        or a["y"] + a["height"] <= b["y"]
        or b["y"] + b["height"] <= a["y"]
    )


def is_rect(value: Any) -> bool:
    return isinstance(value, dict) and all(finite_number(value.get(k)) for k in RECT_KEYS) and value["width"] > 0 and value["height"] > 0


def is_sha256(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(c in "0123456789abcdef" for c in value)


def overlap_s(start: float, end: float, intervals: list[tuple[float, float]]) -> float:
    return sum(max(0.0, min(end, b) - max(start, a)) for a, b in intervals)


def validate_segments(data: dict[str, Any], duration: float, errors: list[str]) -> list[tuple[float, float]]:
    """Check the optional segment list of an assembled long-form program and return its voiceover intervals."""
    segments = data.get("segments")
    if segments is None:
        return []
    if not isinstance(segments, list) or not segments:
        fail(errors, "segments must be a non-empty array when present")
        return []
    voiceover: list[tuple[float, float]] = []
    cursor = 0.0
    for index, segment in enumerate(segments):
        prefix = f"segments[{index}]"
        if not isinstance(segment, dict):
            fail(errors, f"{prefix} must be an object")
            continue
        if segment.get("kind") not in SEGMENT_KINDS:
            fail(errors, f"{prefix}.kind must be one of {sorted(SEGMENT_KINDS)}")
        if not isinstance(segment.get("path"), str) or not segment["path"]:
            fail(errors, f"{prefix}.path must be a non-empty string")
        if not is_sha256(segment.get("sha256")):
            fail(errors, f"{prefix}.sha256 must be 64 lowercase hexadecimal characters")
        start, end = segment.get("start"), segment.get("end")
        if not finite_number(start) or not finite_number(end) or not start < end:
            fail(errors, f"{prefix} must satisfy start < end")
            continue
        if abs(start - cursor) > TOLERANCE_S:
            fail(errors, f"{prefix} must start where the previous segment ends ({cursor:.3f}s), got {start:.3f}s")
        cursor = end
        if segment.get("kind") == "voiceover":
            voiceover.append((start, end))
    if duration and abs(cursor - duration) > TOLERANCE_S:
        fail(errors, f"segments end at {cursor:.3f}s but source.duration_s is {duration:.3f}s")
    return voiceover


def validate(path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read valid JSON: {exc}"], warnings

    if data.get("version") != 1:
        fail(errors, "version must be 1")
    if not isinstance(data.get("project"), str) or not data["project"].strip():
        fail(errors, "project must be a non-empty string")

    theme = data.get("theme", "warm-paper")
    if not isinstance(theme, str) or theme not in ALLOWED_THEMES:
        fail(errors, f"theme must be one of {sorted(ALLOWED_THEMES)}, got {theme!r}")

    source = data.get("source")
    if not isinstance(source, dict):
        fail(errors, "source must be an object")
        return errors, warnings
    duration = source.get("duration_s")
    if not finite_number(duration) or duration <= 0:
        fail(errors, "source.duration_s must be a positive finite number")
        duration = 0
    for key in ("width", "height"):
        if not isinstance(source.get(key), int) or source[key] <= 0:
            fail(errors, f"source.{key} must be a positive integer")
    if not is_sha256(source.get("sha256")):
        fail(errors, "source.sha256 must be 64 lowercase hexadecimal characters")
    # Layout coordinates live in the delivery frame, which may differ from the source (e.g. 1080p camera in a 4K master).
    delivery = data.get("delivery") if isinstance(data.get("delivery"), dict) else {}
    frame_width, frame_height = delivery.get("width", source.get("width")), delivery.get("height", source.get("height"))
    voiceover = validate_segments(data, duration, errors)

    approval = data.get("approval")
    if not isinstance(approval, dict):
        fail(errors, "approval must be an object")
    elif approval.get("status") != "approved":
        fail(errors, "approval.status must be approved before execution")
    elif approval.get("ambiguities"):
        fail(errors, "approval.ambiguities must be empty before execution")

    regions = data.get("protected_regions", [])
    if not isinstance(regions, list):
        fail(errors, "protected_regions must be an array")
        regions = []
    for index, region in enumerate(regions):
        if not isinstance(region, dict) or not all(finite_number(region.get(k)) for k in ("x", "y", "width", "height")):
            fail(errors, f"protected_regions[{index}] must contain numeric x, y, width, and height")

    beats = data.get("beats")
    if not isinstance(beats, list) or not beats:
        fail(errors, "beats must be a non-empty array")
        return errors, warnings

    previous_end = 0.0
    previous_beat: dict[str, Any] | None = None
    ids: set[str] = set()
    fullscreen_camera_s = 0.0
    fullscreen_intervals: list[tuple[float, float]] = []
    for index, beat in enumerate(beats):
        prefix = f"beats[{index}]"
        if not isinstance(beat, dict):
            fail(errors, f"{prefix} must be an object")
            continue
        missing = sorted(REQUIRED_BEAT_FIELDS - beat.keys())
        if missing:
            fail(errors, f"{prefix} is missing: {', '.join(missing)}")
        beat_id = beat.get("id")
        if not isinstance(beat_id, str) or not beat_id:
            fail(errors, f"{prefix}.id must be a non-empty string")
        elif beat_id in ids:
            fail(errors, f"duplicate beat id: {beat_id}")
        else:
            ids.add(beat_id)
        start, end = beat.get("start"), beat.get("end")
        if not finite_number(start) or not finite_number(end) or not (0 <= start < end <= duration):
            fail(errors, f"{prefix} must satisfy 0 <= start < end <= source duration")
            continue
        if start < previous_end - 1e-6:
            fail(errors, f"{prefix} overlaps the previous beat")
        previous_end = end
        treatment = beat.get("treatment")
        if treatment not in ALLOWED_TREATMENTS:
            fail(errors, f"{prefix}.treatment is invalid: {treatment!r}")
        if beat.get("review_status") != "approved":
            fail(errors, f"{prefix}.review_status must be approved before execution")
        if beat.get("audio_continuity") not in {"continuous", "approved-edit"}:
            fail(errors, f"{prefix}.audio_continuity must be continuous or approved-edit")
        copy = beat.get("on_screen_copy")
        if not isinstance(copy, list) or not all(isinstance(item, str) for item in copy):
            fail(errors, f"{prefix}.on_screen_copy must be an array of strings")
        sync = beat.get("reveal_sync")
        if not isinstance(sync, list):
            fail(errors, f"{prefix}.reveal_sync must be an array")
        else:
            for sync_index, event in enumerate(sync):
                event_time = event.get("time") if isinstance(event, dict) else None
                if not finite_number(event_time) or not start <= event_time <= end:
                    fail(errors, f"{prefix}.reveal_sync[{sync_index}] must fall inside the beat")
        if treatment == "FULLSCREEN_MOTION":
            fullscreen_camera_s += (end - start) - overlap_s(start, end, voiceover)
            fullscreen_intervals.append((start, end))
        elif overlap_s(start, end, voiceover) > TOLERANCE_S:
            fail(errors, f"{prefix} overlaps an audio-only segment; only FULLSCREEN_MOTION is allowed there")
        if treatment in {"OVERLAY_CARD", "SELECTIVE_TEXT"}:
            layout = beat.get("layout")
            if not isinstance(layout, dict) or not all(finite_number(layout.get(k)) for k in RECT_KEYS):
                fail(errors, f"{prefix}.layout must contain numeric x, y, width, and height")
            else:
                for region in regions:
                    if isinstance(region, dict) and all(finite_number(region.get(k)) for k in RECT_KEYS) and overlaps(layout, region):
                        fail(errors, f"{prefix}.layout intersects protected region {region.get('name', '<unnamed>')}")
        if treatment == "PRESENTER_INSET":
            inset = beat.get("presenter_layout")
            if not is_rect(inset):
                fail(errors, f"{prefix}.presenter_layout must contain positive numeric x, y, width, and height")
            else:
                if isinstance(frame_width, int) and isinstance(frame_height, int) and (
                    inset["x"] < 0 or inset["y"] < 0 or inset["x"] + inset["width"] > frame_width or inset["y"] + inset["height"] > frame_height
                ):
                    fail(errors, f"{prefix}.presenter_layout must lie inside the delivery frame")
                if is_rect(beat.get("layout")) and overlaps(beat["layout"], inset):
                    fail(errors, f"{prefix}.layout intersects the presenter inset")

        # A corner move is two contiguous inset beats, joined by "corner-move" on both sides.
        moves_in = beat.get("transition_in") == CORNER_MOVE
        prev_moves_out = previous_beat is not None and previous_beat.get("transition_out") == CORNER_MOVE
        if moves_in or prev_moves_out:
            prev = previous_beat or {}
            if not (moves_in and prev_moves_out):
                fail(errors, f"{prefix} corner move needs transition_out \"{CORNER_MOVE}\" on the previous beat and transition_in \"{CORNER_MOVE}\" on this one")
            elif treatment != "PRESENTER_INSET" or prev.get("treatment") != "PRESENTER_INSET":
                fail(errors, f"{prefix} corner move must join two PRESENTER_INSET beats")
            elif abs(start - prev["end"]) > 1e-6:
                fail(errors, f"{prefix} corner move must start exactly where the previous inset beat ends")
            elif is_rect(prev.get("presenter_layout")) and is_rect(beat.get("presenter_layout")):
                a, b = prev["presenter_layout"], beat["presenter_layout"]
                if (a["width"], a["height"]) != (b["width"], b["height"]):
                    fail(errors, f"{prefix} corner move must keep the inset size; only its position may change")
                elif (a["x"], a["y"]) == (b["x"], b["y"]):
                    fail(errors, f"{prefix} corner move must change the inset position")
        if treatment == "PRESENTER_INSET" and (moves_in or beat.get("transition_out") == CORNER_MOVE) and end - start < MIN_CORNER_HOLD_S:
            warnings.append(f"{prefix} holds its corner for {end - start:.1f}s; aim for at least {MIN_CORNER_HOLD_S:.0f}s between corner moves")
        previous_beat = beat

    for vo_start, vo_end in voiceover:
        covered = overlap_s(vo_start, vo_end, fullscreen_intervals)
        if vo_end - vo_start - covered > TOLERANCE_S:
            fail(errors, f"audio-only segment {vo_start:.3f}-{vo_end:.3f}s is not fully covered by FULLSCREEN_MOTION beats ({vo_end - vo_start - covered:.2f}s uncovered)")

    camera_s = duration - sum(b - a for a, b in voiceover)
    if camera_s > 0 and fullscreen_camera_s / camera_s > 0.4:
        warnings.append("full-screen motion exceeds 40% of camera runtime; verify that presenter presence remains intentional")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a Presenter Long-Form Editor directive")
    parser.add_argument("directive", type=Path)
    args = parser.parse_args()
    errors, warnings = validate(args.directive)
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1
    digest = hashlib.sha256(args.directive.read_bytes()).hexdigest()
    print(f"valid directive: {args.directive}")
    print(f"sha256: {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
