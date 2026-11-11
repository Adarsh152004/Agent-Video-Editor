import { useEffect, useId, useState } from 'react';
import type { Theme } from '../data/themes';
import { tokens } from '../design/tokens';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import './theme-preview.css';

export const SAMPLE_DURATION = 15;
export function sampleScene(time: number) { return Math.min(2, Math.floor(Math.max(0, time) / 5)); }

const copy: Record<string, [string, string, string]> = {
  'clean-tech': ['Ideas in motion.', 'Kinetic type with clarity', 'Simulate the future.'],
  personal: ['Your ideas. Clearly told.', 'Connect the important ideas', 'A signature worth remembering'],
  'lime-tech': ['A fresh perspective.', 'Big ideas. Bold signals.', 'Make your next move.'],
  'navy-amber': ['Precision meets story.', 'Engineered for clarity', 'An elegant final impression.'],
  'warm-paper': ['Let’s make it simple.', 'From idea to understanding', 'One clear takeaway.'],
  'dark-sketch': ['Start with a question.', 'Sketch the answer', 'See the bigger picture.'],
  'blackboard-style': ['Think it through.', 'Build it, one line at a time', 'Now it all connects.'],
  'colorful-purple': ['Ideas with personality.', 'A little color. A lot of clarity.', 'Make the message stick.'],
};

export function ThemeArtwork({ theme, time = 0 }: { theme: Theme; time?: number }) {
  const uid = useId().replace(/:/g, '');
  const scene = sampleScene(time);
  const local = time - scene * 5;
  const [paper, ink, accent, extra = accent] = theme.swatches;
  const sketch = ['warm-paper', 'dark-sketch', 'blackboard-style', 'colorful-purple'].includes(theme.id);
  const pen = theme.id === 'blackboard-style' || theme.id === 'colorful-purple';
  const themeCopy = copy[theme.id] || copy['personal'];
  const title = themeCopy[scene] || 'Ideas clearly told.';
  const shown = time > 0 && (theme.id === 'navy-amber' || pen) ? title.slice(0, Math.max(1, Math.floor(local * 22))) : title;
  const circle = sketch || theme.id === 'lime-tech';
  const progress = Math.min(1, local / 1.8);
  const reveal = (index: number) => local >= index * .6;
  return <svg className="sample-art" viewBox="0 0 800 450" role="img" aria-label={`${theme.name}: ${['presenter introduction', 'explanatory graphics with presenter inset', 'closing takeaway'][scene]}`}>
    <defs>
      <pattern id={`${uid}texture`} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill={tokens.color.previewBlack} /><path d="M0 8L8 0" stroke={tokens.color.previewLine} strokeWidth="1" /></pattern>
      <pattern id={`${uid}grid`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke={ink} strokeOpacity=".09" /></pattern>
      <pattern id={`${uid}dots`} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.4" fill={ink} fillOpacity=".12" /></pattern>
    </defs>
    <rect width="800" height="450" fill={paper} />
    {(theme.id === 'navy-amber' || theme.id === 'blackboard-style') && <rect width="800" height="450" fill={`url(#${uid}grid)`} />}
    {theme.id === 'clean-tech' && <rect width="800" height="450" fill={`url(#${uid}dots)`} />}
    {theme.id === 'lime-tech' && [0, 1].map((n) => <g key={n} transform={`translate(${n ? 760 : 40} ${n ? 410 : 40}) rotate(${time * 14})`}>{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cy="-24" rx="9" ry="25" fill={ink} transform={`rotate(${i * 45})`} />)}</g>)}
    {theme.id === 'navy-amber' && <><circle cx="760" cy={60 + Math.sin(time) * 10} r="55" fill={accent} /><circle cx="32" cy="430" r="70" fill={ink} /></>}
    <text x="48" y="42" fill={ink} opacity=".65" fontSize="12" letterSpacing="3">{theme.skill === 'intro' ? 'THE OPENING SEQUENCE' : 'THE EXPLAINER'} / 0{scene + 1}</text>
    <g transform={theme.id === 'blackboard-style' && scene === 1 ? `translate(${18 * progress} ${8 * progress}) scale(${1 - .05 * progress})` : undefined}>
      {scene !== 1 ? <>
        <rect x="48" y="110" width="38" height="5" rx="2" fill={accent} />
        <text x="48" y="165" fill={ink} fontSize="29" fontWeight={sketch ? 700 : 500} fontStyle={sketch ? 'italic' : 'normal'}>{shown.split(' ').slice(0, 3).join(' ')}</text>
        <text x="48" y="205" fill={ink} fontSize="29" fontWeight={sketch ? 700 : 500} fontStyle={sketch ? 'italic' : 'normal'}>{shown.split(' ').slice(3).join(' ')}</text>
        {sketch && <path d="M48 220 Q150 213 350 220" stroke={extra} strokeWidth="8" opacity=".7" fill="none" />}
        <text x="48" y="263" fill={ink} fontSize="15">{scene === 0 ? 'Your story, with a visual point of view.' : 'Clear graphics. Room for your voice.'}</text>
        <rect x="48" y="298" width="190" height="37" rx={theme.id === 'lime-tech' ? 18 : 5} fill={accent} />
        <text x="63" y="322" fill={['personal', 'warm-paper', 'clean-tech'].includes(theme.id) ? tokens.color.previewWhite : tokens.color.previewBlack} fontSize="12" fontWeight="700">{scene === 0 ? 'LET’S BREAK IT DOWN' : 'YOUR NEXT CHAPTER'}</text>
      </> : <>
        <text x="48" y="108" fill={ink} fontSize="27" fontWeight={sketch ? 700 : 500} fontStyle={sketch ? 'italic' : 'normal'}>{shown}</text>
        {['Idea', 'Process', 'Result'].map((label, i) => reveal(i) && <g key={label}>
          {i > 0 && <path d={`M${i * 178 + 23} 213h24m-7-6 7 6-7 6`} stroke={pen ? extra : accent} strokeWidth="3" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={pen ? 1 - Math.min(1, Math.max(0, local - i * .6) * 2) : 0} />}
          <rect x={48 + i * 178 + (theme.id === 'colorful-purple' ? 6 : 0)} y="160" width="150" height="105" rx={sketch ? 3 : 12} fill={i === 1 ? accent : extra} fillOpacity={theme.id === 'lime-tech' || theme.id === 'colorful-purple' ? 1 : .13} />
          <path d={`M${48 + i * 178} 160h150v105h-150z`} stroke={ink} strokeWidth={sketch ? 2 : 1} fill="none" />
          <text x={123 + i * 178} y="219" textAnchor="middle" fill={ink} fontSize="19">{label}</text>
        </g>)}
        <text x="48" y="315" fill={ink} fontSize="15">{theme.id === 'warm-paper' ? 'const clarity = ideas.map(explain)' : 'Give every idea a clear visual connection.'}</text>
      </>}
    </g>
    <g transform={scene === 1 ? 'translate(650 312) scale(.48)' : 'translate(520 108)'}>
      {circle ? <circle cx="110" cy="110" r="108" fill={`url(#${uid}texture)`} stroke={ink} strokeWidth="3" /> : <rect width="220" height="220" rx="18" fill={`url(#${uid}texture)`} stroke={ink} strokeWidth="2" />}
      <circle cx="110" cy="77" r="21" fill="none" stroke={tokens.color.previewWhite} strokeWidth="2" opacity=".6" /><path d="M72 128q0-36 38-36t38 36" fill="none" stroke={tokens.color.previewWhite} strokeWidth="2" opacity=".6" />
      <text x="110" y="156" textAnchor="middle" fill={tokens.color.previewWhite} fontSize="15">Your talking head</text><text x="110" y="177" textAnchor="middle" fill={tokens.color.previewWhite} opacity=".6" fontSize="11">appears here</text>
    </g>
    <text x="48" y="412" fill={ink} opacity=".6" fontSize="11">{theme.name.toUpperCase()}</text><text x="752" y="412" fill={ink} textAnchor="end" fontSize="11">{theme.skill === 'intro' ? 'INTRO' : 'LONG-FORM'} · SAMPLE</text>
  </svg>;
}

