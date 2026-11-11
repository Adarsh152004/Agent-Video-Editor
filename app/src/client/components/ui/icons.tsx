import type { SVGProps } from 'react';
import { tokens } from '../../design/tokens';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = tokens.icon.md, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const FilmIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Icon>
);

export const FolderIcon = (p: IconProps) => <Icon {...p}><path d="M3 6h7l2 2h9v11H3z" /></Icon>;
export const AudioIcon = (p: IconProps) => <Icon {...p}><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></Icon>;
export const FileIcon = (p: IconProps) => <Icon {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /></Icon>;
export const ArrowUpIcon = (p: IconProps) => <Icon {...p}><path d="M12 20V4M5 11l7-7 7 7" /></Icon>;
export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="M5 12l4 4L19 6" /></Icon>;
export const ErrorIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></Icon>;
export const GripIcon = (p: IconProps) => <Icon {...p}><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></Icon>;
export const PlayIcon = (p: IconProps) => <Icon {...p}><path d="M8 5l11 7-11 7z" /></Icon>;
export const PauseIcon = (p: IconProps) => <Icon {...p}><path d="M9 5v14M15 5v14" /></Icon>;
export const VolumeIcon = (p: IconProps) => <Icon {...p}><path d="M5 10v4h4l5 4V6l-5 4zM17 9c1 2 1 4 0 6" /></Icon>;
export const MuteIcon = (p: IconProps) => <Icon {...p}><path d="M5 10v4h4l5 4V6l-5 4zM17 9l5 6M22 9l-5 6" /></Icon>;
export const FullscreenIcon = (p: IconProps) => <Icon {...p}><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /></Icon>;
export const CopyIcon = (p: IconProps) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></Icon>;
export const ExternalIcon = (p: IconProps) => <Icon {...p}><path d="M14 4h6v6M20 4l-9 9M18 13v7H4V6h7" /></Icon>;
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="M9 5l7 7-7 7" /></Icon>;

export const HomeIcon = (p: IconProps) => <Icon {...p}><path d="M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></Icon>;
export const MoonIcon = (p: IconProps) => <Icon {...p}><path d="M20 15.4A9 9 0 0 1 8.6 4 9 9 0 1 0 20 15.4Z" /></Icon>;
export const SunIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></Icon>;
