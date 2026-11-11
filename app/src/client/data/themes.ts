import type { SkillId } from '../../shared/types';

export interface Theme {
  skill: SkillId;
  id: string;
  name: string;
  description: string;
  swatches: string[];
  isDefault: boolean;
}

export const themes: Theme[] = [
  { skill: 'intro', id: 'personal', name: 'Signature', description: 'Warm paper, cobalt signal, Avenir Next, minimal cards and node connectors', swatches: ['#F5F3EE', '#151922', '#3659E3'], isDefault: true },
  { skill: 'intro', id: 'clean-tech', name: 'Clean Tech (Kinetic Type)', description: 'Studio 3D style: cool off-white with dot grid, Inter Tight kinetic rising type, electric blue pills, white UI cards with soft drop shadows, green checks', swatches: ['#F5F6F8', '#0D0F14', '#2F5BFF', '#18B46B'], isDefault: false },
  { skill: 'intro', id: 'lime-tech', name: 'Hybrid Tech', description: 'Light grey canvas, neon lime badges, rotating black 8-spoke flower wheels in the corners, un-bold type', swatches: ['#F5F5F5', '#000000', '#E8FF72'], isDefault: false },
  { skill: 'intro', id: 'navy-amber', name: 'Navy Amber', description: 'White canvas with an engineering grid, royal navy and golden amber, classy un-bold type, floating corner spheres, typewriter text', swatches: ['#FFFFFF', '#1D2070', '#FEAF1D'], isDefault: false },
  { skill: 'long-form', id: 'clean-tech', name: 'Clean Tech (Kinetic Type)', description: 'Studio 3D style: cool off-white with dot grid, Inter Tight kinetic rising type, electric blue pills, white UI cards with soft drop shadows, green checks', swatches: ['#F5F6F8', '#0D0F14', '#2F5BFF', '#18B46B'], isDefault: false },
  { skill: 'long-form', id: 'warm-paper', name: 'Warm Paper Sketch', description: 'Warm paper, ink, cobalt, yellow marker highlights, handwritten titles over clean body text, code in a dark IDE window', swatches: ['#F5F3EE', '#1D2025', '#3659E3', '#FFD84D'], isDefault: true },
  { skill: 'long-form', id: 'personal', name: 'Signature', description: 'Warm paper, cobalt signal, Avenir Next, minimal cards and node connectors', swatches: ['#F5F3EE', '#151922', '#3659E3'], isDefault: false },
  { skill: 'long-form', id: 'lime-tech', name: 'Hybrid Tech', description: 'Light grey canvas, neon lime badges, rotating black flower wheels, un-bold type', swatches: ['#F5F5F5', '#000000', '#E8FF72'], isDefault: false },
  { skill: 'long-form', id: 'navy-amber', name: 'Navy Amber', description: 'Engineering grid, royal navy and golden amber, classy un-bold type, typewriter text', swatches: ['#FFFFFF', '#1D2070', '#FEAF1D'], isDefault: false },
  { skill: 'long-form', id: 'dark-sketch', name: 'Dark Sketch Explainer', description: 'Flat charcoal, soft-white hand-drawn line art, blue fills and orange brush underlines, instant on-cue builds', swatches: ['#181A1C', '#E2E2E2', '#578AE0', '#CB9370'], isDefault: false },
  { skill: 'long-form', id: 'blackboard-style', name: 'Blackboard Live Pen', description: 'Pure black, handwriting written on live like a tablet pen, bright inks by meaning, red pointer arrows, a zooming infinite-canvas camera', swatches: ['#000000', '#F8F8F8', '#5454FC', '#6CFC6C', '#FCFC84'], isDefault: false },
  { skill: 'long-form', id: 'colorful-purple', name: 'Hand-Drawn Infographic', description: 'Near-white paper, bold black and periwinkle headline, marker handwriting, coral and blue offset boxes, mint callout pill', swatches: ['#F9F9F7', '#1D1D1D', '#8B97EE', '#EE8E72', '#A2AEF5'], isDefault: false },
];

export const themesFor = (skill: SkillId) => themes.filter((theme) => theme.skill === skill);
export const defaultTheme = (skill: SkillId) => themesFor(skill).find((theme) => theme.isDefault)!;
export const themeById = (skill: SkillId, id: string) => themesFor(skill).find((theme) => theme.id === id);
