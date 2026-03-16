
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = "", showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img 
          src="/logo.webp" 
          alt="ComPASS Logo" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <span className="font-bold text-slate-800 tracking-tight" style={{ fontSize: size * 0.5 }}>
          ComPASS
        </span>
      )}
    </div>
  );
};

export default Logo;
