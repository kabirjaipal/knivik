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
      {/* Outer Pulse Ring - Adaptive Opacity */}
      <circle 
        cx="50" 
        cy="50" 
        r="44" 
        className="stroke-primary/20 dark:stroke-primary/40 animate-pulse" 
        strokeWidth="1" 
      />
      
      {/* Rotating Scanner - More Visible in Dark Mode */}
      <g className="animate-[spin_4s_linear_infinite] origin-center">
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          className="stroke-accent/10 dark:stroke-accent/20" 
          strokeWidth="0.5" 
          strokeDasharray="4 8" 
        />
        <path 
          d="M50 10A40 40 0 0 1 90 50" 
          className="stroke-accent opacity-60 dark:opacity-100" 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
      </g>

      {/* The Razor Blade (Primary Brand Element) */}
      <path 
        d="M20 80L40 60L50 70L85 15L65 35L75 45L20 80Z" 
        className="fill-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] dark:drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)] transition-all duration-500"
      />
      
      {/* Precision Detail Line - Sharp Contrast */}
      <path 
        d="M40 60L85 15" 
        className="stroke-accent dark:stroke-white/50" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />

      {/* Center Core - Neural Indicator */}
      <circle cx="50" cy="50" r="4" className="fill-accent animate-ping opacity-70" />
      <circle cx="50" cy="50" r="2.5" className="fill-foreground" />
    </svg>
  );
};
