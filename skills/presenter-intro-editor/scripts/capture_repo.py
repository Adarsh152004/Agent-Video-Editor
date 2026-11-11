#!/usr/bin/env python3
"""Retina captures of a public GitHub repository page, for the repo "screen recording" shot.

Usage: ~/.pyenv/shims/python -I capture_repo.py <jobs.json> <edit/<project>/assets/github>
       ~/.pyenv/shims/python -I capture_repo.py --tile-only <edit/<project>/assets/github>
jobs.json: [{"name": "sponsor-7", "url": "https://github.com/sponsor-7/sponsor-7",
             "clip_h": 5200, "anchors": ["~1.62B Tokens", "Skills List"]}]

- A fresh, logged-out Chromium context in the light colour scheme, viewport 1608x758 CSS at
  device scale 2 (3216x1516 px), so a capture shows 1:1 in a 4K browser stage and stays crisp
  when the edit pushes in.
- Writes <name>-top.png (the first viewport: repo name, star counter, file list, About) and
  <name>-page.png (the page from y=0 to clip_h CSS px, for scrolling). Lazy README images are
  loaded by scrolling first. A fixed or sticky top bar is captured separately as
  <name>-header.png and hidden in the page clip, so the edit can pin it like a real browser.
- Floating overlays (cookie or sign-up banners, any fixed element other than the top bar) are
  hidden with CSS, never clicked. The page itself is never edited, typed into, or signed in to.
- Measures, in CSS px of the full page: the repo title, the star counter, the About sidebar, the
  README body, every README heading, and each extra "anchors" text. Multiply by 2 for image px.
- Records the star count shown at capture time (stars move; the shot is "as of" this date) and
  each file's SHA-256 into <out>/captures.json and <out>/SOURCES.json.
- Splits each page clip into tiles/<name>/NNNN.png, 1600 px apart and 2 px overlapping (lossless crops). The edit
  renders only the tiles inside the viewport: a whole 3216x13000 px page decoded in every
  Chrome tab pushed macOS into gigabytes of swap and filled the disk (2026-10-13).
  --tile-only re-tiles the pages already listed in captures.json.
A non-GitHub forge URL (GitLab, Codeberg) also works; the GitHub-specific anchors are then null.
"""
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path
from PIL import Image

TILE_H = 1600
TILE_OVERLAP = 2  # each tile runs 2 px into the next, so scaled tiles show no seam


def tile(out: Path, name: str) -> dict:
    """Lossless 1600 px slices of <name>-page.png, so a frame decodes only what it shows."""
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(out / f"{name}-page.png")
    d = out / "tiles" / name
    d.mkdir(parents=True, exist_ok=True)
    for old in d.glob("*.png"):
        old.unlink()
    n = 0
    for n, y in enumerate(range(0, im.height, TILE_H)):
        im.crop((0, y, im.width, min(im.height, y + TILE_H + TILE_OVERLAP))).save(d / f"{n:04d}.png", optimize=True)
    return {"tile_h_px": TILE_H, "overlap_px": TILE_OVERLAP, "tiles": n + 1, "page_w_px": im.width, "page_h_px": im.height}