export function ThemePreview({ theme, active, onPlay }: { theme: Theme; active: boolean; onPlay: () => void }) {
  const [time, setTime] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (!active) setPlaying(false); }, [active]);
  useEffect(() => {
    if (!playing || !active) return;
    let frame: number;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .1);
      previous = now;
      setTime((value) => Math.min(SAMPLE_DURATION, value + delta));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, active]);
  useEffect(() => { if (time >= SAMPLE_DURATION) setPlaying(false); }, [time]);
  const player = <div className="sample-player">
    <ThemeArtwork theme={theme} time={time} />
    <div className="sample-controls">
      <Button size="sm" aria-label={`${playing && active ? 'Pause' : time === SAMPLE_DURATION ? 'Replay' : 'Play'} ${theme.name} sample`} onClick={() => { if (time === SAMPLE_DURATION) setTime(0); onPlay(); setPlaying(!playing || !active); }}>{playing && active ? 'Ⅱ Pause' : time === SAMPLE_DURATION ? '↻ Replay' : '▶ Play'}</Button>
      <input type="range" aria-label={`Seek ${theme.name} sample`} min="0" max={SAMPLE_DURATION} step="0.1" value={time} onChange={(e) => setTime(Number(e.target.value))} />
      <span>{Math.floor(time).toString().padStart(2, '0')} / 15 sec</span>
    </div>
  </div>;
  return <><div className="sample-inline">{!expanded ? player : <ThemeArtwork theme={theme} time={time} />}<Button className="sample-expand" size="sm" onClick={() => setExpanded(true)} aria-label={`Expand ${theme.name} sample`}>↗ Expand sample</Button></div><Modal open={expanded} title={`${theme.name} · 15-second sample`} onClose={() => setExpanded(false)}><div className="sample-expanded">{expanded && player}<p className="ui-note">Silent style demonstration · Your talking head replaces the textured placeholder.</p></div></Modal></>;
}
