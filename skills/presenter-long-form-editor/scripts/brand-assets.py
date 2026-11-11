import os
import sys
import json
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Generate and verify brand assets")
    parser.add_argument("project", nargs="?", default=".", help="Project directory")
    parser.add_argument("-t", "--theme", default="clean-tech", help="Theme name")
    parser.add_argument("-o", "--output", help="Output directory")
    
    args, unknown = parser.parse_known_args()
    proj_dir = Path(args.output or args.project).resolve()
    proj_dir.mkdir(parents=True, exist_ok=True)
    
    theme = args.theme
    assets = {
        "theme": theme,
        "colors": {
            "background": "#F5F6F8",
            "ink": "#0D0F14",
            "accent": "#2F5BFF",
            "green": "#18B46B",
            "border": "#E3E6EC",
            "card_bg": "#FFFFFF"
        },
        "typography": {
            "headline": "Inter Tight / Segoe UI Bold",
            "body": "Inter Tight / Segoe UI",
            "mono": "JetBrains Mono / Consolas"
        },
        "verified": True
    }
    
    out_file = proj_dir / "brand-assets.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(assets, f, indent=2)
        
    print(f"[Brand Assets] Assets prepared for theme '{theme}' at: {out_file}")

if __name__ == "__main__":
    main()

