import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import type { Job, JobSettings, MediaInfo, Section, SkillId, WorkspaceInfo } from '../../shared/types';
import type { Api } from '../api/Api';
import { defaultTheme, themesFor } from '../data/themes';
import { changeSkill, createDraft, repoUrlPattern, reorderSections, suggestProjectName, validateProjectName } from '../lib/editor';
import { ThemePreview } from './ThemePreview';
import { FileBrowser } from './FileBrowser';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { FilmIcon, GripIcon, PlusIcon, CloseIcon } from './ui/icons';
import { IconButton } from './ui/IconButton';
import { ProgressBar } from './ui/ProgressBar';
import { SegmentedControl } from './ui/SegmentedControl';
import { Select } from './ui/Select';
import { Spinner } from './ui/Spinner';
import { StatusBadge } from './ui/StatusBadge';
import { TextField } from './ui/TextField';
import { Toggle } from './ui/Toggle';

const skillCopy = {
  intro: { name: 'Intro', description: 'One finished cut, about a minute. Adds cards, full-screen motion, official logos and live GitHub repo captures.' },
  'long-form': { name: 'Long-form', description: 'A full video from camera and voice-over sections. Adds explanatory graphics, presenter inset and full-screen scenes.' },
};

function mediaDescription(media: MediaInfo) {
  return media.kind === 'video'
    ? `${media.width}×${media.height} · ${media.fps} fps · ${media.durationS.toFixed(1)} sec · audio ${media.sampleRate} Hz`
    : `${media.durationS.toFixed(1)} sec · ${media.sampleRate} Hz · ${media.channels} channels`;
}

function isAbsolutePath(val: string): boolean {
  return val.startsWith('/') || /^[a-zA-Z]:[/\\]/.test(val) || val.startsWith('\\\\');
}

