// A small, consistent set of hand-drawn-style line icons standing in for
// every emoji in the app. Same stroke weight and corner treatment throughout
// so they read as one family rather than a mixed icon-font grab-bag.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(props: IconProps) {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5" />
      <path d="M11 6 5 12l6 6" />
    </svg>
  );
}

export function SunburstIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M22 12h-3M5 12H2" />
      <path d="M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2 12.6 12.6 9.2 14.8 11.4 11.4Z" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SuitcaseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="8.5" width="17" height="11" rx="1.6" />
      <path d="M9 8.5V6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6v2.5" />
      <path d="M3.5 13.5h17" />
    </svg>
  );
}

export function TentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 19.5 12 5l8.5 14.5Z" />
      <path d="M12 5v14.5" />
      <path d="M9.3 19.5 12 13l2.7 6.5" />
    </svg>
  );
}

export function MountainIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 19h18" />
      <path d="M4.5 19 10 8l3 5.5" />
      <path d="M11.5 19 15.5 11 20 19" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 18C6 10 10 4.5 19 4.5 19 13 13 18 6 18Z" />
      <path d="M7 17c3-4 6-7 11-12" />
    </svg>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 3.5 3.7 9.7l6.1 2.1 2.1 6.1Z" />
      <path d="M9.8 11.8 21 3.5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.6" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="9.5" rx="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
      <path d="M4 6.5 12 13l8-6.5" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 3.5v17" />
      <path d="M5.5 4.5c3-1.5 5 1.5 8 0s5 1.5 5 1.5v8c-2-1.5-4-1.5-5-1.5-3 1.5-5-1.5-8 0Z" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 14.4 9.6 21 10.2 16 14.3 17.6 20.7 12 17.2 6.4 20.7 8 14.3 3 10.2 9.6 9.6Z" />
    </svg>
  );
}

export function ChecklistIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="1.6" />
      <path d="M7.5 12l2 2 4-4.5" />
    </svg>
  );
}

export function NoEntryIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.5 6.5l11 11" />
    </svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9a2 2 0 0 0 0-3.8V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v.2a2 2 0 0 0 0 3.8v6a2 2 0 0 0 0 3.8v.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-.2a2 2 0 0 0 0-3.8Z" />
      <path d="M14 5v14" strokeDasharray="1.5 2.2" />
    </svg>
  );
}

export function HikingBootIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4v8.5c0 1-0.4 1.6-1.2 2.3l-2 1.7c-.6.5-.3 1.5.5 1.5H20c.6 0 .8-.8.3-1.2l-3-2.3a3 3 0 0 1-1.3-2.5V8" />
      <path d="M6 8h9.5" />
      <path d="M6 4h5" />
    </svg>
  );
}

export function PalmTreeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21V10.5" />
      <path d="M12 11c-2-3-5-3.5-7.5-2.3 1.7 2.6 4.6 3 7.5 2.3Z" />
      <path d="M12 11c2-3 5-3.5 7.5-2.3-1.7 2.6-4.6 3-7.5 2.3Z" />
      <path d="M12 10.5c-.7-2.6.3-4.8 2.3-6.3-2.7-.5-5 1-5.3 3.8" />
    </svg>
  );
}

export function MuseumIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M4.5 9.5v9M8 9.5v9M12 9.5v9M16 9.5v9M19.5 9.5v9" />
      <path d="M3 19h18" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18.5 14.5A7.5 7.5 0 1 1 10 4a6 6 0 0 0 8.5 10.5Z" />
    </svg>
  );
}

export function ForkKnifeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 3.5v7.5a1.8 1.8 0 0 0 1.8 1.8h0A1.8 1.8 0 0 0 10 11V3.5" />
      <path d="M8.1 3.5V12" />
      <path d="M8.1 12v8.5" />
      <path d="M16 3.5c-1.4 1-2 2.7-2 5s.6 3 2 3v9" />
    </svg>
  );
}

export function ShoppingBagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 8.5h14l-1 12H6Z" />
      <path d="M8.5 8.5V6.8a3.5 3.5 0 0 1 7 0v1.7" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="7" width="17" height="12" rx="1.8" />
      <path d="M8.5 7 10 4.5h4L15.5 7" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export function PineTreeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 16.5 10H14l3.5 5.5H14l3 5H6.5l3-5H6L9.5 10H7Z" />
      <path d="M12 20.5v-4.5" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" />
    </svg>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 15.5a8 8 0 1 1 16 0" />
      <path d="M12 15.5 15.5 10" />
      <path d="M4 15.5h16" />
    </svg>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 20.5H5a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h2Z" />
      <path d="M7 11l3.5-7c1.5 0 2.5 1.2 2.2 2.6L12 9.5h5.3a1.6 1.6 0 0 1 1.6 1.9l-1.2 7A1.8 1.8 0 0 1 16.1 20.5H7Z" />
    </svg>
  );
}

export function ThumbsDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3.5H5a1 1 0 0 0-1 1V12a1 1 0 0 0 1 1h2Z" />
      <path d="M7 13l3.5 7c1.5 0 2.5-1.2 2.2-2.6L12 14.5h5.3a1.6 1.6 0 0 0 1.6-1.9l-1.2-7A1.8 1.8 0 0 0 16.1 3.5H7Z" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3 10.8 15 15.8 9.3" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4 21 20H3Z" />
      <path d="M12 10.5v4" />
      <circle cx="12" cy="17" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M6 12a6 6 0 0 0 12 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="6" width="12" height="12" rx="1.6" />
    </svg>
  );
}

export function HouseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11 12 4l8 7" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5V14h4v5.5" />
    </svg>
  );
}

export function PlaneDepartureIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 20.5h17" />
      <path d="M5 14.5 20 8l-2 2.5-9.5 4.5-3-1Z" />
      <path d="M9 14 5 20.5" />
    </svg>
  );
}

export function MoneyBagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 4h5l1.5 3" />
      <path d="M8 7c-2.5 2.6-3.5 5-3.5 7.5A6.5 6.5 0 0 0 11 21h2a6.5 6.5 0 0 0 6.5-6.5c0-2.5-1-4.9-3.5-7.5Z" />
      <path d="M12 10.5v6M10.3 12h3.4M10.3 15h3.4" />
    </svg>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 13.5c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6-0" />
      <path d="M3.5 18c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
    </svg>
  );
}

export function StampIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="2 1.6" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M9.5 12 11 13.7 14.5 10" />
    </svg>
  );
}
