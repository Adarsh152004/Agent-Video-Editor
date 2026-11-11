import { useState } from 'react';
import type { FailureKind, Job, JobStatus } from '../shared/types';
import type { Api } from './api/Api';
import { createMockJob, MockApi } from './api/mockApi';
import { HomeEmpty } from './components/HomeEmpty';
import { JobView } from './components/JobView';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Select } from './components/ui/Select';

const scenarios: { value: string; label: string; status?: JobStatus; failure?: FailureKind }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'preparing', label: 'Preparing — probing and upload', status: 'preparing' },
  { value: 'processing', label: 'Processing', status: 'processing' },
  { value: 'needs-decision', label: 'Needs your decision', status: 'needs-decision' },
  { value: 'complete', label: 'Complete', status: 'complete' },
  { value: 'missing-tool', label: 'Failed — missing tool', status: 'failed', failure: 'missing-tool' },
  { value: 'disk-full', label: 'Failed — disk full', status: 'failed', failure: 'disk-full' },
  { value: 'invalid-plan', label: 'Failed — invalid plan', status: 'failed', failure: 'invalid-plan' },
  { value: 'repo-capture', label: 'Failed — repo capture', status: 'failed', failure: 'repo-capture' },
  { value: 'verification', label: 'Failed — verification', status: 'failed', failure: 'verification' },
  { value: 'agent-error', label: 'Failed — editor stopped', status: 'failed', failure: 'agent-error' },
  { value: 'cancelled', label: 'Cancelled by you', status: 'cancelled', failure: 'cancelled' },
  { value: 'disconnected', label: 'Disconnected banner', status: 'processing' },
];

export default function Gallery({ api, jobs }: { api: Api; jobs: Job[] }) {
  const [scenarioValue, setScenarioValue] = useState('processing');
  const [jobId, setJobId] = useState('');
  const [injected, setInjected] = useState<Job>();
  const scenario = scenarios.find((item) => item.value === scenarioValue)!;
  const preview = injected ?? (scenario.status ? createMockJob(scenario.status, scenario.failure) : undefined);
  function choose(value: string) {
    setScenarioValue(value);
    setInjected(undefined);
    if (api instanceof MockApi) api.setConnected(value === 'disconnected' ? false : true);
  }
  function apply() {
    if (!(api instanceof MockApi) || !jobId || !scenario.status) return;
    api.setJobState(jobId, scenario.status, scenario.failure);
    setInjected({ ...createMockJob(scenario.status, scenario.failure), id: jobId });
  }
  return <div className="state-gallery">
    <header className="gallery-header"><div><p className="eyebrow">Development menu</p><h1>Every editor state</h1><p className="muted">Preview a state or inject it into any mock job.</p></div><Select label="Visible state" value={scenarioValue} options={scenarios} onChange={(e) => choose(e.target.value)} /></header>
    {api instanceof MockApi && <Card title="Jump a mock job"><div className="gallery-injector"><Select label="Job" value={jobId} options={[{ value: '', label: 'Choose a job' }, ...jobs.map((job) => ({ value: job.id, label: job.settings.projectName }))]} onChange={(e) => setJobId(e.target.value)} /><Button variant="primary" disabled={!jobId || !scenario.status} onClick={apply}>Apply state</Button></div></Card>}
    <div className="gallery-preview">{preview ? <JobView key={`${preview.id}-${preview.status}-${preview.failure?.kind}`} job={preview} api={api} /> : <HomeEmpty api={api} />}</div>
  </div>;
}