function PathField({ api, onMedia, label = 'Source video or audio file', videoOnly = false }: { api: Api; onMedia: (media: MediaInfo) => void; label?: string; videoOnly?: boolean }) {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    const cleanPath = path.trim().replace(/^["']|["']$/g, '').trim();
    if (!isAbsolutePath(cleanPath)) { setError('Enter an absolute path (e.g. C:\\... or /...).'); return; }
    setBusy(true); setError('');
    try {
      const media = await api.probe(cleanPath);
      if (videoOnly && media.kind !== 'video') throw new Error('Choose a video file.');
      onMedia(media);
      setPath('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read this file.'); } finally { setBusy(false); }
  }
  return <div className="path-field"><TextField label={label} value={path} onChange={(e) => setPath(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }} help="Select an existing recording. Choose where to save the edit below." placeholder="C:\Users\you\Videos\final-cut.mp4" error={error} /><Button loading={busy} onClick={() => void submit()}>Add source file</Button></div>;
}

interface UploadState { id: string; name: string; progress: number; controller: AbortController }

function SectionList({ sections, onChange, disabled }: { sections: Section[]; onChange: (sections: Section[]) => void; disabled?: boolean }) {
  const dragged = useRef<number>();
  function keyDown(event: KeyboardEvent, index: number) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const to = index + (event.key === 'ArrowUp' ? -1 : 1);
    onChange(reorderSections(sections, index, to));
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-section="${to}"]`)?.focus());
  }
  return <ol className="section-list" aria-label="Program sections in playback order">{sections.map((section, index) => <li key={section.id} data-section={index} tabIndex={0} draggable onDragStart={() => { dragged.current = index; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragged.current !== undefined) onChange(reorderSections(sections, dragged.current, index)); }} onKeyDown={(e) => keyDown(e, index)} className="section-row">
    <span className="section-row__grip" aria-hidden="true"><GripIcon /></span><span className="section-row__index">{index + 1}</span>
    <div className="section-row__file"><strong>{section.path.split('/').pop()}</strong>{section.media ? <span className="muted">{mediaDescription(section.media)}</span> : <span className="probing"><Spinner size="sm" /> Reading media info...</span>}</div>
    <SegmentedControl label={`Kind for section ${index + 1}`} value={section.kind} options={[{ value: 'camera', label: 'camera', disabled: section.media?.kind === 'audio' }, { value: 'voiceover', label: 'voiceover' }]} onChange={(kind) => onChange(sections.map((item) => item.id === section.id ? { ...item, kind } : item))} disabled={disabled} />
    <IconButton label={`Remove ${section.path.split('/').pop()}`} icon={<CloseIcon />} size="sm" onClick={() => onChange(sections.filter((item) => item.id !== section.id))} />
  </li>)}</ol>;
}

export function FootageDropZone({ onBrowse, onDrop, compact = false }: { onBrowse: () => void; onDrop?: (files: File[]) => void; compact?: boolean }) {
  return <Button className={compact ? 'drop-zone drop-zone--compact' : 'drop-zone'} onClick={onBrowse} onDragOver={(e) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); if (onDrop) onDrop(Array.from(e.dataTransfer.files)); }}>
    <FilmIcon /><strong>Browse files...</strong><span>or drop files to copy them in</span>
  </Button>;
}

export function NewEdit({ api, workspace, onStarted, jobRunning = false }: { api: Api; workspace: WorkspaceInfo | null; onStarted: (job: Job) => void; jobRunning?: boolean }) {
  const [step, setStep] = useState(1);
  const [playingTheme, setPlayingTheme] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobSettings>(() => createDraft());
  const [outputBrowseOpen, setOutputBrowseOpen] = useState(false);
  const [outputError, setOutputError] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseRepo, setBrowseRepo] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [projectExists, setProjectExists] = useState(false);
  const [checkingProject, setCheckingProject] = useState(false);
  const [starting, setStarting] = useState(false);
  const cancelled = useRef(new Set<string>());
  const update = (patch: Partial<JobSettings>) => setDraft((current) => ({ ...current, ...patch }));

  const outputFolder = draft.outputFolder || (workspace?.workspace ? `${workspace.workspace}/edit` : '');
  const outputPath = `${outputFolder.replace(/\/+$/, '')}/${draft.projectName || '<project-name>'}`;
  useEffect(() => {
    let active = true;
    setOutputError('');
    setProjectExists(false);
    if (validateProjectName(draft.projectName)) { setCheckingProject(false); return; }
    setCheckingProject(true);
    const timer = setTimeout(() => {
      void api.projectExists(draft.projectName, draft.outputFolder).then((exists) => {
        if (active) setProjectExists(exists);
      }).catch((reason: Error) => { if (active) setOutputError(reason.message); })
        .finally(() => { if (active) setCheckingProject(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [api, draft.projectName, draft.outputFolder]);

  function suggestFrom(path: string) {
    setDraft((current) => current.projectName ? current : { ...current, projectName: suggestProjectName(path) });
  }

  function addMedia(media: MediaInfo) {
    if (draft.skill === 'intro' && media.kind !== 'video') {
      setErrors((current) => [...current, `${media.path.split('/').pop()}: Intro requires one video file.`]);
      return;
    }
    const section: Section = { id: crypto.randomUUID(), path: media.path, kind: media.kind === 'audio' ? 'voiceover' : 'camera', media };
    setDraft((current) => ({ ...current, sections: current.skill === 'intro' ? [section] : [...current.sections, section] }));
    suggestFrom(media.path);
  }

  async function addPaths(paths: string[]) {
    for (const path of paths) {
      const id = crypto.randomUUID();
      const placeholder: Section = { id, path, kind: 'camera' };
      setDraft((current) => ({ ...current, sections: current.skill === 'intro' ? [placeholder] : [...current.sections, placeholder] }));
      try {
        const media = await api.probe(path);
        if (draft.skill === 'intro' && media.kind !== 'video') throw new Error('Intro requires one video file.');
        if (cancelled.current.has(id)) continue;
        setDraft((current) => {
          const next = { ...current, sections: current.sections.map((section) => section.id === id ? { ...section, media, kind: media.kind === 'audio' ? 'voiceover' as const : 'camera' as const } : section) };
          if (!next.projectName) next.projectName = suggestProjectName(path);
          return next;
        });
      } catch (reason) {
        setDraft((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
        setErrors((current) => [...current, `${path.split('/').pop()}: ${reason instanceof Error ? reason.message : 'Could not read this file.'}`]);
      }
    }
  }

  function dropFiles(files: File[]) {
    for (const file of files) {
      const id = crypto.randomUUID();
      const controller = new AbortController();
      setUploads((current) => [...current, { id, name: file.name, progress: 0, controller }]);
      void api.uploadFile(file, (fraction) => setUploads((current) => current.map((upload) => upload.id === id ? { ...upload, progress: fraction } : upload)), controller.signal)
        .then(addMedia)
        .catch((reason: Error) => { if (reason.name !== 'AbortError') setErrors((current) => [...current, `${file.name}: ${reason.message}`]); })
        .finally(() => setUploads((current) => current.filter((upload) => upload.id !== id)));
    }
  }

  const nameError = validateProjectName(draft.projectName, projectExists);
  const sectionsValid = draft.skill === 'intro' ? draft.sections.length === 1 && draft.sections[0].media?.kind === 'video' : draft.sections.length > 0;
  const reposValid = (draft.repoRecordings ?? []).every((repo) => repoUrlPattern.test(repo.url) && repo.path);
  const canStart = !jobRunning && !outputError && !nameError && !checkingProject && sectionsValid && reposValid && draft.sections.every((section) => section.media) && !uploads.length;
  const skillInstalled = (skill: SkillId) => skill === 'intro' ? workspace?.skills.intro !== false : workspace?.skills.longForm !== false;

  function openBrowse(repo: number | null = null) { setBrowseRepo(repo); setBrowseOpen(true); }
  function selectedPaths(paths: string[]) {
    if (browseRepo === null) void addPaths(paths);
    else {
      const path = paths[0];
      void api.probe(path).then((media) => {
        if (media.kind !== 'video') throw new Error('Repo recordings must be video files.');
        update({ repoRecordings: draft.repoRecordings?.map((repo, index) => index === browseRepo ? { ...repo, path } : repo) });
      }).catch((reason: Error) => setErrors((current) => [...current, reason.message]));
    }
  }

  async function start() {
    if (!canStart) return;
    setStarting(true);
    try { onStarted(await api.startJob(draft)); } catch (reason) { setErrors((current) => [...current, reason instanceof Error ? reason.message : 'Could not start the edit.']); } finally { setStarting(false); }
  }

  return <div className="new-edit">
    <ol className="step-header" aria-label="New edit steps">{['Type', 'Theme', 'Footage and settings', 'Run'].map((label, index) => <li key={label} className={step === index + 1 ? 'step step--active' : 'step'}><span>{index + 1}</span>{label}</li>)}</ol>
    <main className="flow-main">
      {step === 1 && <div className="flow-step"><header className="flow-heading"><p className="eyebrow">Start a new edit</p><h1>What are we making?</h1><p className="muted">Turn your footage into a story worth watching. Choose your format to get started.</p></header><div className="skill-grid">{(['intro', 'long-form'] as const).map((skill) => <Button key={skill} className={draft.skill === skill ? 'skill-card skill-card--selected' : 'skill-card'} disabled={!skillInstalled(skill)} onClick={() => setDraft((current) => changeSkill(current, skill))} aria-pressed={draft.skill === skill}><span className="skill-card__index">{skill === 'intro' ? '01 / THE FIRST IMPRESSION' : '02 / THE FULL STORY'}</span><div className={`format-art format-art--${skill}`} aria-hidden="true"><span /><span /><span /><i>▶</i></div><strong>{skillCopy[skill].name}</strong><span>{skillCopy[skill].description}</span>{!skillInstalled(skill) && <StatusBadge>Not installed in this workspace</StatusBadge>}</Button>)}</div><div className="flow-actions"><Button variant="primary" onClick={() => setStep(2)}>Continue</Button></div></div>}
      {step === 2 && <div className="flow-step"><header className="flow-heading"><p className="eyebrow">{skillCopy[draft.skill].name}</p><h1>Choose a visual language</h1><p className="muted">Find the right feel for your story. Play a 15-second sample, then choose your theme.</p></header><div className="theme-grid">{themesFor(draft.skill).map((theme) => <article key={theme.id} className={draft.theme === theme.id ? 'theme-card theme-card--selected' : 'theme-card'}>
        <ThemePreview theme={theme} active={playingTheme === theme.id} onPlay={() => setPlayingTheme(theme.id)} />
        <div className="theme-card__body"><span className="theme-card__name"><strong>{theme.name}</strong>{theme.isDefault && <StatusBadge tone="success">Default</StatusBadge>}</span><p className="theme-card__description">{theme.description}</p>
        <Button variant={draft.theme === theme.id ? 'primary' : 'secondary'} aria-pressed={draft.theme === theme.id} onClick={() => update({ theme: theme.id })}>{draft.theme === theme.id ? '✓ Selected' : 'Use this theme'}</Button></div>
      </article>)}</div><div className="flow-actions"><Button onClick={() => setStep(1)}>Back</Button><Button variant="primary" onClick={() => setStep(3)}>Continue</Button></div></div>}
      {step === 3 && <div className="flow-step"><header className="flow-heading"><p className="eyebrow">Footage</p><h1>{draft.skill === 'intro' ? 'Add your locked final cut' : 'Build the program order'}</h1><p className="muted">{draft.skill === 'intro' ? 'One video file. The original stays in place.' : 'Add camera video and voice-over audio, then arrange the sections.'}</p></header>
        <div className="footage-actions"><Button variant="primary" onClick={() => openBrowse()}><PlusIcon /> Browse files...</Button></div>
        <h2>Source footage</h2><PathField api={api} onMedia={addMedia} videoOnly={draft.skill === 'intro'} />
        <FootageDropZone compact={draft.sections.length > 0} onBrowse={() => openBrowse()} onDrop={dropFiles} />
        <Card title="Output folder"><div className="settings-form"><TextField label="Save edits in this folder" value={outputFolder} onChange={(e) => update({ outputFolder: e.target.value || undefined })} help="Choose a folder, or enter a new folder path. The app creates the project folder and video files for you." error={outputError} /><Button onClick={() => setOutputBrowseOpen(true)}>Choose output folder…</Button><p className="ui-note">Your finished edit will be saved in:</p><p className="mono">{outputPath}/</p></div></Card>
        <p className="muted drop-help">Dropped files are copied into the workspace. Use Browse to edit them in place.</p>
        {errors.map((error, index) => <div className="form-error error-with-action" role="alert" key={`${error}-${index}`}><span>{error}</span><IconButton label="Dismiss error" icon={<CloseIcon />} size="sm" onClick={() => setErrors(errors.filter((_, i) => i !== index))} /></div>)}
        {uploads.map((upload) => <div className="upload-row" key={upload.id}><div className="progress-heading"><span>Copying into workspace: {Math.round(upload.progress * 100)}%</span><Button size="sm" onClick={() => upload.controller.abort()}>Cancel {upload.name}</Button></div><ProgressBar label={`Uploading ${upload.name}`} value={upload.progress * 100} /></div>)}
        {draft.sections.length > 0 && <SectionList sections={draft.sections} onChange={(sections) => update({ sections })} />}
        {draft.sections.length > 0 && <p className="muted">Drag sections to reorder, or focus a section and use Alt+Up / Alt+Down.</p>}
        <div className="flow-actions"><Button onClick={() => setStep(2)}>Back</Button><Button variant="primary" onClick={() => setStep(4)} disabled={!canStart}>Review run</Button></div>
      </div>}
      {step === 4 && <div className="flow-step"><header className="flow-heading"><p className="eyebrow">Ready to run</p><h1>Review your edit</h1><p className="muted">The source footage is never trimmed or overwritten.</p></header><Card title={draft.projectName}><dl className="details-list"><div><dt>Type</dt><dd>{skillCopy[draft.skill].name}</dd></div><div><dt>Theme</dt><dd>{themesFor(draft.skill).find((theme) => theme.id === draft.theme)?.name}</dd></div><div><dt>Sections</dt><dd>{draft.sections.length}</dd></div><div><dt>Approval</dt><dd>{draft.approvalMode === 'finished' ? 'Finished cut' : 'Review plan first'}</dd></div><div><dt>Output</dt><dd className="mono">{outputPath}/</dd></div></dl></Card><>{errors.map((error, index) => <p key={index} className="form-error" role="alert">{error}</p>)}</><div className="flow-actions"><Button onClick={() => setStep(3)}>Back</Button><Button variant="primary" loading={starting} disabled={!canStart} onClick={() => void start()}>Start edit</Button></div></div>}
    </main>
    <FileBrowser api={api} open={outputBrowseOpen} multiple={false} allowAudio={false} foldersOnly title="Choose output folder" initialPath={workspace?.workspace ?? undefined} onClose={() => setOutputBrowseOpen(false)} onSelect={(paths) => update({ outputFolder: paths[0] })} />
    <aside className="settings-panel" aria-label="Edit settings">
      {step < 3 ? <div className="selection-summary"><p className="eyebrow">Your selection</p><h2>{skillCopy[draft.skill].name}</h2><p>{themesFor(draft.skill).find((theme) => theme.id === draft.theme)?.name ?? defaultTheme(draft.skill).name}</p><div className="selection-summary__rule" /><p className="eyebrow">Made for your story</p><p className="muted">Motion graphics, thoughtful pacing, and space for your voice.</p><ul className="selection-features"><li>Original footage preserved</li><li>Local transcription</li><li>Ready-to-watch export</li></ul>{step === 2 && <p className="ui-note">Samples are silent style demonstrations. Your final edit adapts the graphics and timing to your footage.</p>}</div> : <>
        <div className="settings-panel__heading"><p className="eyebrow">Configuration</p><h2>Edit settings</h2></div>
        <div className="settings-panel__fields">
          <TextField label="Project name" required value={draft.projectName} onChange={(e) => update({ projectName: e.target.value })} error={draft.projectName ? nameError : undefined} help={!draft.projectName ? 'Letters, numbers, hyphens and underscores only.' : checkingProject ? 'Checking output folder…' : undefined} />
          <div className="field-group"><span className="ui-label">Approval mode</span><SegmentedControl label="Approval mode" value={draft.approvalMode} options={[{ value: 'finished', label: 'Finished cut' }, { value: 'review-plan', label: 'Review plan first' }]} onChange={(approvalMode) => update({ approvalMode })} /><p className="ui-note">{draft.approvalMode === 'finished' ? 'Delivers a finished master and stops only on genuine ambiguity.' : 'Stops after the plan for approval before rendering.'}</p></div>
          <Select label="Loudness" value={draft.loudness} options={[{ value: 'keep', label: 'Keep source loudness' }, { value: 'normalise', label: 'Normalise to -14 LUFS, -1 dBTP' }, { value: 'propose', label: 'Let the editor propose' }]} onChange={(e) => update({ loudness: e.target.value as JobSettings['loudness'] })} />
          <div><Toggle label="Captions" checked={draft.captions} onChange={(captions) => update({ captions })} /><p className="ui-note">Burned in last, inside the safe area.</p></div>
          <div><Toggle label="Allow remote transcription upload" checked={draft.allowRemoteUpload} onChange={(allowRemoteUpload) => update({ allowRemoteUpload })} /><p className="ui-note">Off keeps all media on this machine.</p></div>
          <TextField label="Notes to the editor" multiline value={draft.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="lime-tech without the corner wheels" />
          {draft.skill === 'long-form' && <><div className="field-group"><span className="ui-label">Presenter framing</span><SegmentedControl label="Presenter framing" value={draft.presenterFraming ?? 'full-frame'} options={[{ value: 'full-frame', label: 'Full frame allowed' }, { value: 'never-full-frame', label: 'Never full frame' }]} onChange={(presenterFraming) => update({ presenterFraming })} />{draft.presenterFraming === 'never-full-frame' && <p className="ui-note">For tutorial-angle cameras. You stay in a circle window that moves between stage, corner and off-screen.</p>}</div><Select label="Delivery size" value={draft.delivery} options={[{ value: 'source', label: 'Match source' }, { value: '4k', label: '3840x2160 (4K)' }]} onChange={(e) => update({ delivery: e.target.value as JobSettings['delivery'] })} /></>}
          {draft.skill === 'intro' && <div className="repo-settings"><div className="field-heading"><span className="ui-label">Your own repo screen recordings</span><Button size="sm" onClick={() => update({ repoRecordings: [...(draft.repoRecordings ?? []), { url: '', path: '' }] })}><PlusIcon /> Add repo</Button></div><p className="ui-note">Used instead of a live page capture for that repo.</p>{draft.repoRecordings?.map((repo, index) => <div className="repo-row" key={index}><TextField label={`GitHub URL ${index + 1}`} value={repo.url} error={repo.url && !repoUrlPattern.test(repo.url) ? 'Use https://host/owner/repo' : undefined} onChange={(e) => update({ repoRecordings: draft.repoRecordings?.map((item, i) => i === index ? { ...item, url: e.target.value } : item) })} placeholder="https://github.com/owner/repo" /><PathField api={api} label="Recording path" videoOnly onMedia={(media) => { if (media.kind === 'video') update({ repoRecordings: draft.repoRecordings?.map((item, i) => i === index ? { ...item, path: media.path } : item) }); }} /><div className="repo-row__actions"><Button size="sm" onClick={() => openBrowse(index)}>Browse recording...</Button><IconButton label={`Remove repo ${index + 1}`} icon={<CloseIcon />} size="sm" onClick={() => update({ repoRecordings: draft.repoRecordings?.filter((_, i) => i !== index) })} /></div>{repo.path && <p className="ui-note">{repo.path}</p>}</div>)}</div>}
        </div>
        <footer className="settings-panel__footer"><Button variant="primary" loading={starting} disabled={!canStart} onClick={() => void start()}>Start edit</Button><span className="muted">Output: {outputPath}/</span></footer>
      </>}
    </aside>
    <FileBrowser api={api} open={browseOpen} multiple={draft.skill === 'long-form' && browseRepo === null} allowAudio={draft.skill === 'long-form' && browseRepo === null} onClose={() => setBrowseOpen(false)} onSelect={selectedPaths} />
  </div>;
}
