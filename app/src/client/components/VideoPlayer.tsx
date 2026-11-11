import { useEffect, useRef, useState } from 'react';
import type { Api } from '../api/Api';
import { formatDuration } from '../lib/editor';
import { IconButton } from './ui/IconButton';
import { FullscreenIcon, MuteIcon, PauseIcon, PlayIcon, VolumeIcon } from './ui/icons';
import { Scrubber } from './ui/Scrubber';

export function VideoPlayer({ api, path }: { api: Api; path: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play(); else video.pause();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) { event.preventDefault(); toggle(); }
    }
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return <div ref={frameRef} className="player">
    <video ref={videoRef} className="player__video" src={api.mediaUrl(path)} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onClick={toggle} aria-label="Finished master video" />
    <div className="player__controls">
      <IconButton label={playing ? 'Pause video' : 'Play video'} icon={playing ? <PauseIcon /> : <PlayIcon />} onClick={toggle} />
      <span className="player__time">{formatDuration(time)}</span>
      <Scrubber label="Video position" value={time} max={duration} onChange={(value) => { if (videoRef.current) videoRef.current.currentTime = value; setTime(value); }} />
      <span className="player__time">{formatDuration(duration)}</span>
      <IconButton label={muted ? 'Unmute video' : 'Mute video'} icon={muted ? <MuteIcon /> : <VolumeIcon />} onClick={() => { if (videoRef.current) videoRef.current.muted = !muted; setMuted(!muted); }} />
      <IconButton label="Enter fullscreen" icon={<FullscreenIcon />} onClick={() => void frameRef.current?.requestFullscreen()} />
    </div>
  </div>;
}
