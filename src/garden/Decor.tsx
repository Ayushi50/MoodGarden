export const DECOR = [
  { kind: 'lantern', name: 'Paper lantern', text: 'Glows softly after dusk.' },
  { kind: 'pot', name: 'Clay pot', text: 'A little pot of wild blooms.' },
  { kind: 'birdbath', name: 'Bird bath', text: 'Visitors like a place to splash.' },
  { kind: 'fountain', name: 'Stone fountain', text: 'A gentle, endless trickle.' },
  { kind: 'cairn', name: 'Stone cairn', text: 'Balanced, patient, quiet.' },
  { kind: 'signpost', name: 'Wooden signpost', text: 'It points to “somewhere nice”.' },
]

export function DecorArt({ kind, night }: { kind: string; night?: boolean }) {
  switch (kind) {
    case 'lantern': return (
      <g>
        <circle cy="-52" r="38" fill="url(#lanternglow)" style={{ opacity: night ? 1 : 0, transition: 'opacity 2s' }} />
        <rect x="-2" y="-46" width="4" height="48" fill="#5E5A52" />
        <path d="M-10 -66 L10 -66 L8 -46 L-8 -46Z" fill="#F6DD92" stroke="#5E5A52" strokeWidth="2" />
        <path d="M-12 -66 L0 -78 L12 -66Z" fill="#5E5A52" />
      </g>)
    case 'pot': return (
      <g>
        <path d="M0 -30 C-6 -50 -16 -52 -14 -62 C-8 -58 -2 -48 0 -30 M0 -30 C8 -52 18 -50 16 -64 C8 -58 2 -46 0 -30" stroke="#6F9A5E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {[[-14, -64, '#E48B6D'], [16, -66, '#F3D275'], [1, -58, '#B9A5D4']].map(([x, y, c], i) => <circle key={i} cx={+x} cy={+y} r="6" fill={c as string} />)}
        <path d="M-17 -30 H17 L13 0 H-13Z" fill="#C0825E" stroke="#8F5A3C" strokeWidth="1.2" /><rect x="-19" y="-34" width="38" height="8" rx="3" fill="#CF9170" />
      </g>)
    case 'birdbath': return (
      <g>
        <path d="M-5 0 H5 L3 -34 H-3Z" fill="#B9B1A1" /><ellipse cy="2" rx="16" ry="4" fill="#A59C8C" />
        <path d="M-26 -36 Q0 -22 26 -36 L22 -40 H-22Z" fill="#C9C1B1" /><ellipse cy="-39" rx="23" ry="5" fill="#9CC4CF" /><ellipse cy="-40" rx="14" ry="2" fill="#fff" opacity=".4" />
      </g>)
    case 'fountain': return (
      <g>
        <ellipse cy="0" rx="34" ry="9" fill="#A59C8C" /><ellipse cy="-4" rx="30" ry="7" fill="#9CC4CF" />
        <rect x="-4" y="-40" width="8" height="38" fill="#B9B1A1" /><ellipse cy="-42" rx="14" ry="4" fill="#C9C1B1" />
        <path d="M0 -44 Q-10 -62 -22 -40 M0 -44 Q10 -62 22 -40 M0 -44 V-60" stroke="#CDE6EE" strokeWidth="2.4" fill="none" className="shimmer" strokeLinecap="round" />
      </g>)
    case 'cairn': return (
      <g>
        <ellipse cy="-6" rx="20" ry="9" fill="#9E968A" /><ellipse cy="-16" rx="15" ry="7" fill="#B3AB9D" /><ellipse cy="-25" rx="10" ry="5.5" fill="#C4BDAE" /><ellipse cy="-32" rx="6" ry="4" fill="#A9A294" />
      </g>)
    default: return (
      <g>
        <rect x="-3" y="-66" width="6" height="68" fill="#8A6A4E" />
        <path d="M-2 -62 H34 L40 -54 L34 -46 H-2Z" fill="#C9A47A" stroke="#8A6A4E" /><path d="M2 -42 H-30 L-36 -34 L-30 -26 H2Z" fill="#B8936B" stroke="#8A6A4E" />
        <path d="M6 -55 h20 M-24 -35 h18" stroke="#6b4f38" strokeWidth="1.6" strokeLinecap="round" />
      </g>)
  }
}
