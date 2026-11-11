import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from faster_whisper import WhisperModel

def format_timestamp(s: float) -> str:
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    ms = int(round((s - int(s)) * 1000))
    if ms >= 1000:
        sec += 1
        ms -= 1000
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

def transcribe_file(input_path: Path, output_dir: Path, model_name: str = "base"):
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[Transcribe] Loading Whisper model '{model_name}'...")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    
    print(f"[Transcribe] Transcribing: {input_path}")
    segments, info = model.transcribe(str(input_path), beam_size=5, word_timestamps=True)
    
    segments_list = []
    srt_lines = []
    plain_text_lines = []
    
    idx = 1
    for seg in segments:
        words = []
        if hasattr(seg, "words") and seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word,
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "probability": round(w.probability, 3)
                })
        
        seg_dict = {
            "id": idx,
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
            "words": words
        }
        segments_list.append(seg_dict)
        
        start_ts = format_timestamp(seg.start)
        end_ts = format_timestamp(seg.end)
        srt_lines.append(f"{idx}\n{start_ts} --> {end_ts}\n{seg.text.strip()}\n")
        plain_text_lines.append(seg.text.strip())
        idx += 1
        
    full_text = " ".join(plain_text_lines)
    
    result_data = {
        "source": str(input_path),
        "duration": round(info.duration, 3) if hasattr(info, "duration") else 0.0,
        "language": info.language if hasattr(info, "language") else "en",
        "language_probability": round(info.language_probability, 3) if hasattr(info, "language_probability") else 1.0,
        "text": full_text,
        "segments": segments_list
    }
    
    # Save standard formats
    json_path = output_dir / "transcription.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2, ensure_ascii=False)
        
    transcript_alias = output_dir / "transcript.json"
    with open(transcript_alias, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2, ensure_ascii=False)
        
    srt_path = output_dir / "captions.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
        
    txt_path = output_dir / "transcript.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(full_text)
        
    print(f"[Transcribe] Complete! Wrote {len(segments_list)} segments to:")
    print(f"  - {json_path}")
    print(f"  - {srt_path}")
    return result_data

def main():
    parser = argparse.ArgumentParser(description="Local transcription using Whisper")
    parser.add_argument("input", nargs="?", help="Input audio or video file")
    parser.add_argument("output_pos", nargs="?", default=None, help="Output directory or file")
    parser.add_argument("-i", "--input-file", dest="input_opt", help="Input file option")
    parser.add_argument("-o", "--output", "--edit-dir", "--project-dir", dest="output", help="Output directory or file")
    parser.add_argument("-m", "--model", default="base", help="Whisper model size")
    parser.add_argument("-l", "--language", default=None, help="Spoken language")
    
    args, unknown = parser.parse_known_args()
    
    raw_input = args.input or args.input_opt
    if not raw_input and unknown:
        for u in unknown:
            if not u.startswith("-") and Path(u).exists():
                raw_input = u
                break
                
    if not raw_input:
        print("Error: No input file specified.", file=sys.stderr)
        sys.exit(1)
        
    input_path = Path(raw_input).resolve()
    if not input_path.exists():
        print(f"Error: Input file does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)
        
    out_target = args.output or args.output_pos
    if out_target:
        p = Path(out_target).resolve()
        out_dir = p.parent if p.suffix else p
    else:
        out_dir = Path.cwd()
        
    transcribe_file(input_path, out_dir, args.model)

if __name__ == "__main__":
    main()

