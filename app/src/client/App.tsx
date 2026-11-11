import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Job, WorkspaceInfo } from '../shared/types';
import { api } from './api';
import { clientToken } from './api/auth';
import Gallery from './Gallery';
import { HomeEmpty } from './components/HomeEmpty';
import { JobView, statusLabel, statusTone } from './components/JobView';
import { NewEdit } from './components/NewEdit';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { FilmIcon, PlusIcon, SettingsIcon, HomeIcon, MoonIcon, SunIcon } from './components/ui/icons';
import { IconButton } from './components/ui/IconButton';
import { InlineMessage } from './components/ui/InlineMessage';
import { StatusBadge } from './components/ui/StatusBadge';
import { preferredColorMode, saveColorMode } from './design/appearance';
import { tokens } from './design/tokens';
import { themeName } from './lib/editor';
import './app.css';

const wideQuery = `(min-width: ${tokens.layout.minWidth}px)`;
const subscribe = (cb: () => void) => {
  const mq = matchMedia(wideQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

function useHash(): string {
  return useSyncExternalStore((cb) => { addEventListener('hashchange', cb); return () => removeEventListener('hashchange', cb); }, () => location.hash || '#/');
}

function relativeTime(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function App() {
  const wide = useSyncExternalStore(subscribe, () => matchMedia(wideQuery).matches);
  const [accessToken] = useState(clientToken);
  const hash = useHash();
  const [colorMode, setColorMode] = useState(preferredColorMode);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  const hasAccess = Boolean(accessToken) || import.meta.env.VITE_MOCK === '1';

  useEffect(() => {
    if (!hasAccess) return;
    void api.listJobs().then(setJobs).catch(() => {});
    void api.getWorkspace().then((info) => {
      setWorkspace(info);
      setWorkspaceLoaded(true);
      if (!info.workspace) setSettingsOpen(true);
    }).catch(() => {});
    const offJob = api.onJobUpdate((job) => setJobs((current) => current.some((item) => item.id === job.id) ? current.map((item) => item.id === job.id ? job : item) : [job, ...current]));
    const offConnection = api.onConnectionChange((value) => { setConnected(value); if (value) void api.listJobs().then(setJobs); });
    return () => { offJob(); offConnection(); };
  }, [hasAccess]);

  if (!hasAccess) return <main className="app-shell"><EmptyState title="Authenticated link required" description="Use the link printed in the terminal to open Agent Video Editor." /></main>;
  if (!wide) return <p className="narrow-notice">Widen the window to use the editor</p>;
  if (workspaceLoaded && !workspace?.workspace) return <SettingsModal api={api} open onClose={() => {}} onSaved={(info) => { setWorkspace(info); setSettingsOpen(false); }} />;

  const route = hash.replace(/^#\//, '');
  const jobId = route.startsWith('jobs/') ? decodeURIComponent(route.slice(5)) : null;
  const selected = jobId ? jobs.find((job) => job.id === jobId) : undefined;
  const gallery = route === 'gallery';
  const jobRunning = jobs.some((job) => job.status === 'preparing' || job.status === 'processing');

  return <div className="editor-shell">
    <aside className="sidebar">
      <a className="sidebar__brand" href="#/" aria-label="Agent Video Editor home"><span className="brand-mark"><FilmIcon /></span><div><strong>Agent</strong><span>Video Editor</span></div></a>
      <a className="sidebar-home" href="#/" aria-current={route === '' ? 'page' : undefined}><HomeIcon /> Home</a>
      <Button variant="primary" className="new-edit-button" onClick={() => { location.hash = '#/new'; }}><PlusIcon /> New edit</Button>
      <div className="sidebar__section-label"><span>Your edits</span><span>{jobs.length}</span></div>
      <nav className="job-nav" aria-label="Edit jobs">{jobs.map((job) => <Button key={job.id} className={selected?.id === job.id ? 'job-nav-row job-nav-row--selected' : 'job-nav-row'} onClick={() => { location.hash = `#/jobs/${encodeURIComponent(job.id)}`; }}>
        <span className="job-nav-row__top"><strong>{job.settings.projectName}</strong><span className="job-nav-row__time">{relativeTime(job.createdAt)}</span></span>
        <span className="job-nav-row__meta">{job.settings.skill === 'intro' ? 'Intro' : 'Long-form'} · {themeName(job)}</span>
        <StatusBadge tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusBadge>
      </Button>)}</nav>
      <footer className="sidebar__footer"><IconButton label="Settings" icon={<SettingsIcon />} onClick={() => setSettingsOpen(true)} /><span>Local workspace</span><span className={connected ? 'connection-dot' : 'connection-dot connection-dot--off'} aria-label={connected ? 'Connected' : 'Disconnected'} /></footer>
    </aside>
    <div className="workspace"><header className="workspace-topbar"><span>WORKSPACE <span className="muted">/ {route === 'new' ? 'Create an edit' : 'Your studio'}</span></span><div className="workspace-topbar__actions"><span className="studio-status"><span className="connection-dot" /> Local-first video studio</span><Button size="sm" aria-pressed={colorMode === 'dark'} aria-label="Dark mode" onClick={() => { const next = colorMode === 'dark' ? 'light' : 'dark'; saveColorMode(next); setColorMode(next); }}>{colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}{colorMode === 'dark' ? 'Light mode' : 'Dark mode'}</Button></div></header>
      {!connected && <div className="connection-banner"><InlineMessage tone="warning">Disconnected from the editor server. Reconnecting...</InlineMessage></div>}
      <div className="workspace__content">
        {gallery ? <Gallery api={api} jobs={jobs} /> : route === 'new' ? <NewEdit api={api} workspace={workspace} jobRunning={jobRunning} onStarted={(job) => { setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]); location.hash = `#/jobs/${job.id}`; }} /> : selected ? <JobView job={selected} api={api} /> : jobId ? <EmptyState title="Edit not found" description="This edit is not in the current server session." action={<Button variant="primary" onClick={() => { location.hash = '#/new'; }}>New edit</Button>} /> : <HomeEmpty api={api} />}
      </div>
    </div>
    <SettingsModal api={api} open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={setWorkspace} />
  </div>;
}
