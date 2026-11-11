import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname } from 'node:path';
import type { MediaInfo } from '../shared/types.js';
import { HttpError } from './http.js';
import { runCommand } from './process.js';

interface ProbeStream { codec_type?: string; width?: number; height?: number; r_frame_rate?: string; sample_rate?: string; channels?: number; }
interface ProbeOutput { format?: { duration?: string }; streams?: ProbeStream[] }

async function probeWithFfmpeg(path: string): Promise<MediaInfo> {
  const result = await runCommand('ffmpeg', ['-hide_banner', '-i', path]);
  const text = `${result.stdout}\n${result.stderr}`;
  const durMatch = /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(text);
  if (!durMatch) throw new HttpError(400, 'ffmpeg could not determine media duration.');
  const durationS = Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3]);

  const videoMatch = /Stream #\d+:\d+.*?: Video: .*?,\s*(\d{2,5})x(\d{2,5})/.exec(text);
  const fpsMatch = /(\d+(?:\.\d+)?)\s*fps/.exec(text);
  const audioMatch = /Stream #\d+:\d+.*?: Audio: .*?,\s*(\d+)\s*Hz,\s*([^,\n]+)/.exec(text);

  const isVideo = Boolean(videoMatch);
  if (!isVideo && !audioMatch) throw new HttpError(415, 'The file has no video or audio stream.');

  let channels: number | undefined;
  if (audioMatch) {
    const chStr = audioMatch[2].toLowerCase();
    if (chStr.includes('mono')) channels = 1;
    else if (chStr.includes('stereo')) channels = 2;
    else {
      const chNum = /(\d+)/.exec(chStr);
      channels = chNum ? Number(chNum[1]) : 2;
    }
  }

  return {
    path,
    kind: isVideo ? 'video' : 'audio',
    durationS: Math.round(durationS * 1000) / 1000,
    ...(isVideo && videoMatch ? { width: Number(videoMatch[1]), height: Number(videoMatch[2]), fps: `${fpsMatch ? fpsMatch[1] : '30'}/1` } : {}),
    ...(audioMatch ? { sampleRate: Number(audioMatch[1]), channels } : {}),
  };
}

let ffprobeAvailable: boolean | null = null;

export async function probeMedia(path: string): Promise<MediaInfo> {
  const info = await stat(path).catch(() => null);
  if (!info) throw new HttpError(400, 'Source file not found. Choose an existing video or audio file under Source footage. Set the destination separately under Output folder.');
  if (!info.isFile()) throw new HttpError(400, 'This is a folder. Select your video or audio file under Source footage, and use Output folder for the destination.');
  
  if (ffprobeAvailable !== false) {
    const args = ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate,sample_rate,channels', '-of', 'json', path];
    const result = await runCommand('ffprobe', args, { timeoutMs: 1500 });
    if (result.code === 0 && result.stdout) {
      ffprobeAvailable = true;
      try {
        const parsed = JSON.parse(result.stdout) as ProbeOutput;
        const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
        const video = streams.find((stream) => stream.codec_type === 'video');
        const audio = streams.find((stream) => stream.codec_type === 'audio');
        if (video || audio) {
          const durationS = Number(parsed.format?.duration);
          if (Number.isFinite(durationS)) {
            return {
              path,
              kind: video ? 'video' : 'audio',
              durationS,
              ...(video ? { width: video.width, height: video.height, fps: video.r_frame_rate } : {}),
              ...(audio?.sample_rate ? { sampleRate: Number(audio.sample_rate) } : {}),
              ...(audio?.channels ? { channels: audio.channels } : {}),
            };
          }
        }
      } catch {
        // Fall through to ffmpeg
      }
    } else {
      ffprobeAvailable = false;
    }
  }

  // Fallback to ffmpeg if ffprobe is blocked or unavailable
  return probeWithFfmpeg(path);
}

export interface ByteRange { start: number; end: number }
export function parseRange(header: string | undefined, size: number): ByteRange | null | undefined {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!suffix) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return null;
  return { start, end };
}

const contentTypes: Record<string, string> = { '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.aac': 'audio/aac' };

export async function serveMedia(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) throw new HttpError(404, 'Media file not found.');
  const range = parseRange(req.headers.range, info.size);
  if (range === null) {
    res.writeHead(416, { 'Content-Range': `bytes */${info.size}`, 'Accept-Ranges': 'bytes' });
    res.end();
    return;
  }
  const start = range?.start ?? 0;
  const end = range?.end ?? info.size - 1;
  res.writeHead(range ? 206 : 200, {
    'Content-Type': contentTypes[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': end - start + 1,
    'Accept-Ranges': 'bytes',
    ...(range ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {}),
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(path, { start, end }).on('error', () => res.destroy()).pipe(res);
}
