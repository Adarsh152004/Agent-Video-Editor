import type { JobSettings, Question } from '../shared/types.js';

const approvalLines = {
  finished: 'Finished cut: deliver the finished master without waiting for plan approval. Stop and ask only for genuine ambiguity, as the skill requires.',
  'review-plan': 'Review plan first: after writing and validating director-treatment.md and editorial-directive.json, stop and ask for approval before rendering.',
};
const loudnessLines = {
  keep: 'Keep the source loudness; report the measured LUFS.',
  normalise: 'Normalise to about -14 LUFS with a -1 dBTP ceiling.',
  propose: 'Measure, and propose a target as an open question.',
};

function commonFields(settings: JobSettings): string {
  return `- Approval mode: ${approvalLines[settings.approvalMode]}
- Loudness: ${loudnessLines[settings.loudness]}
- Captions: ${settings.captions ? 'Burn in captions last, inside the safe area.' : 'None.'}
- Remote upload: ${settings.allowRemoteUpload ? 'Allowed for transcription only. Record it in the project manifest.' : 'Not allowed. Transcribe locally.'}`;
}

function protocols(settings: JobSettings, output: string): string {
  const phases = settings.skill === 'intro' ? 'intake|transcribe|brand-assets|repo-captures|directive|validate|graphics|composite|verify|deliver' : 'intake|transcribe|brand-assets|directive|validate|graphics|composite|verify|deliver';
  return `
Progress protocol (required). Append one JSON object per line to ${output}/ui-progress.jsonl, whenever you start a phase and whenever you make measurable progress (at least every 2 minutes during renders):
{"t":"<ISO 8601>","phase":"<${phases}>","percent":<0-100 within this phase, or null>,"message":"<under 80 chars>"}
Mark a phase you do not need with {"phase":"<id>","skipped":true,"message":"<why>"}.

Decisions. If the skill requires you to stop and ask (approval mode, an ambiguity, a missing official logo, an unconfirmed repo, narration that contradicts a repo page), first write ${output}/ui-question.json:
{"questions":[{"id":"q1","text":"<the question>","context":"<what you found, with the timestamp>","options":["<option>","..."]}],"plan":"director-treatment.md"}
Then stop without rendering.

Finish. When done, write ${output}/ui-result.json:
{"status":"complete","master":"<path relative to the project folder>","checks":"<checks.json path>"}
If you cannot finish, write:
{"status":"failed","kind":"<missing-tool|disk-full|invalid-plan|repo-capture|verification|agent-error>","phase":"<phase id>","summary":"<one line>","details":["<exact error lines>"]}`;
}

function cleanPath(p: string): string {
  return p.replace(/\\/g, '/');
}

