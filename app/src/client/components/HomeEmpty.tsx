import { useState } from 'react';
import type { MediaInfo } from '../../shared/types';
import type { Api } from '../api/Api';
import { FileBrowser } from './FileBrowser';
import { FootageDropZone } from './NewEdit';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { FilmIcon, PlusIcon } from './ui/icons';
import { ProgressBar } from './ui/ProgressBar';

export function HomeEmpty({ api }: { api: Api }) {
  const [browse, setBrowse] = useState(false);
  const [media, setMedia] = useState<MediaInfo>();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>();
  function add(path: string) { setError(''); void api.probe(path).then(setMedia).catch((reason: Error) => setError(reason.message)); }
  function drop(files: File[]) {
    const file = files[0];
    if (!file) return;
    setProgress(0);
    void api.uploadFile(file, setProgress).then((info) => { setMedia(info); setProgress(undefined); }).catch((reason: Error) => { setError(reason.message); setProgress(undefined); });
  }
  return <div className="home-empty">
    <header className="home-intro"><p className="eyebrow">YOUR PERSONAL VIDEO STUDIO</p><h1>Good stories deserve<br />a great edit.</h1><p className="muted">Bring your footage. Find your style. Make it yours.</p></header>
    <Card><EmptyState icon={<FilmIcon />} title="Your next story starts here" description="Choose Intro or Long-form, pick a theme, and add your footage." action={<Button variant="primary" onClick={() => { location.hash = '#/new'; }}><PlusIcon /> New edit</Button>} /></Card>
    <section className="empty-footage" aria-label="Add footage"><FootageDropZone onBrowse={() => setBrowse(true)} onDrop={drop} /><p className="muted">Dropped files are copied into the workspace. Use Browse to edit them in place.</p>{progress !== undefined && <ProgressBar label="Copying into workspace" value={progress * 100} />}{error && <p className="form-error" role="alert">{error}</p>}{media && <p className="ui-note">Ready: {media.path} · {media.durationS.toFixed(1)} sec</p>}</section>
    <FileBrowser api={api} open={browse} multiple={false} allowAudio onClose={() => setBrowse(false)} onSelect={(paths) => add(paths[0])} />
  </div>;
}
