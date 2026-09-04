import React from 'react';
import { cn } from '../lib/utils';

interface LogoMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const sizeMap = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-16 h-16 rounded-2xl',
};

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 'md',
  className,
  showGlow = true,
}) => {
  return (
    <div className={cn('relative flex items-center justify-center shrink-0 group', className)}>
      {showGlow && (
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 group-hover:blur-md transition-all duration-300 pointer-events-none" />
      )}
      <img
        src="/icon.svg"
        alt="MotoLegado"
        className={cn(
          sizeMap[size],
          'relative z-10 object-contain shadow-[0_4px_22px_rgba(234,88,12,0.5)] group-hover:scale-105 transition-all duration-300'
        )}
      />
    </div>
  );
};