export function buildPrompt(settings: JobSettings, skillsDir: string, python: string, output = `edit/${settings.projectName}`): string {
  const cleanSkillsDir = cleanPath(skillsDir);
  const cleanPython = cleanPath(python);
  const cleanOutput = cleanPath(output);
  const intro = settings.skill === 'intro';
  const skillName = intro ? 'presenter-intro-editor' : 'presenter-long-form-editor';
  const sourcePath = cleanPath(settings.sections[0]?.path || '');
  let source: string;
  if (intro) {
    const media = settings.sections[0]?.media;
    if (!media) throw new Error('Intro source has not been probed.');
    source = `- Source: a locked final cut, never altered: "${cleanPath(settings.sections[0].path)}" (${media.width}x${media.height}, ${media.fps} fps, ${media.durationS} s).`;
  } else {
    source = `- Sections, in program order (assemble them without trimming, reordering or retiming):\n${settings.sections.map((section, index) => {
      const media = section.media;
      if (!media) throw new Error('A section has not been probed.');
      const details = section.kind === 'camera' ? `, ${media.width}x${media.height}, ${media.fps} fps` : '';
      return `  ${index + 1}. ${section.kind} "${cleanPath(section.path)}" (${media.durationS} s${details})`;
    }).join('\n')}`;
  }
  const repo = intro ? `- The user's own repo screen recordings: ${settings.repoRecordings?.length ? settings.repoRecordings.map((item) => `${item.url} -> "${cleanPath(item.path)}"`).join('; ') : 'None.'}\n` : '';
  const framing = intro ? '' : `- Presenter framing: ${settings.presenterFraming === 'never-full-frame' ? "Never full frame: use the masked circle window (stage, corner, below) for the whole video, per the skill's Presenter mask rules." : 'Full frame allowed.'}\n- Delivery: ${settings.delivery === '4k' ? "3840x2160, source fps; record it in the directive's delivery field." : 'Match the source.'}\n`;
  return `You are running headless, started by the Agent Video Editor app. Nobody can answer you mid-run except through the files below. Do not stop to converse, explain what you will do next, or ask conversational questions in text: always immediately invoke the tools required to proceed through every workflow step until ui-result.json or ui-question.json is written.

CRITICAL INSTRUCTIONS FOR BASH ON WINDOWS:
1. ALWAYS use forward slashes ('/') in ALL file paths and bash commands. NEVER use backslashes ('\\') in bash, because bash treats backslashes as escape characters and strips them.
2. The workspace virtual environment Python executable is: "${cleanPython}". Always run Python scripts using:
"${cleanPython}" "<script-path>" ...
3. Always enclose all file paths in double quotes to handle spaces and special characters.
4. Pre-made helper scripts are provided in the skill directory:
   - Whisper transcription: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/transcribe.py" "${sourcePath}" "${cleanOutput}"
   - Clean Tech 3D/Manim/SFX Master Renderer: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/render_clean_tech.py" "${cleanOutput}" "${sourcePath}" "${settings.theme}"
   - Brand assets: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/brand-assets.py" "${cleanOutput}" "${settings.theme}"
   - Graphics: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/graphics.py" "${cleanOutput}"
   - Composite: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/composite.py" "${cleanOutput}"
   - Verify: "${cleanPython}" "${cleanSkillsDir}/presenter-long-form-editor/scripts/verify.py" "${cleanOutput}"
5. For the Clean Tech theme or an explainer video with motion graphics, running the Clean Tech Master Renderer command above produces the full 16:9 widescreen master output.mp4, checks.json, and ui-result.json directly.
6. Offline environment: Do not attempt to pip install packages from PyPI. Use the pre-installed tools in "${cleanPython}" and ffmpeg.
7. NEVER write ui-result.json with status "complete" until the rendered master video file output.mp4 is actually created and verified to exist on disk with ffprobe. If rendering fails, report the error or write status "failed".
8. If previous artifacts (transcription, captions.srt, director-treatment.md, editorial-directive.json) already exist in ${cleanOutput}/, REUSE THEM. Do not redo completed work.

Use the skill at ${cleanSkillsDir}/${skillName}/. Read its SKILL.md and every reference it links, and follow its Required workflow exactly. When the workflow says to load video-use or the Remotion guidance, read ${cleanSkillsDir}/video-use/SKILL.md and the Remotion skills in ${cleanSkillsDir}/; if one is missing, continue without it and say so in ui-progress.jsonl. Follow CLAUDE.md (and AGENTS.md, if present) at the workspace root.

Use "${cleanPython}" for every Python command, including the skill's scripts. If the skill points to a file that does not exist in this workspace, build from the written specification in brand-system.md instead.

The user has already answered these in the app. Do not ask again:
- Project name: ${settings.projectName}. Write everything under ${output}/. This is the destination selected by the user in the app; use it for all output and progress files, replacing any default edit/<project> path in the skill.
${source}
- Theme: ${settings.theme}. Chosen by the user in the app; this answers the theme selection prompt. Record it as "theme" in editorial-directive.json.
${commonFields(settings)}
${repo}${framing}- Notes from the user: ${settings.notes || 'None.'}
${protocols(settings, output)}`;
}

export function buildAnswerPrompt(questions: Question[], answers: Record<string, string>): string {
  return `The user answered in the app:\n${questions.map((question) => `- ${question.text}: ${answers[question.id] ?? ''}`).join('\n')}\nDelete ui-question.json, then continue the workflow from where you stopped, keeping the same progress and finish protocol.`;
}

export function buildRestartPrompt(original: string, answerPrompt: string, projectDir: string): string {
  return `${original}\n\n${answerPrompt}\nArtefacts already present in ${projectDir} must be reused; do not repeat completed work.`;
}
