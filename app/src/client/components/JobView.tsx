import { useEffect, useMemo, useRef, useState } from 'react';
import type { Check, Job } from '../../shared/types';
import type { Api } from '../api/Api';
import { failureSummaries, formatDuration, phaseLabels, themeName } from '../lib/editor';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CheckIcon, CopyIcon, ErrorIcon, ExternalIcon } from './ui/icons';
import { InlineMessage } from './ui/InlineMessage';
import { Modal } from './ui/Modal';
import { ProgressBar } from './ui/ProgressBar';
import { Spinner } from './ui/Spinner';
import { StatusBadge } from './ui/StatusBadge';
import { TextField } from './ui/TextField';
import { VideoPlayer } from './VideoPlayer';

export function statusLabel(status: Job['status']) {
  return ({ preparing: 'Preparing', processing: 'Processing', 'needs-decision': 'Needs decision', complete: 'Complete', failed: 'Failed', cancelled: 'Cancelled' })[status];
}

export function statusTone(status: Job['status']): 'neutral' | 'success' | 'danger' | 'warning' {
  if (status === 'complete') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'needs-decision') return 'warning';
  return 'neutral';
}

function PhaseList({ job }: { job: Job }) {
  return <ol className="phase-list" aria-label="Edit phases">
    {job.phases.map((phase) => <li key={phase.id} className={`phase phase--${phase.state}`}>
      <span className="phase__marker" aria-hidden="true">
        {phase.state === 'active' || phase.state === 'waiting' ? <Spinner size="sm" /> : phase.state === 'done' ? <CheckIcon /> : phase.state === 'failed' ? <ErrorIcon /> : <span />}
      </span>
      <span>{phaseLabels[phase.id]}</span>
      {phase.state === 'waiting' && <span className="phase__state">Waiting</span>}
    </li>)}
  </ol>;
}

function ChecksCard({ checks }: { checks: Check[] }) {
  const passed = checks.filter((check) => check.pass).length;
  const ordered = [...checks].sort((a, b) => Number(a.pass) - Number(b.pass));
  return <Card title="Checks" actions={checks.length ? <span className="muted">{passed} of {checks.length} passed</span> : undefined}>
    {!checks.length && <p className="muted">No verification report</p>}
    <ul className="checks-list">{ordered.map((check) => <li key={check.check} className={check.pass ? 'check check--pass' : 'check check--fail'}>
      <span aria-label={check.pass ? 'Passed' : 'Failed'}>{check.pass ? <CheckIcon /> : <ErrorIcon />}</span>
      <div><strong>{check.check}</strong><p className="muted">{check.detail}</p></div>
    </li>)}</ul>
  </Card>;
}

function ActivityLog({ activity }: { activity: string[] }) {
  const ref = useRef<HTMLPreElement>(null);
  const follow = useRef(true);
  useEffect(() => { if (follow.current && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [activity]);
  return <details className="activity" open>
    <summary>Activity <span className="muted">{activity.length} lines</span></summary>
    <pre ref={ref} tabIndex={0} onScroll={(e) => { const el = e.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < el.clientHeight; }}>{activity.join('\n')}</pre>
  </details>;
}

function ProgressContent({ job, api }: { job: Job; api: Api }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(job.createdAt).getTime()) / 1000);
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [job.createdAt]);
  const active = job.phases.find((phase) => phase.state === 'active' || phase.state === 'waiting');
  return <>
    <div className="job-progress-layout">
      <Card title="Edit progress"><PhaseList job={job} /></Card>
      <div className="job-progress-main">
        <Card>
          <div className="progress-heading"><strong>{job.percent}%</strong><span className="muted">Elapsed {formatDuration(elapsed)}</span></div>
          <ProgressBar label="Overall edit progress" value={job.progressStale ? undefined : job.percent} />
          <p className="active-message">{active?.message ?? 'Preparing the next phase…'}</p>
          <div className="sr-only" aria-live="polite">{active ? phaseLabels[active.id] : ''}</div>
        </Card>
        <ActivityLog activity={job.activity} />
        <div className="job-actions"><Button onClick={() => setCancelOpen(true)}>Cancel</Button></div>
        <p className="muted">You can close this tab. The edit keeps running while the app's server is running.</p>
      </div>
    </div>
    <Modal open={cancelOpen} title="Cancel this edit?" onClose={() => setCancelOpen(false)} footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep editing</Button><Button variant="primary" onClick={() => { void api.cancelJob(job.id); setCancelOpen(false); }}>Cancel edit</Button></>}>
      <p>The editor will stop. Your original footage will not be changed.</p>
    </Modal>
  </>;
}

