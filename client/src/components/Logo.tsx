interface LogoProps {
  className?: string;
  dark?: boolean;
}

export function Logo({ className = "", dark = false }: LogoProps) {
  return (
    <div className={`${className}`}>
      <svg 
        width="200" 
        height="48" 
        viewBox="0 0 200 48" 
        className={`h-12 ${className}`}
        aria-label="Christ Collective"
      >
        {/* Gold circle with cross star */}
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          fill="none" 
          stroke="#D4AF37" 
          strokeWidth="2"
        />
        {/* Four-pointed star (cross) */}
        <path 
          d="M24 8 L26 22 L40 24 L26 26 L24 40 L22 26 L8 24 L22 22 Z" 
          fill="#D4AF37"
        />
        {/* Text */}
        <text 
          x="54" 
          y="20" 
          fill="#D4AF37" 
          fontSize="14" 
          fontWeight="bold" 
          fontFamily="system-ui, sans-serif"
        >
          CHRIST
        </text>
        <text 
          x="54" 
          y="35" 
          fill="#D4AF37" 
          fontSize="14" 
          fontWeight="bold" 
          fontFamily="system-ui, sans-serif"
        >
          COLLECTIVE
        </text>
      </svg>
    </div>
  );
}
