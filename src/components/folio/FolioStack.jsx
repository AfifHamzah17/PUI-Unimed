import { useCallback, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

/**
 * Objek 3D hero: lima lembar "folio" berlapis yang mewakili isi pusat ini
 * (riset, literasi, seni tenun, notasi, dan lambang UNIMED di depan).
 * Murni CSS 3D: tanpa three.js, jadi tidak menambah beban bundel.
 * Kursor memiringkan seluruh tumpukan; di layar sentuh tumpukan berayun sendiri.
 */

function MotifRiset() {
  const bars = [34, 52, 44, 70, 62, 88];
  return (
    <svg viewBox="0 0 200 120" className="mt-4 h-auto w-full" aria-hidden="true">
      {[30, 60, 90].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="white" strokeOpacity=".12" strokeDasharray="3 4" />)}
      {bars.map((h, i) => (
        <rect key={i} x={10 + i * 31} y={110 - h} width="20" height={h} rx="3" fill={i === 5 ? 'rgb(var(--accent))' : 'white'} fillOpacity={i === 5 ? 1 : 0.28} />
      ))}
    </svg>
  );
}

function MotifLiterasi() {
  const widths = [100, 92, 100, 78, 96, 60];
  return (
    <div className="mt-4 flex gap-3" aria-hidden="true">
      <span className="font-display text-6xl leading-[0.8] text-accent">A</span>
      <div className="flex-1 space-y-2.5 pt-1">
        {widths.map((w, i) => <div key={i} className="h-1.5 rounded-full bg-white/25" style={{ width: `${w}%` }} />)}
      </div>
    </div>
  );
}

function MotifSeni() {
  const rows = 6;
  const cols = 9;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const on = (r + c) % 2 === 0;
      const x = c * 22 + (r % 2 ? 11 : 0);
      const y = r * 17;
      cells.push(
        <path key={`${r}-${c}`} d={`M${x + 11} ${y} L${x + 22} ${y + 8.5} L${x + 11} ${y + 17} L${x} ${y + 8.5}Z`}
          fill={on ? 'rgb(var(--accent))' : 'white'} fillOpacity={on ? 0.9 : 0.16} />
      );
    }
  }
  return <svg viewBox="0 0 198 102" className="mt-4 h-auto w-full" aria-hidden="true">{cells}</svg>;
}

function MotifNotasi() {
  return (
    <svg viewBox="0 0 200 110" className="mt-4 h-auto w-full" aria-hidden="true">
      {[30, 42, 54, 66, 78].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="white" strokeOpacity=".3" />)}
      {[[30, 66], [62, 54], [96, 42], [130, 60], [164, 36]].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx="6.5" ry="5" fill="white" fillOpacity=".85" transform={`rotate(-18 ${x} ${y})`} />
          <line x1={x + 5.5} x2={x + 5.5} y1={y - 1} y2={y - 26} stroke="white" strokeOpacity=".85" strokeWidth="1.6" />
        </g>
      ))}
    </svg>
  );
}

function MotifLambang() {
  return (
    <div className="mt-2 flex flex-col items-center text-center">
      <img src="/logo-320.webp" width="320" height="320" alt="" className="h-28 w-28 rounded-full bg-white p-1.5 sm:h-32 sm:w-32" decoding="async" />
      <p className="mt-3 font-display text-lg leading-tight text-white">Universitas Negeri Medan</p>
      <p className="mt-0.5 text-xs text-white/60">Pusat Unggulan IPTEK</p>
    </div>
  );
}

const FOLIOS = [
  { key: 'riset', title: 'Riset', Motif: MotifRiset },
  { key: 'literasi', title: 'Literasi', Motif: MotifLiterasi },
  { key: 'seni', title: 'Seni tenun', Motif: MotifSeni },
  { key: 'notasi', title: 'Seni pertunjukan', Motif: MotifNotasi },
  { key: 'lambang', title: '', Motif: MotifLambang },
];
const MID = (FOLIOS.length - 1) / 2;

export default function FolioStack() {
  const stage = useRef(null);
  const raf = useRef(0);
  const reduce = useReducedMotion();

  const onMove = useCallback((e) => {
    if (reduce || e.pointerType !== 'mouse' || !stage.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      stage.current?.style.setProperty('--ry', `${(-16 + px * 28).toFixed(1)}deg`);
      stage.current?.style.setProperty('--rx', `${(6 - py * 22).toFixed(1)}deg`);
    });
  }, [reduce]);

  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stage.current?.style.setProperty('--ry', '-16deg');
    stage.current?.style.setProperty('--rx', '6deg');
  }, []);

  return (
    <div className="scene3d relative mx-auto aspect-[4/5] w-full max-w-[420px]" onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      <div className={`p3d h-full w-full ${reduce ? '' : 'sway'}`}>
        <div ref={stage} className="stage3d h-full w-full">
          {FOLIOS.map(({ key, title, Motif }, i) => {
            const d = i - MID;
            return (
              <div
                key={key}
                className="p3d absolute inset-[9%]"
                style={{ transform: `translate3d(${d * 20}px, ${d * -12}px, ${d * 56}px) rotateZ(${d * 2.6}deg)` }}
              >
                <div
                  className="folio animate-floaty flex h-full w-full flex-col rounded-[22px] p-5 text-white"
                  style={{ animationDelay: `${i * -1.3}s`, animationDuration: `${6 + i * 0.7}s` }}
                >
                  {title && <p className="font-display text-lg text-white/85">{title}</p>}
                  <Motif />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
