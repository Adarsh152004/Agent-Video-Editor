// Reusable GitHub screen-recording stage for presenter-intro-editor projects.
// Written against a Remotion project with motion.tsx, project.ts and themes/ modules;
// adjust the three imports to match your project layout.

import React from 'react';
import {Img, staticFile} from 'remotion';
import {enter, exit, pulse, smootherstep} from '../motion';
import {FPS, px} from '../project';
import {theme} from '../themes';

/**
 * The GitHub "screen recording": a live 2x capture of a repository page
 * (scripts/capture_repo.py in the presenter-intro-editor skill) shown in a clean
 * browser window with its real address, under a frame-driven camera.
 *
 * Camera stops are in CSS px of the captured page (captures.json gives anchors):
 *   y     page offset at the top of the viewport
 *   zoom  1 = page width fills the viewport; never past 1:1 of the 2x capture
 *   cx    page x kept at the viewport centre when zoomed
 * Each stop is reached at `at` (frame) after a smootherstep move of `move`
 * frames. Fast moves get a 180-degree shutter (sub-frame samples averaged),
 * so a long scroll reads as a flick, not a strobe.
 *
 * The page is drawn from 1600 px tiles (capture_repo.py writes them), and only
 * the tiles inside the viewport are mounted: decoding a whole 3216x13000 px
 * page in every Chrome tab pushed macOS into gigabytes of swap.
 *
 * Rings mark what the narration names: constant on-screen width, mapped
 * through the camera, landing on the spoken word. The page is never edited.
 */
export type CameraStop = {at: number; move: number; y: number; zoom?: number; cx?: number};
export type FocusRing = {at: number; out: number; rect: {x: number; y: number; w: number; h: number}};

const VIEW_CSS_W = 1608;
const DPR = 2;
const CHROME_H = 104;
const TILE_H = 1600;
const TILE_OVERLAP = 2;

type Cam = {y: number; zoom: number; cx: number};

const camAt = (stops: CameraStop[], f: number): Cam => {
  const val = (s: CameraStop): Cam => ({y: s.y, zoom: s.zoom ?? 1, cx: s.cx ?? VIEW_CSS_W / 2});
  let cur = val(stops[0]);
  for (let i = 1; i < stops.length; i++) {
    const s = stops[i];
    const start = s.at - s.move;
    if (f <= start) break;
    const p = smootherstep((f - start) / Math.max(1, s.move));
    const nxt = val(s);
    cur = {
      y: cur.y + (nxt.y - cur.y) * p,
      zoom: cur.zoom + (nxt.zoom - cur.zoom) * p,
      cx: cur.cx + (nxt.cx - cur.cx) * p,
    };
  }
  return cur;
};

