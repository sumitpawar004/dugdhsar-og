import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsFading(true), 300);
          setTimeout(() => {
            setIsDone(true);
            onComplete();
          }, 900);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999999] bg-[#F8F4EC] flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        {/* Exact Milk Bottle Silhouette Filling Animation */}
        <div className="relative w-24 h-48 sm:w-28 sm:h-56">
          <svg viewBox="0 0 100 240" className="w-full h-full">
            <defs>
              {/* Bottle Outline Clip Path */}
              <clipPath id="bottleOutlineClip">
                <path
                  d="M 38 12
                     L 62 12
                     L 62 30
                     Q 62 48 64 65
                     L 68 85
                     Q 78 115 88 135
                     L 88 220
                     Q 88 232 75 232
                     L 25 232
                     Q 12 232 12 220
                     L 12 135
                     Q 22 115 32 85
                     L 36 65
                     Q 38 48 38 30
                     Z"
                />
              </clipPath>
            </defs>

            {/* Empty Bottle Background (Deep Forest Container) */}
            <path
              d="M 38 12
                 L 62 12
                 L 62 30
                 Q 62 48 64 65
                 L 68 85
                 Q 78 115 88 135
                 L 88 220
                 Q 88 232 75 232
                 L 25 232
                 Q 12 232 12 220
                 L 12 135
                 Q 22 115 32 85
                 L 36 65
                 Q 38 48 38 30
                 Z"
              fill="#263D30"
            />

            {/* Milk Filling Wave Liquid (Clips inside the bottle) */}
            <g clipPath="url(#bottleOutlineClip)">
              {/* Rising Warm Cream Milk Fill */}
              <rect
                x="0"
                y={`${240 - (progress / 100) * 240}`}
                width="100"
                height="240"
                fill="#FAF6EE"
                className="transition-all duration-75"
              />
              {/* Milk Liquid Surface Wave Line */}
              <ellipse
                cx="50"
                cy={`${240 - (progress / 100) * 240}`}
                rx="40"
                ry="5"
                fill="#F3EDE1"
              />
            </g>

            {/* Bottle Outline Stroke */}
            <path
              d="M 38 12
                 L 62 12
                 L 62 30
                 Q 62 48 64 65
                 L 68 85
                 Q 78 115 88 135
                 L 88 220
                 Q 88 232 75 232
                 L 25 232
                 Q 12 232 12 220
                 L 12 135
                 Q 22 115 32 85
                 L 36 65
                 Q 38 48 38 30
                 Z"
              fill="none"
              stroke="#263D30"
              strokeWidth="4"
            />

            {/* Cap in Antique Gold */}
            <rect x="36" y="4" width="28" height="10" rx="2" fill="#C2A36C" />
          </svg>
        </div>

        {/* Loading Percentage Text beneath bottle */}
        <div className="mt-6 text-sm font-bold text-[#263D30] tracking-wider font-mono">
          Loading {progress}%
        </div>
      </div>
    </div>
  );
};
