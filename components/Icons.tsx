// Simple generic glyphs drawn for the clone (not copied from the live site).
type P = React.SVGProps<SVGSVGElement>;
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const SearchIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><circle cx="7" cy="7" r="4.75" {...s} /><path d="M10.5 10.5 14 14" {...s} /></svg>);
export const ArrowDown = (p: P) => (<svg viewBox="0 0 14 14" aria-hidden {...p}><path d="M7 2v10M3 8l4 4 4-4" {...s} /></svg>);
export const ArrowUpRight = (p: P) => (<svg viewBox="0 0 12 12" aria-hidden {...p}><path d="M3.5 8.5l5-5M4 3.5h4.5V8" {...s} /></svg>);
export const PlayIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M5 3.2v9.6L12.6 8z" fill="currentColor" /></svg>);
export const CloseIcon = (p: P) => (<svg viewBox="0 0 18 18" aria-hidden {...p}><path d="M4 9h10" {...s} /></svg>);
export const MenuIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M4 6h8M4 10h8" {...s} /></svg>);
// Spotify-style mark drawn as one even-odd path (disc with three arc bands cut out) — no mask ids needed.
export const SpotifyIcon = (p: P) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <path fillRule="evenodd" fill="currentColor" d="M8 1a7 7 0 1 1 0 14A7 7 0 1 1 8 1Z M4.2 6.5C6.8 5.6 9.6 5.8 11.9 7.1L11.4 8C9.2 6.8 6.8 6.6 4.5 7.4Z M4.8 8.9C7 8.3 9.2 8.5 11.1 9.6L10.6 10.4C9 9.4 7 9.2 5.1 9.8Z M5.3 11.1C6.8 10.7 8.4 10.8 9.8 11.5L9.4 12.2C8.2 11.6 6.9 11.5 5.6 11.8Z" />
  </svg>
);
export const PodcastIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><circle cx="8" cy="6.5" r="2" fill="currentColor" /><path d="M7 9.5h2l-.4 5h-1.2z" fill="currentColor" /><path d="M4.2 10.5a5 5 0 1 1 7.6 0" {...s} /></svg>);
export const VideoIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><rect x="1.5" y="3.5" width="13" height="9" rx="2.5" {...s} /><path d="M7 6v4l3.2-2z" fill="currentColor" /></svg>);
export const iconFor = (name: string) => (name === "spotify" ? SpotifyIcon : name === "youtube" ? VideoIcon : PodcastIcon);
export const ArrowLeft = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M13 8H3M7 4 3 8l4 4" {...s} /></svg>);
export const ArrowRight = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M3 8h10M9 4l4 4-4 4" {...s} /></svg>);
export const PlusIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M8 3v10M3 8h10" {...s} /></svg>);
export const PauseIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor" /></svg>);
export const AppleGlyph = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M11.2 8.4c0-1.5 1.2-2.2 1.3-2.3-.7-1-1.8-1.2-2.2-1.2-.9-.1-1.8.6-2.3.6s-1.2-.5-2-.5C4.9 5 3.9 5.6 3.4 6.6c-1.1 1.9-.3 4.7.8 6.2.5.7 1.1 1.6 1.9 1.5.8 0 1-.5 2-.5s1.2.5 2 .5 1.3-.8 1.8-1.5c.6-.8.8-1.6.8-1.7 0 0-1.5-.6-1.5-2.7zM9.8 3.9c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.8.9-.4.4-.7 1.1-.6 1.8.7.1 1.4-.3 1.8-.8z" fill="currentColor" /></svg>);
export const Skip = ({ back, ...p }: P & { back?: boolean }) => (
  <svg viewBox="0 0 26 26" aria-hidden {...p}>
    <path d={back ? "M13 5a8 8 0 1 1-7.6 5.5M13 5V2L9 5l4 3V5" : "M13 5a8 8 0 1 0 7.6 5.5M13 5V2l4 3-4 3V5"} {...s} />
    <text x="13" y="16.8" textAnchor="middle" fontSize="8.5" fill="currentColor" stroke="none" fontFamily="var(--font-display)">15</text>
  </svg>
);
export const XIcon = (p: P) => (<svg viewBox="0 0 16 16" aria-hidden {...p}><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" {...s} /></svg>);