export const RepoBrowser: React.FC<{
  frame: number;
  box: {x: number; y: number; width: number; height: number};
  tiles: string; // staticFile folder of the page tiles, e.g. 'github/tiles/sponsor-7'
  pageHeightPx: number; // pixel height of the whole page capture
  address: string; // 'github.com/owner/repo', exactly the captured URL
  stops: CameraStop[];
  rings?: FocusRing[];
  opacity?: number;
}> = ({frame, box, tiles, pageHeightPx, address, stops, rings = [], opacity = 1}) => {
  const chromeH = px(CHROME_H);
  const vpW = box.width - 2 * px(3);
  const vpH = box.height - chromeH - 2 * px(3);
  const base = vpW / (VIEW_CSS_W * DPR);

  const place = (c: Cam) => {
    const s = base * c.zoom;
    const imgW = VIEW_CSS_W * DPR * s;
    const tx = Math.min(0, Math.max(vpW - imgW, vpW / 2 - c.cx * DPR * s));
    const ty = Math.min(0, Math.max(vpH - pageHeightPx * s, -c.y * DPR * s));
    return {s, tx, ty};
  };

  // 180-degree shutter: average sub-frame samples when the picture moves fast.
  const now = place(camAt(stops, frame));
  const a = place(camAt(stops, frame - 0.25));
  const b = place(camAt(stops, frame + 0.25));
  const travel = Math.hypot(b.tx - a.tx, b.ty - a.ty) + Math.abs(b.s - a.s) * vpW;
  const samples = travel > px(6) ? 7 : 1;
  const layers = Array.from({length: samples}, (_, k) =>
    samples === 1 ? now : place(camAt(stops, frame + (k / (samples - 1) - 0.5) * 0.5)),
  );

  const [host, ...rest] = address.split('/');
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        opacity,
        background: theme.colors.surface,
        border: `${px(3)}px solid ${theme.colors.surfaceBorder}`,
        borderRadius: px(28),
        boxShadow: theme.shadow.card,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: chromeH,
          display: 'flex',
          alignItems: 'center',
          gap: px(40),
          padding: `0 ${px(40)}px`,
          borderBottom: `${px(3)}px solid ${theme.colors.surfaceBorder}`,
          background: '#fbfaf7',
          boxSizing: 'border-box',
        }}
      >
        <div style={{display: 'flex', gap: px(18)}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: px(26), height: px(26), borderRadius: 99, background: theme.colors.line}} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: px(64),
            borderRadius: px(32),
            background: '#f1efe9',
            display: 'flex',
            alignItems: 'center',
            gap: px(20),
            padding: `0 ${px(30)}px`,
            fontFamily: theme.font,
            fontSize: px(40),
            fontWeight: 500,
            letterSpacing: px(-0.2),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <Img src={staticFile('logos/github-invertocat-black.svg')} style={{height: px(36), width: 'auto'}} />
          <span>
            <span style={{color: theme.colors.muted}}>{host}/</span>
            <span style={{color: theme.colors.text}}>{rest.join('/')}</span>
          </span>
        </div>
      </div>
      <div style={{position: 'relative', width: vpW, height: vpH, overflow: 'hidden', background: '#ffffff'}}>
        {layers.map((l, k) => {
          const top = -l.ty / l.s;
          const bottom = (vpH - l.ty) / l.s;
          const count = Math.ceil(pageHeightPx / TILE_H);
          const visible = Array.from({length: count}, (_, i) => i).filter(
            (i) => i * TILE_H < bottom && (i + 1) * TILE_H + TILE_OVERLAP > top,
          );
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: VIEW_CSS_W * DPR,
                height: pageHeightPx,
                transformOrigin: '0 0',
                transform: `translate(${l.tx}px, ${l.ty}px) scale(${l.s})`,
                // Running average: layer k at 1/(k+1) gives every sample equal weight.
                opacity: 1 / (k + 1),
                background: '#ffffff',
              }}
            >
              {visible.map((i) => (
                <Img
                  key={i}
                  src={staticFile(`${tiles}/${String(i).padStart(4, '0')}.png`)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: i * TILE_H,
                    width: VIEW_CSS_W * DPR,
                    height: Math.min(TILE_H + TILE_OVERLAP, pageHeightPx - i * TILE_H),
                    maxWidth: 'none',
                  }}
                />
              ))}
            </div>
          );
        })}
        {rings.map((r, i) => {
          const o = enter(frame, r.at - 6, r.at) * exit(frame, r.out, r.out + 8);
          if (o <= 0.001) return null;
          const pad = px(16);
          const pop = 1 + pulse(frame, r.at, 10) * 0.04;
          const x = now.tx + r.rect.x * DPR * now.s - pad;
          const y = now.ty + r.rect.y * DPR * now.s - pad;
          const w = r.rect.w * DPR * now.s + 2 * pad;
          const h = r.rect.h * DPR * now.s + 2 * pad;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                border: `${px(8)}px solid ${theme.colors.accent}`,
                borderRadius: px(18),
                boxSizing: 'border-box',
                opacity: o,
                transform: `scale(${pop})`,
                boxShadow: `0 0 0 ${px(10)}px rgba(54,89,227,0.12)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Frames from seconds, for authoring camera stops next to the directive's times. */
export const f = (s: number) => Math.round(s * FPS);
