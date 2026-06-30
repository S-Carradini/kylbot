import { LayerKey, PLACES } from "./data";

// Stylized Arizona outline (approximate, demo).
const AZ_PATH =
  "M70,60 L520,60 L520,140 L545,160 L545,520 L470,540 L455,560 L420,560 L405,580 L70,580 L60,540 L60,260 L75,250 L80,220 L65,200 Z";

export function ArizonaMap({
  layers,
  focusPlace,
  onSelect,
}: {
  layers: Set<LayerKey>;
  focusPlace?: string;
  onSelect?: (id: string) => void;
}) {
  const has = (l: LayerKey) => layers.has(l);
  return (
    <div className="relative w-full h-full bwi-grad-soft overflow-hidden">
      {/* grid graticule */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 640" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="#0a3d62" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8ec" />
            <stop offset="100%" stopColor="#f1e6cf" />
          </linearGradient>
          <linearGradient id="ama" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0a3d62" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1c7c8c" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Arizona land */}
        <path d={AZ_PATH} fill="url(#land)" stroke="#0a3d62" strokeOpacity="0.7" strokeWidth="2.5" />

        {/* Basins layer */}
        {has("basins") && (
          <g opacity="0.55">
            <path d="M90,90 C220,80 320,140 380,210 C420,260 380,330 290,340 C200,350 130,310 100,240 Z" fill="#3ec1d3" fillOpacity="0.18" stroke="#1c7c8c" strokeDasharray="4 4" />
            <path d="M380,360 C460,350 510,400 500,470 C490,520 420,540 360,520 C300,500 320,420 380,360 Z" fill="#3ec1d3" fillOpacity="0.18" stroke="#1c7c8c" strokeDasharray="4 4" />
            <path d="M150,400 C220,380 280,420 270,490 C260,540 180,550 130,510 C90,480 110,420 150,400 Z" fill="#3ec1d3" fillOpacity="0.18" stroke="#1c7c8c" strokeDasharray="4 4" />
          </g>
        )}

        {/* AMAs */}
        {has("ama") && (
          <g>
            {/* Phoenix AMA */}
            <ellipse cx="265" cy="305" rx="95" ry="60" fill="url(#ama)" stroke="#0a3d62" strokeWidth="1.5" />
            <text x="265" y="308" textAnchor="middle" fontSize="11" fill="#0a3d62" fontWeight="700">Phoenix AMA</text>
            {/* Tucson AMA */}
            <ellipse cx="320" cy="475" rx="75" ry="45" fill="url(#ama)" stroke="#0a3d62" strokeWidth="1.5" />
            <text x="320" y="478" textAnchor="middle" fontSize="11" fill="#0a3d62" fontWeight="700">Tucson AMA</text>
            {/* Pinal AMA */}
            <ellipse cx="305" cy="385" rx="55" ry="30" fill="url(#ama)" stroke="#0a3d62" strokeWidth="1.5" />
            <text x="305" y="388" textAnchor="middle" fontSize="10" fill="#0a3d62" fontWeight="700">Pinal AMA</text>
            {/* Prescott AMA */}
            <ellipse cx="245" cy="200" rx="38" ry="22" fill="url(#ama)" stroke="#0a3d62" strokeWidth="1.5" />
            <text x="245" y="204" textAnchor="middle" fontSize="9" fill="#0a3d62" fontWeight="700">Prescott AMA</text>
            {/* Douglas AMA */}
            <ellipse cx="445" cy="540" rx="38" ry="20" fill="url(#ama)" stroke="#0a3d62" strokeWidth="1.5" />
            <text x="445" y="544" textAnchor="middle" fontSize="9" fill="#0a3d62" fontWeight="700">Douglas AMA</text>
          </g>
        )}

        {/* Rivers */}
        {has("rivers") && (
          <g stroke="#3ec1d3" strokeWidth="2.4" fill="none" opacity="0.85">
            <path d="M90,150 C180,200 240,240 320,300 C390,360 450,440 520,540" />
            <path d="M150,260 C200,300 260,340 300,400" />
            <path d="M380,150 C400,220 420,300 440,380" />
          </g>
        )}

        {/* CAP Canal */}
        {has("cap") && (
          <g>
            <path d="M80,220 C160,260 230,300 300,330 C370,360 420,420 460,490 C480,520 500,540 520,560"
                  stroke="#0f4c75" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="2 6" />
            <path d="M80,220 C160,260 230,300 300,330 C370,360 420,420 460,490 C480,520 500,540 520,560"
                  stroke="#3ec1d3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <text x="380" y="430" fontSize="10" fill="#0f4c75" fontWeight="700" transform="rotate(35 380 430)">CAP Canal</text>
          </g>
        )}

        {/* Drought */}
        {has("drought") && (
          <g opacity="0.45">
            <rect x="60" y="60" width="240" height="260" fill="#f4a83c" />
            <rect x="300" y="60" width="245" height="260" fill="#e47e77" />
            <rect x="60" y="320" width="240" height="260" fill="#e47e77" />
            <rect x="300" y="320" width="245" height="260" fill="#f4a83c" />
          </g>
        )}

        {/* Flood hazard */}
        {has("flood") && (
          <g opacity="0.55">
            <path d="M260,290 C290,300 320,320 340,350 C320,380 280,380 250,360 C230,340 240,300 260,290 Z" fill="#e8d6b3" stroke="#a37e3a" strokeDasharray="3 3" />
            <path d="M310,460 C340,470 360,490 360,510 C340,530 300,520 290,495 C285,475 295,460 310,460 Z" fill="#e8d6b3" stroke="#a37e3a" strokeDasharray="3 3" />
          </g>
        )}

        {/* Quality alerts */}
        {has("quality") && (
          <g>
            {[ {x:200,y:300},{x:300,y:380},{x:445,y:495} ].map((p,i)=>(
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="14" fill="#f4a83c" fillOpacity="0.25" />
                <circle cx={p.x} cy={p.y} r="6" fill="#f4a83c" stroke="#fff" strokeWidth="2" />
              </g>
            ))}
          </g>
        )}

        {/* Infrastructure */}
        {has("infrastructure") && (
          <g>
            {[ {x:260,y:300},{x:320,y:475},{x:300,y:385} ].map((p,i)=>(
              <rect key={i} x={p.x-5} y={p.y-5} width="10" height="10" fill="#122c3a" stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        )}

        {/* Providers (subtle tint regions) */}
        {has("providers") && (
          <g opacity="0.35">
            <circle cx="265" cy="305" r="40" fill="#1c7c8c" />
            <circle cx="320" cy="475" r="35" fill="#3ec1d3" />
            <circle cx="245" cy="200" r="22" fill="#1c7c8c" />
          </g>
        )}

        {/* Place markers */}
        {PLACES.map((p) => {
          const cx = (p.x / 100) * 600;
          const cy = (p.y / 100) * 640;
          const focused = focusPlace === p.id;
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => onSelect?.(p.id)}>
              {focused && <circle cx={cx} cy={cy} r="18" fill="#3ec1d3" fillOpacity="0.25" />}
              <circle cx={cx} cy={cy} r={focused ? 7 : 5} fill="#0a3d62" stroke="#fff" strokeWidth="2" />
              <text x={cx + 9} y={cy + 4} fontSize="10" fontWeight={focused ? 700 : 500} fill="#122c3a">
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Compass */}
        <g transform="translate(545,80)">
          <circle r="18" fill="#fff" stroke="#0a3d62" strokeOpacity="0.3" />
          <path d="M0,-12 L4,4 L0,0 L-4,4 Z" fill="#0a3d62" />
          <text y="22" textAnchor="middle" fontSize="9" fill="#0a3d62">N</text>
        </g>
      </svg>
    </div>
  );
}