if sys.argv[1] == "--tile-only":
    out = Path(sys.argv[2])
    meta = json.loads((out / "captures.json").read_text())
    for name, info in meta.items():
        info["tiles"] = tile(out, name)
        print(name, info["tiles"])
    (out / "captures.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))
    raise SystemExit(0)

from playwright.sync_api import sync_playwright  # noqa: E402

jobs = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
VW, VH = 1608, 758
REPO_URL = re.compile(r"^https://[a-z0-9.-]+/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$")

GITHUB = """(repo) => {
  // GitHub's markup changes often, so find elements by visible text near the top, not by class.
  const rect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? {x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height} : null; };
  const near = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.top + scrollY < 400; };
  const title = [...document.querySelectorAll('strong a, strong[itemprop="name"] a')].find(a => near(a) && a.textContent.trim().toLowerCase() === repo.toLowerCase());
  const star = document.querySelector('#repo-stars-counter-star')
    || [...document.querySelectorAll('a, button')].find(el => near(el) && /^Star\\s*[\\d.,]+[kKmM]?/.test((el.textContent || '').trim()));
  const count = star ? ((star.textContent || '').match(/[\\d.,]+[kKmM]?/) || [null])[0] : null;
  const about = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'About');
  const readme = document.querySelector('article.markdown-body');
  return {
    title: rect(title), title_text: title ? title.textContent.trim() : null,
    stars: rect(star), stars_text: count,
    stars_exact: star ? (star.getAttribute('title') || star.getAttribute('aria-label')) : null,
    about: rect(about ? about.closest('.BorderGrid-cell') || about.parentElement : null),
    readme: rect(readme),
    headings: readme ? [...readme.querySelectorAll('h1, h2, h3')].map(h => ({text: h.textContent.trim(), ...rect(h)})).filter(h => h.w) : [],
  }; }"""
MEASURE = """(needles) => {
  const all = [...document.querySelectorAll('body *')], res = {};
  for (const n of needles) { let best = null;
    for (const el of all) { const t = (el.innerText || '').trim(); if (!t || !t.toLowerCase().includes(n.toLowerCase())) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      if (!best || r.width * r.height < best.a) best = {a: r.width * r.height, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height}; }
    res[n] = best; }
  return res; }"""
FIXED = """() => { const els = [...document.querySelectorAll('body *')].filter(el => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return (s.position === 'fixed' || s.position === 'sticky') && r.top <= 2 && r.height > 20 && r.height < 220 && r.width > innerWidth * 0.6; });
  const top = els.filter(el => !els.some(o => o !== el && o.contains(el))); let bottom = 0;
  top.forEach(el => { bottom = Math.max(bottom, el.getBoundingClientRect().bottom); el.setAttribute('data-cap-fixed', '1'); });
  return {n: top.length, bottom}; }"""
OVERLAYS = """() => { let n = 0;
  for (const el of document.querySelectorAll('body *')) { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if ((s.position === 'fixed' || s.position === 'sticky') && !(r.top <= 2 && r.width > innerWidth * 0.6) && r.width > 0 && r.height > 0) {
      el.style.setProperty('visibility', 'hidden', 'important'); n++; } }
  return n; }"""

src_path = out / "SOURCES.json"
sources = json.loads(src_path.read_text()) if src_path.exists() else {"files": {}}
meta_path = out / "captures.json"
meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
today = str(datetime.date.today())
with sync_playwright() as p:
    b = p.chromium.launch()
    for job in jobs:
        name, url = job["name"], job["url"].rstrip("/")
        if not REPO_URL.match(url):
            raise SystemExit(f"error: {url} is not an https://<forge>/<owner>/<repo> URL")
        # A fresh context per repo: no cookies, no login, nothing carried between captures.
        ctx = b.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=2,
                            color_scheme="light", locale="en-US")
        pg = ctx.new_page()
        pg.goto(url, wait_until="domcontentloaded", timeout=60000)
        pg.wait_for_timeout(4000)
        h = pg.evaluate("document.body.scrollHeight")
        for y in range(0, min(h, job.get("clip_h", h) + VH), 350):
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(120)
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(2500)
        if not job.get("keep_overlays"):
            print("   hid overlays:", pg.evaluate(OVERLAYS))
        gh = pg.evaluate(GITHUB, url.rsplit("/", 1)[-1])
        anchors = pg.evaluate(MEASURE, job.get("anchors", []))
        h = pg.evaluate("document.body.scrollHeight")
        info = {"url": url, "retrieved": today, "viewport_css": [VW, VH], "dpr": 2, "page_height_css": h,
                "github": gh, "anchors_css": anchors, "files": []}
        pg.screenshot(path=str(out / f"{name}-top.png")); info["files"].append(f"{name}-top.png")
        fx = pg.evaluate(FIXED); info["header_bottom_css"] = fx["bottom"] if fx["n"] else 0
        if fx["n"]:
            pg.screenshot(path=str(out / f"{name}-header.png"), clip={"x": 0, "y": 0, "width": VW, "height": fx["bottom"]})
            info["files"].append(f"{name}-header.png")
            pg.add_style_tag(content="[data-cap-fixed]{visibility:hidden !important}"); pg.wait_for_timeout(300)
        clip_h = min(job.get("clip_h", 4000), h)
        pg.screenshot(path=str(out / f"{name}-page.png"), full_page=True, clip={"x": 0, "y": 0, "width": VW, "height": clip_h})
        info["files"].append(f"{name}-page.png"); info["clip_h_css"] = clip_h
        info["tiles"] = tile(out, name)
        for f in info["files"]:
            sources["files"][f] = {"source": url, "how": "Playwright Chromium, fresh logged-out context, 1608x758 CSS at 2x, light scheme",
                                   "retrieved": today, "stars_at_capture": gh.get("stars_exact") or gh.get("stars_text"),
                                   "sha256": hashlib.sha256((out / f).read_bytes()).hexdigest()}
        meta[name] = info
        print(name, info["files"], "| title", gh.get("title_text"), "| stars", gh.get("stars_text"), gh.get("stars_exact"),
              "| page", h, "css px | header", info["header_bottom_css"])
        for hd in gh.get("headings", [])[:16]:
            print(f"    h  y={hd['y']:7.0f}  {hd['text'][:70]}")
        for k, v in anchors.items():
            print("    a ", k, v)
        ctx.close()
    b.close()
meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False))
src_path.write_text(json.dumps(sources, indent=1, ensure_ascii=False) + "\n")
