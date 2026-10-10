import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = false 
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeMap[size]} flex-shrink-0 drop-shadow-md select-none`}>
        <svg 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient id="bookPageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Shield/Circle with layered shadow */}
          <rect 
            x="6" 
            y="6" 
            width="108" 
            height="108" 
            rx="28" 
            fill="url(#logoBgGrad)" 
            stroke="url(#goldGrad)" 
            strokeWidth="3.5"
          />

          {/* Inner decorative subtle border */}
          <rect 
            x="12" 
            y="12" 
            width="96" 
            height="96" 
            rx="22" 
            fill="none" 
            stroke="#60a5fa" 
            strokeWidth="1" 
            strokeDasharray="4 2" 
            opacity="0.4"
          />

          {/* Academic Laurel wreath hint */}
          <path 
            d="M20 70 C 18 52, 26 36, 40 28" 
            stroke="url(#goldGrad)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.6" 
          />
          <path 
            d="M100 70 C 102 52, 94 36, 80 28" 
            stroke="url(#goldGrad)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.6" 
          />

          {/* Open Book Vector */}
          {/* Book Spine & Cover shadow */}
          <path 
            d="M26 78 C 38 72, 52 73, 60 77 C 68 73, 82 72, 94 78 L 94 84 C 82 78, 68 79, 60 83 C 52 79, 38 78, 26 84 Z" 
            fill="#0f172a" 
            opacity="0.5" 
          />

          {/* Book Pages */}
          <path 
            d="M28 48 C 38 43, 50 44, 60 48 L 60 78 C 50 74, 38 73, 28 78 Z" 
            fill="url(#bookPageGrad)" 
            stroke="#cbd5e1" 
            strokeWidth="1.2" 
          />
          <path 
            d="M92 48 C 82 43, 70 44, 60 48 L 60 78 C 70 74, 82 73, 92 78 Z" 
            fill="#ffffff" 
            stroke="#cbd5e1" 
            strokeWidth="1.2" 
          />

          {/* Page text lines (representing exam questions & formulas) */}
          <line x1="34" y1="53" x2="54" y2="52" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="59" x2="52" y2="58" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="65" x2="48" y2="64" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

          <line x1="66" y1="52" x2="86" y2="53" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="66" y1="58" x2="84" y2="59" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="66" y1="64" x2="80" y2="65" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Graduation Cap (Mortarboard) on top */}
          <path 
            d="M60 22 L86 33 L60 42 L34 33 Z" 
            fill="url(#goldGrad)" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
          />
          {/* Mortarboard Skullcap */}
          <path 
            d="M45 37 L45 45 C 45 49, 75 49, 75 45 L 75 37" 
            fill="#d97706" 
            opacity="0.8" 
          />
          {/* Cap button & tassel */}
          <circle cx="60" cy="32" r="2.2" fill="#ffffff" />
          <path 
            d="M60 32 C 68 34, 76 38, 77 44" 
            stroke="#fef08a" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
          />
          <circle cx="77" cy="44" r="2" fill="#fef08a" />

          {/* Golden Badge Ribbon for "7991" at the bottom */}
          <rect 
            x="32" 
            y="87" 
            width="56" 
            height="18" 
            rx="9" 
            fill="url(#goldGrad)" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
          />
          <text 
            x="60" 
            y="100" 
            fill="#1e3a8a" 
            fontSize="10.5" 
            fontWeight="900" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            textAnchor="middle" 
            letterSpacing="0.5"
          >
            CV 7991
          </text>

          {/* Success Checkmark indicator / Star emblem */}
          <circle cx="94" cy="28" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          <path 
            d="M90 28 L93 31 L98 25" 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-white text-base md:text-lg leading-tight tracking-tight uppercase">
            Ứng dụng ra đề kiểm tra
          </span>
          <span className="text-xs text-amber-300 font-semibold tracking-wide flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Chuẩn Công văn 7991/BGDĐT-GDTrH
          </span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
