import React from 'react';

interface TopGradientBackgroundProps {
  variant?: 'peachBronze' | 'softRose' | 'sageGreen';
  className?: string;
}

export const TopGradientBackground: React.FC<TopGradientBackgroundProps> = ({ 
  variant = 'peachBronze',
  className = '' 
}) => {
  const gradientVariants = {
    peachBronze: 'from-[#FFD4B5]/40 via-[#FFE8DC]/20 to-transparent',
    softRose: 'from-[#FFB5BA]/30 via-[#FFE0E3]/15 to-transparent',
    sageGreen: 'from-[#C5D5C5]/30 via-[#E5EDE5]/15 to-transparent'
  };

  return (
    <>
      {/* Main top gradient that blends with white */}
      <div 
        className={`absolute inset-x-0 top-0 h-[50vh] bg-gradient-to-b ${gradientVariants[variant]} pointer-events-none ${className}`}
        aria-hidden="true"
      />
      
      {/* Subtle overlay for smooth blending */}
      <div 
        className="absolute inset-x-0 top-0 h-[25vh] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
};