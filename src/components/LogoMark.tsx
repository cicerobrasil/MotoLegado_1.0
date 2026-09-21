import React from 'react';
import { cn } from '../lib/utils';

interface LogoMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const sizeConfig = {
  xs: 'h-6',
  sm: 'h-7 sm:h-8',
  md: 'h-8 sm:h-9 md:h-10',
  lg: 'h-8 sm:h-10 md:h-12',
  xl: 'h-12 sm:h-16 md:h-20',
};

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 'md',
  className,
  showGlow = true,
}) => {
  const heightClass = sizeConfig[size];

  return (
    <div className={cn('relative inline-flex items-center shrink-0 select-none group', className)}>
      {showGlow && (
        <div className="absolute -inset-1 bg-[#ff751f]/20 rounded-2xl blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
      )}
      <svg
        viewBox="0 0 504 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'relative z-10 w-auto block select-none drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-[1.01] transition-all duration-300',
          heightClass
        )}
        aria-label="MotoLegado"
      >
        {/* Fundo Azul Escuro Oficial (#001b3d) */}
        <rect width="504" height="100" rx="12" fill="#001b3d" />

        {/* Caixa Salmão Oficial (#ff751f) */}
        <rect x="12" y="12" width="76" height="76" rx="11" fill="#ff751f" />

        {/* Letra M em Azul (#001b3d) */}
        <text
          x="50"
          y="70"
          fontFamily="Outfit, Montserrat, system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="62"
          fill="#001b3d"
          textAnchor="middle"
        >
          M
        </text>

        {/* OTO em Branco (#ffffff) + LEGADO em Salmão (#ff751f) */}
        <text
          x="100"
          y="70"
          fontFamily="Outfit, Montserrat, system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="62"
          letterSpacing="-0.5px"
        >
          <tspan fill="#ffffff">OTO</tspan>
          <tspan fill="#ff751f">LEGADO</tspan>
        </text>
      </svg>
    </div>
  );
};


