import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Pulse Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="44" 
        className="stroke-accent/30 animate-pulse" 
        strokeWidth="1" 
      />
      
      {/* Rotating Scanner */}
      <g className="animate-[spin_3s_linear_infinite] origin-center">
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          className="stroke-accent/10" 
          strokeWidth="0.5" 
          strokeDasharray="4 8" 
        />
        <path 
          d="M50 10A40 40 0 0 1 90 50" 
          className="stroke-accent" 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
      </g>

      {/* The Razor Blade (Solid & Sharp) */}
      <path 
        d="M20 80L40 60L50 70L85 15L65 35L75 45L20 80Z" 
        className="fill-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
      />
      
      {/* Precision Detail Line */}
      <path 
        d="M40 60L85 15" 
        className="stroke-accent" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />

      {/* Center Core */}
      <circle cx="50" cy="50" r="4" className="fill-accent animate-ping" />
      <circle cx="50" cy="50" r="2" className="fill-foreground" />
    </svg>
  );
};