function DecisionContent({ job, api }: { job: Job; api: Api }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  return <div className="decision-layout">
    <InlineMessage tone="warning" title="The editor needs a decision before rendering">Answer the questions below. The edit will stay paused until you continue.</InlineMessage>
    <div className="job-progress-layout">
      <Card title="Edit progress"><PhaseList job={job} /></Card>
      <div className="questions">{job.questions?.map((question) => <Card key={question.id} title={question.text}>
        {question.context && <p className="question-context">{question.context}</p>}
        {question.options && <div className="question-options">{question.options.map((option) => <Button key={option} variant={answers[question.id] === option ? 'primary' : 'secondary'} onClick={() => setAnswers({ ...answers, [question.id]: option })}>{option}</Button>)}</div>}
        <TextField label="Your answer" value={answers[question.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} placeholder="Choose an option or write an answer" />
      </Card>)}
      <Button variant="primary" loading={sending} disabled={!job.questions?.every((question) => answers[question.id]?.trim())} onClick={() => { setSending(true); void api.answerQuestions(job.id, answers).finally(() => setSending(false)); }}>Send answers and continue</Button>
      </div>
    </div>
  </div>;
}

function CompleteContent({ job, api }: { job: Job; api: Api }) {
  const [copied, setCopied] = useState(false);
  const result = job.result!;
  return <div className="complete-layout">
    <VideoPlayer api={api} path={result.masterPath} />
    <div className="result-grid">
      <ChecksCard checks={result.checks} />
      <Card title="Details"><dl className="details-list">
        <div><dt>Theme</dt><dd>{themeName(job)}</dd></div><div><dt>Duration</dt><dd>{formatDuration(result.durationS)}</dd></div>
        <div><dt>Resolution</dt><dd>{result.width}×{result.height}</dd></div><div><dt>Frame rate</dt><dd>{result.fps} fps</dd></div>
        {result.cost !== undefined && <div><dt>Cost</dt><dd>${result.cost.toFixed(4)}</dd></div>}
        <div><dt>Output</dt><dd className="mono">{result.projectDir}</dd></div>
      </dl></Card>
    </div>
    <div className="job-actions"><Button onClick={() => void api.reveal(result.projectDir)}><ExternalIcon /> Reveal in Finder</Button><Button onClick={() => { void navigator.clipboard.writeText(result.masterPath); setCopied(true); }}><CopyIcon /> {copied ? 'Copied' : 'Copy path'}</Button></div>
  </div>;
}

function FailedContent({ job, api }: { job: Job; api: Api }) {
  const cancelled = job.status === 'cancelled' || job.failure?.kind === 'cancelled';
  const failure = job.failure ?? { kind: 'agent-error' as const, summary: failureSummaries['agent-error'], details: [] };
  const path = job.result?.projectDir ?? `edit/${job.settings.projectName}/`;
  return <div className="failed-layout">
    <InlineMessage tone={cancelled ? 'info' : 'error'} title={cancelled ? 'Edit cancelled' : 'Edit failed'}>{failure.summary}</InlineMessage>
    <div className="job-progress-layout"><Card title="Edit progress"><PhaseList job={job} /></Card><div className="failure-details">
      {job.result?.checks && <ChecksCard checks={job.result.checks} />}
      <details className="error-disclosure"><summary>Details</summary><pre tabIndex={0}>{failure.details.join('\n')}</pre></details>
    </div></div>
    <div className="job-actions"><Button onClick={() => void api.reveal(path)}><ExternalIcon /> Reveal in Finder</Button><Button onClick={() => void navigator.clipboard.writeText(failure.details.join('\n'))}><CopyIcon /> Copy error</Button></div>
  </div>;
}

export function JobView({ job, api }: { job: Job; api: Api }) {
  const subtitle = useMemo(() => `${job.settings.skill === 'intro' ? 'Intro' : 'Long-form'} · ${themeName(job)}`, [job]);
  return <article className="job-view">
    <header className="job-header"><div><p className="eyebrow">Current edit</p><h1>{job.settings.projectName}</h1><p className="muted">{subtitle}</p></div><StatusBadge tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusBadge></header>
    {job.status === 'preparing' && <div className="preparing-grid"><Card title="Reading footage"><div className="preparing-row"><Spinner /><span>Reading media info...</span><Button size="sm" onClick={() => void api.cancelJob(job.id)}>Cancel file</Button></div></Card><Card title="Copying footage"><div className="progress-heading"><span>Copying into workspace: {job.percent}%</span><Button size="sm" onClick={() => void api.cancelJob(job.id)}>Cancel file</Button></div><ProgressBar label="Copying into workspace" value={job.percent} /></Card></div>}
    {(job.status === 'processing') && <ProgressContent job={job} api={api} />}
    {job.status === 'needs-decision' && <DecisionContent job={job} api={api} />}
    {job.status === 'complete' && <CompleteContent job={job} api={api} />}
    {(job.status === 'failed' || job.status === 'cancelled') && <FailedContent job={job} api={api} />}
  </article>;
}
