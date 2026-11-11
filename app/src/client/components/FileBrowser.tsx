import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { DirEntry, DirListing } from '../../shared/types';
import type { Api } from '../api/Api';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { AudioIcon, ArrowUpIcon, FileIcon, FilmIcon, FolderIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { Spinner } from './ui/Spinner';

function entryIcon(entry: DirEntry) {
  if (entry.kind === 'dir') return <FolderIcon />;
  if (entry.kind === 'video') return <FilmIcon />;
  if (entry.kind === 'audio') return <AudioIcon />;
  return <FileIcon />;
}

function fileSize(bytes?: number) {
  if (bytes === undefined) return '';
  if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

export interface FileBrowserProps {
  api: Api;
  open: boolean;
  multiple: boolean;
  allowAudio: boolean;
  foldersOnly?: boolean;
  title?: string;
  initialPath?: string;
  onClose: () => void;
  onSelect: (paths: string[]) => void;
}

export function FileBrowser({ api, open, multiple, allowAudio, foldersOnly = false, title, initialPath, onClose, onSelect }: FileBrowserProps) {
  const [listing, setListing] = useState<DirListing>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function load(path?: string) {
    setLoading(true);
    setError('');
    try {
      const next = await api.listDir(path);
      setListing(next);
      localStorage.setItem('agent-video-editor-last-folder', next.path);
      setSelected(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open this folder.');
      if (path) {
        const fallback = await api.listDir();
        setListing(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load(initialPath ?? localStorage.getItem('agent-video-editor-last-folder') ?? undefined);
  }, [open]);

  function activate(entry: DirEntry) {
    if (entry.kind === 'dir') { void load(entry.path); return; }
    if (foldersOnly || entry.kind === 'other' || (!allowAudio && entry.kind === 'audio')) return;
    setSelected((current) => {
      if (!multiple) return new Set([entry.path]);
      const next = new Set(current);
      if (next.has(entry.path)) next.delete(entry.path); else next.add(entry.path);
      return next;
    });
  }

  function focusRow(index: number) {
    const row = listRef.current?.querySelector<HTMLButtonElement>(`[data-row="${index}"]`);
    row?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!listing) return;
    const active = Number((document.activeElement as HTMLElement)?.dataset.row ?? 0);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusRow(Math.max(0, Math.min(listing.entries.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = listing.entries[active];
      if (entry) activate(entry);
    } else if (event.key === 'Backspace' && listing.parent) {
      event.preventDefault();
      void load(listing.parent);
    }
  }

  const crumbs = listing?.path.split('/').filter(Boolean) ?? [];
  const choose = () => {
    if (foldersOnly && listing) onSelect([listing.path]);
    else onSelect([...selected]);
    onClose();
  };
  return (
    <Modal open={open} title={title ?? (foldersOnly ? 'Choose workspace folder' : 'Choose footage')} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={foldersOnly ? !listing : !selected.size} onClick={choose}>{foldersOnly ? 'Choose folder' : <>Add {selected.size > 1 ? `${selected.size} files` : 'file'}</>}</Button></>}>
      <div className="file-browser">
        <div className="file-browser__path">
          <IconButton label="Go up one folder" icon={<ArrowUpIcon />} size="sm" disabled={!listing?.parent} onClick={() => listing?.parent && void load(listing.parent)} />
          <div className="file-browser__crumbs" aria-label="Current folder">
            {crumbs.map((crumb, index) => <Button key={crumb} variant="ghost" size="sm" onClick={() => void load(`/${crumbs.slice(0, index + 1).join('/')}`)}>{crumb}</Button>)}
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div ref={listRef} className="file-browser__list" role="listbox" aria-label="Folders and media files" aria-multiselectable={multiple} onKeyDown={onKeyDown}>
          {loading && <div className="file-browser__loading"><Spinner label="Loading folder" /></div>}
          {!loading && listing?.entries.map((entry, index) => {
            const unavailable = (foldersOnly && entry.kind !== 'dir') || entry.kind === 'other' || (!allowAudio && entry.kind === 'audio');
            return <Button key={entry.path} data-row={index} role="option" aria-selected={selected.has(entry.path)} aria-label={`${entry.kind === 'dir' ? 'Open folder' : 'Select file'} ${entry.name}${entry.sizeBytes ? `, ${fileSize(entry.sizeBytes)}` : ''}`} className="file-row" disabled={unavailable} onClick={() => activate(entry)}>
              <span className="file-row__icon">{entryIcon(entry)}</span><span className="file-row__name">{entry.name}</span><span className="file-row__size">{fileSize(entry.sizeBytes)}</span>
            </Button>;
          })}
        </div>
        <p className="muted">Arrow keys move · Enter opens or selects · Backspace goes up</p>
      </div>
    </Modal>
  );
}
