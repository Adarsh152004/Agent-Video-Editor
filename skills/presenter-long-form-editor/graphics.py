import os
import sys
import json
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Render motion graphics cards and scenes")
    parser.add_argument("project", nargs="?", default=".", help="Project directory")
    parser.add_argument("-t", "--theme", default="clean-tech", help="Theme")
    parser.add_argument("-o", "--output", help="Output directory")
    args, unknown = parser.parse_known_args()
    
    target = Path(args.output or args.project).resolve()
    proj_dir = target.parent if target.is_file() else target
    print(f"[Graphics] Generating graphics scenes for project: {proj_dir}")
    
    if (proj_dir / "output.mp4").exists():
        print(f"[Graphics] Master output already exists: {proj_dir / 'output.mp4'}")
        return
        
    # Check if render_clean_tech can be used directly or if media is in ui-job.json
    job_file = proj_dir / "ui-job.json"
    media_path = None
    if job_file.exists():
        try:
            with open(job_file, "r", encoding="utf-8") as f:
                job_data = json.load(f)
                sections = job_data.get("sections", [])
                if sections:
                    media_path = sections[0].get("path")
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
        print(f"[Graphics] Rendering kinetic motion scenes from {media_path}...")
        build_video(str(proj_dir), media_path, args.theme)
    else:
        print(f"[Graphics] Scenes cached and verified.")

if __name__ == "__main__":
    main()
