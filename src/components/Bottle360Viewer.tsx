import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface Bottle360ViewerProps {
  rotationAngle?: number;
  onAngleChange?: (angle: number) => void;
  className?: string;
  isDocked?: boolean;
  showControls?: boolean;
  showDragBadge?: boolean;
}

export const Bottle360Viewer: React.FC<Bottle360ViewerProps> = ({
  rotationAngle = 0,
  onAngleChange,
  className = '',
  isDocked = false,
  showControls = true,
  showDragBadge = true,
}) => {
  const [internalAngle, setInternalAngle] = useState(rotationAngle);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external rotation
  useEffect(() => {
    if (rotationAngle !== undefined && !isDragging) {
      setInternalAngle(rotationAngle % 360);
    }
  }, [rotationAngle, isDragging]);

  const updateAngle = (newAngle: number) => {
    const normalized = (newAngle + 360) % 360;
    setInternalAngle(normalized);
    if (onAngleChange) onAngleChange(normalized);
  };

  // Mouse / Touch handlers for 360 drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsAutoSpinning(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setStartX(e.clientX);
    // 1 pixel = ~1 degree of rotation
    updateAngle(internalAngle + deltaX * 1.2);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Auto spin loop
  useEffect(() => {
    if (!isAutoSpinning) return;
    const interval = setInterval(() => {
      updateAngle(internalAngle + 2);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoSpinning, internalAngle]);

  // Compute optical reflection offset based on angle
  const rad = (internalAngle * Math.PI) / 180;
  const lightOffset = Math.sin(rad) * 40;
  // Use Math.sin so that at angle 0 the label and logo are perfectly centered (offset = 0)
  const labelXOffset = showControls ? Math.sin(rad) * 25 : 0;
  const isLabelVisible = showControls ? Math.cos(rad) > -0.2 : true;
  const labelOpacity = showControls ? Math.max(0, Math.cos(rad)) : 1;

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col items-center justify-center ${className}`}
    >
      {/* 360 Bottle Interactive Canvas Box */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-48 sm:w-64 h-[380px] sm:h-[500px] max-w-full cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform duration-300 group"
        title="Click and drag horizontally to spin the bottle 360°"
      >
        {/* Soft Radial Ambient Aura */}
        <div className="absolute inset-0 bg-radial from-blue-100/60 via-amber-50/30 to-transparent rounded-full filter blur-2xl transform scale-90 -z-10 pointer-events-none" />

        {/* 3D Glass Bottle SVG Assembly */}
        <div className="relative w-36 sm:w-48 h-full flex items-center justify-center">
          <svg
            viewBox="0 0 200 600"
            className="w-full h-full drop-shadow-2xl overflow-visible"
            style={{
              filter: isDocked
                ? 'drop-shadow(0 25px 25px rgba(31, 47, 136, 0.25))'
                : 'drop-shadow(0 20px 20px rgba(31, 47, 136, 0.15))',
            }}
          >
            <defs>
              {/* Bottle Glass Gradient */}
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="15%" stopColor="#d9f2f8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="85%" stopColor="#c5eaf3" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
              </linearGradient>

              {/* Pure Whole Milk Liquid Gradient */}
              <linearGradient id="milkLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fdfcf9" />
                <stop offset="30%" stopColor="#ffffff" />
                <stop offset="70%" stopColor="#f8f5ee" />
                <stop offset="100%" stopColor="#efe8dc" />
              </linearGradient>

              {/* Cream Layer Gradient (Top of milk) */}
              <linearGradient id="creamLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f7ecd0" />
                <stop offset="50%" stopColor="#fdf6e2" />
                <stop offset="100%" stopColor="#f2e2be" />
              </linearGradient>

              {/* Gold Crown Cap */}
              <linearGradient id="goldCap" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9e732d" />
                <stop offset="25%" stopColor="#f9df90" />
                <stop offset="50%" stopColor="#c89d56" />
                <stop offset="80%" stopColor="#fff2be" />
                <stop offset="100%" stopColor="#875e1b" />
              </linearGradient>

              {/* Glass Specular Glare */}
              <linearGradient id="specularGlare" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <filter id="glassBlur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="1.5" />
              </filter>

              {/* Clip path for circular Vedic Gir cow medallion on bottle label */}
              <clipPath id="bottleLogoClip">
                <circle cx="100" cy="341" r="21" />
              </clipPath>
            </defs>

            {/* Milk Liquid Body (Inside the bottle) */}
            <path
              d="M 52 230 
                 Q 50 250 48 300 
                 L 46 540 
                 Q 46 575 75 575 
                 L 125 575 
                 Q 154 575 154 540 
                 L 152 300 
                 Q 150 250 148 230 
                 Z"
              fill="url(#milkLiquid)"
            />

            {/* Natural Cream Line at top */}
            <ellipse cx="100" cy="230" rx="48" ry="8" fill="url(#creamLine)" />

            {/* Dynamic Glass Bottle Silhouette */}
            <path
              d="M 82 45 
                 L 118 45 
                 L 118 70 
                 Q 118 90 120 120 
                 L 125 180 
                 Q 135 230 152 270 
                 L 154 540 
                 Q 154 580 120 580 
                 L 80 580 
                 Q 46 580 46 540 
                 L 48 270 
                 Q 65 230 75 180 
                 L 80 120 
                 Q 82 90 82 70 
                 Z"
              fill="url(#glassGrad)"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="2.5"
            />

            {/* Glass Neck Lip */}
            <rect x="80" y="65" width="40" height="6" rx="2" fill="rgba(255, 255, 255, 0.9)" />

            {/* Gold Heritage Crown Cap */}
            <rect x="79" y="30" width="42" height="22" rx="3" fill="url(#goldCap)" stroke="#875e1b" strokeWidth="0.5" />
            <path d="M 79 38 L 121 38" stroke="#ffffff" strokeWidth="0.7" opacity="0.6" />
            <path d="M 79 46 L 121 46" stroke="#5a3d0f" strokeWidth="0.7" opacity="0.4" />

            {/* 360 Dynamic Label Layer (moves with angle) */}
            {isLabelVisible && (
              <g
                transform={`translate(${labelXOffset}, 0)`}
                opacity={labelOpacity}
                style={{ transition: isDragging ? 'none' : 'opacity 0.1s ease-out' }}
              >
                {/* Paper Label Background */}
                <rect
                  x="56"
                  y="310"
                  width="88"
                  height="160"
                  rx="6"
                  fill="#FAF6EE"
                  stroke="#C2A36C"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 5px rgba(0,0,0,0.08))"
                />

                {/* Dugdhsar Sacred Medallion Seal on Label */}
                <circle cx="100" cy="341" r="22" fill="#FAF6EE" stroke="#C2A36C" strokeWidth="1.2" />
                <image
                  href="/assets/aistudio/1000095715-clean_c92aa3a9.png"
                  x="78"
                  y="319"
                  width="44"
                  height="44"
                  clipPath="url(#bottleLogoClip)"
                  preserveAspectRatio="xMidYMid slice"
                />

                {/* Brand Text */}
                <text
                  x="100"
                  y="375"
                  textAnchor="middle"
                  fill="#263D30"
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="'Barlow Semi Condensed', sans-serif"
                  letterSpacing="1"
                >
                  DUGDHSAR
                </text>

                <text
                  x="100"
                  y="387"
                  textAnchor="middle"
                  fill="#C2A36C"
                  fontSize="6"
                  fontWeight="700"
                  letterSpacing="0.8"
                >
                  60 YEARS HERITAGE
                </text>

                <line x1="68" y1="392" x2="132" y2="392" stroke="#C2A36C" strokeWidth="0.6" opacity="0.6" />

                <text
                  x="100"
                  y="405"
                  textAnchor="middle"
                  fill="#263D30"
                  fontSize="10"
                  fontWeight="800"
                >
                  FRESH A2 MILK
                </text>

                <text
                  x="100"
                  y="416"
                  textAnchor="middle"
                  fill="#302C26"
                  fontSize="6.5"
                >
                  GIR COW • RAW CHILLED
                </text>

                {/* Purity Badge */}
                <rect x="74" y="426" width="52" height="15" rx="7.5" fill="#A34F37" />
                <text
                  x="100"
                  y="436.5"
                  textAnchor="middle"
                  fill="#FAF6EE"
                  fontSize="6.5"
                  fontWeight="700"
                >
                  100% UNADULTERATED
                </text>

                <text
                  x="100"
                  y="458"
                  textAnchor="middle"
                  fill="#302C26"
                  opacity="0.7"
                  fontSize="6"
                >
                  NET: 1.0 LITRE
                </text>
              </g>
            )}

            {/* Dynamic Glass Refraction Highlight (moves opposite to light) */}
            <path
              d={`M ${65 + lightOffset * 0.2} 180 
                 Q ${60 + lightOffset * 0.25} 320 ${62 + lightOffset * 0.3} 530 
                 L ${68 + lightOffset * 0.3} 530 
                 Q ${66 + lightOffset * 0.25} 320 ${71 + lightOffset * 0.2} 180 
                 Z`}
              fill="url(#specularGlare)"
              opacity="0.75"
            />

            {/* Permanent Left Glass Rim Sheen */}
            <path
              d="M 52 240 L 50 535"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* Condensation Droplets */}
            <circle cx="138" cy="330" r="1.8" fill="#ffffff" opacity="0.8" />
            <circle cx="140" cy="336" r="1.2" fill="#ffffff" opacity="0.7" />
            <circle cx="134" cy="410" r="2.0" fill="#ffffff" opacity="0.8" />
            <circle cx="68" cy="370" r="1.5" fill="#ffffff" opacity="0.7" />
            <circle cx="70" cy="480" r="1.8" fill="#ffffff" opacity="0.8" />
          </svg>
        </div>

        {/* Floating Interactive 360 Spin Indicator Tag */}
        {showDragBadge && (
          <div className="absolute bottom-2 bg-[#FAF6EE]/95 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-[#C2A36C]/40 flex items-center space-x-1.5 text-[11px] font-semibold text-[#263D30]">
            <RotateCw className={`w-3.5 h-3.5 text-[#C2A36C] ${isDragging || isAutoSpinning ? 'animate-spin' : ''}`} />
            <span>360° Drag & Spin</span>
            <span className="text-[9px] bg-[#263D30] text-[#FAF6EE] px-1.5 py-0.2 rounded font-mono">
              {Math.round(internalAngle)}°
            </span>
          </div>
        )}
      </div>

      {/* Control Strip & Purity Highlights */}
      {showControls && (
        <div className="flex items-center space-x-3 mt-1">
          <button
            onClick={() => setIsAutoSpinning(p => !p)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isAutoSpinning
                ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                : 'bg-[#FAF6EE] text-[#263D30] border-[#D8C9AD] hover:border-[#263D30]'
            }`}
          >
            {isAutoSpinning ? 'Pause Rotation' : 'Auto Rotate'}
          </button>

          <div className="flex items-center space-x-1 text-xs text-[#263D30] bg-[#E8EFEA] px-2.5 py-1 rounded-full border border-[#263D30]/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#263D30]" />
            <span className="font-medium">Chilled at 4°C</span>
          </div>
        </div>
      )}
    </div>
  );
};
