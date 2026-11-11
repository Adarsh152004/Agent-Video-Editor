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
    "clean-tech",
}

ALLOWED_CAPTURE_KINDS = {
    "page-capture",
    "screen-recording",
    "screenshot",
}

# Spoken cues that usually mean a repository or open-source tool is being named.
REPO_CUES = ("github", "open source", "open-source", "opensource", "repo")

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

    theme = data.get("theme", "personal")
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
    digest = source.get("sha256")
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        fail(errors, "source.sha256 must be 64 lowercase hexadecimal characters")

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

    logos = data.get("brand_logos", [])
    if not isinstance(logos, list):
        fail(errors, "brand_logos must be an array")
        logos = []
    for index, logo in enumerate(logos):
        prefix = f"brand_logos[{index}]"
        if not isinstance(logo, dict):
            fail(errors, f"{prefix} must be an object")
            continue
        for key in ("brand", "source_url", "retrieved", "path"):
            if not isinstance(logo.get(key), str) or not logo[key].strip():
                fail(errors, f"{prefix}.{key} must be a non-empty string")
        if isinstance(logo.get("source_url"), str) and not logo["source_url"].startswith("https://"):
            fail(errors, f"{prefix}.source_url must be an https URL")
        logo_digest = logo.get("sha256")
        if not isinstance(logo_digest, str) or len(logo_digest) != 64 or any(c not in "0123456789abcdef" for c in logo_digest):
            fail(errors, f"{prefix}.sha256 must be 64 lowercase hexadecimal characters")
            continue
        if isinstance(logo.get("path"), str) and logo["path"].strip():
            logo_path = Path(logo["path"])
            if not logo_path.is_absolute():
                logo_path = path.parent / logo_path
            if not logo_path.is_file():
                fail(errors, f"{prefix}.path does not exist: {logo_path}")
            elif hashlib.sha256(logo_path.read_bytes()).hexdigest() != logo_digest:
                fail(errors, f"{prefix}.sha256 does not match {logo_path}")

    captures = data.get("repo_captures", [])
    if not isinstance(captures, list):
        fail(errors, "repo_captures must be an array")
        captures = []
    for index, cap in enumerate(captures):
        prefix = f"repo_captures[{index}]"
        if not isinstance(cap, dict):
            fail(errors, f"{prefix} must be an object")
            continue
        for key in ("repo", "url", "official_evidence", "retrieved", "kind"):
            if not isinstance(cap.get(key), str) or not cap[key].strip():
                fail(errors, f"{prefix}.{key} must be a non-empty string")
        if isinstance(cap.get("url"), str) and not cap["url"].startswith("https://"):
            fail(errors, f"{prefix}.url must be an https URL")
        if cap.get("kind") not in ALLOWED_CAPTURE_KINDS:
            fail(errors, f"{prefix}.kind must be one of {sorted(ALLOWED_CAPTURE_KINDS)}")
        files = cap.get("files")
        if not isinstance(files, list) or not files:
            fail(errors, f"{prefix}.files must be a non-empty array")
            files = []
        for file_index, entry in enumerate(files):
            file_prefix = f"{prefix}.files[{file_index}]"
            if not isinstance(entry, dict) or not isinstance(entry.get("path"), str) or not entry["path"].strip():
                fail(errors, f"{file_prefix}.path must be a non-empty string")
                continue
            file_digest = entry.get("sha256")
            if not isinstance(file_digest, str) or len(file_digest) != 64 or any(c not in "0123456789abcdef" for c in file_digest):
                fail(errors, f"{file_prefix}.sha256 must be 64 lowercase hexadecimal characters")
                continue
            file_path = Path(entry["path"])
            if not file_path.is_absolute():
                file_path = path.parent / file_path
            if not file_path.is_file():
                fail(errors, f"{file_prefix}.path does not exist: {file_path}")
            elif hashlib.sha256(file_path.read_bytes()).hexdigest() != file_digest:
                fail(errors, f"{file_prefix}.sha256 does not match {file_path}")
        if not isinstance(cap.get("beats"), list) or not cap["beats"]:
            fail(errors, f"{prefix}.beats must name at least one beat that shows the repo")

    beats = data.get("beats")
    if not isinstance(beats, list) or not beats:
        fail(errors, "beats must be a non-empty array")
        return errors, warnings

    previous_end = 0.0
    ids: set[str] = set()
    fullscreen_duration = 0.0
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
            fullscreen_duration += end - start
        if treatment in {"OVERLAY_CARD", "SELECTIVE_TEXT"}:
            layout = beat.get("layout")
            if not isinstance(layout, dict) or not all(finite_number(layout.get(k)) for k in ("x", "y", "width", "height")):
                fail(errors, f"{prefix}.layout must contain numeric x, y, width, and height")
            else:
                for region in regions:
                    if isinstance(region, dict) and all(finite_number(region.get(k)) for k in ("x", "y", "width", "height")) and overlaps(layout, region):
                        fail(errors, f"{prefix}.layout intersects protected region {region.get('name', '<unnamed>')}")

    treatments = {b.get("id"): b.get("treatment") for b in beats if isinstance(b, dict)}
    for index, cap in enumerate(captures):
        if not isinstance(cap, dict) or not isinstance(cap.get("beats"), list):
            continue
        for beat_id in cap["beats"]:
            if beat_id not in treatments:
                fail(errors, f"repo_captures[{index}] names unknown beat {beat_id!r}")
            elif treatments[beat_id] == "CLEAN_PRESENTER":
                fail(errors, f"repo_captures[{index}] is shown in {beat_id!r}, which is CLEAN_PRESENTER")
    shown = {beat_id for cap in captures if isinstance(cap, dict) for beat_id in (cap.get("beats") or [])}
    for beat in beats:
        if not isinstance(beat, dict) or beat.get("id") in shown:
            continue
        text = str(beat.get("spoken_text", "")).lower()
        if any(cue in text for cue in REPO_CUES) and "repo" not in str(beat.get("rationale", "")).lower():
            warnings.append(f"{beat.get('id')} mentions {', '.join(c for c in REPO_CUES if c in text)!s} but shows no repo capture; "
                            "add one to repo_captures or say why in the rationale")

    if duration and fullscreen_duration / duration > 0.4:
        warnings.append("full-screen motion exceeds 40% of runtime; verify that presenter presence remains intentional")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a Presenter Intro Editor directive")
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
