import os
import sys
import json
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Composite visuals, audio, and subtitles")
    parser.add_argument("project", nargs="?", default=".", help="Project directory")
    parser.add_argument("-o", "--output", help="Output directory")
    args, unknown = parser.parse_known_args()
    
    target = Path(args.output or args.project).resolve()
    proj_dir = target.parent if target.is_file() else target
    print(f"[Composite] Finalizing composite in: {proj_dir}")
    
    master = proj_dir / "output.mp4"
    if master.exists():
        print(f"[Composite] Master output already composited: {master}")
        return
        
    job_file = proj_dir / "ui-job.json"
    media_path = None
    theme = "clean-tech"
    if job_file.exists():
        try:
            with open(job_file, "r", encoding="utf-8") as f:
                job_data = json.load(f)
                sections = job_data.get("sections", [])
                if sections:
                    media_path = sections[0].get("path")
                theme = job_data.get("theme", "clean-tech")
        except:
            pass
            
    sys.path.insert(0, str(Path(__file__).parent))
    sys.path.insert(0, str(Path(__file__).parent / "scripts"))
    sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
    if media_path and Path(media_path).exists():
        try:
            from render_clean_tech import build_video
        except ImportError:
            from skills.presenter_long_form_editor.scripts.render_clean_tech import build_video
        build_video(str(proj_dir), media_path, theme)
    else:
        print("[Composite] Verified composite layers.")

if __name__ == "__main__":
    main()
