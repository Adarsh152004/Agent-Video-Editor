import { useEffect, useState } from 'react';
import type { Settings, WorkspaceInfo } from '../../shared/types';
import type { Api } from '../api/Api';
import { FileBrowser } from './FileBrowser';
import { Button } from './ui/Button';
import { InlineMessage } from './ui/InlineMessage';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';
import { TextField } from './ui/TextField';

export function SettingsModal({ api, open, onClose, onSaved }: { api: Api; open: boolean; onClose: () => void; onSaved?: (workspace: WorkspaceInfo) => void }) {
  const [settings, setSettings] = useState<Settings>();
  const [workspace, setWorkspace] = useState<WorkspaceInfo>();
  const [browse, setBrowse] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      void api.getSettings().then(setSettings).catch((reason: Error) => setError(reason.message));
      void api.getWorkspace().then(setWorkspace).catch(() => {});
    }
  }, [api, open]);

  async function save() {
    if (!settings) return;
    if (!settings.workspace) { setError('Workspace is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const info = await api.saveSettings(settings);
      setWorkspace(info);
      onSaved?.(info);
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Settings could not be saved.'); } finally { setSaving(false); }
  }

  return <Modal open={open} title="Settings" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} disabled={!settings} onClick={() => void save()}>Save settings</Button></>}>
    {settings ? <div className="settings-form">
      <TextField label="Editor workspace folder" value={settings.workspace} onChange={(e) => setSettings({ ...settings, workspace: e.target.value })} help="Folder containing skills, edit output and the workspace rules." />
      <Button onClick={() => setBrowse(true)}>Browse workspace folders...</Button>
      {workspace?.warning && <InlineMessage tone="warning">{workspace.warning}</InlineMessage>}
      <Select label="Agent CLI" value={settings.agent} options={[{ value: 'kimi', label: 'Kimi Code' }, { value: 'claude', label: 'Claude Code' }, { value: 'codex', label: 'Codex' }]} onChange={(e) => setSettings({ ...settings, agent: e.target.value as Settings['agent'], agentPath: e.target.value, model: '', agentHelp: undefined, capabilities: undefined, resolvedCommand: undefined })} />
      <TextField label="Agent executable path" value={settings.agentPath} onChange={(e) => setSettings({ ...settings, agentPath: e.target.value })} />
      <TextField label="Model" value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })} />
      <TextField label="Python executable" value={settings.python} onChange={(e) => setSettings({ ...settings, python: e.target.value })} help="Use the workspace virtual environment." />
      <TextField label="Resolved agent command" value={settings.resolvedCommand ?? 'Save to detect the installed CLI flags.'} readOnly />
      <p className="ui-note">Capabilities: headless {settings.capabilities?.headless ? 'yes' : 'no'} · JSON stream {settings.capabilities?.jsonStream ? 'yes' : 'no'} · resume {settings.capabilities?.resume ? 'yes' : 'no'}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div> : <p className="muted">Loading settings…</p>}
    <FileBrowser api={api} open={browse} multiple={false} allowAudio={false} foldersOnly onClose={() => setBrowse(false)} onSelect={(paths) => { setSettings((current) => current ? { ...current, workspace: paths[0] } : current); }} />
  </Modal>;
}
