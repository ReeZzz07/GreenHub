import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Курируемый набор иконок под тематику маркетплейса растений — единый line-стиль (stroke, currentColor),
// как и остальные иконки приложения (см. Icons.tsx). Один из двух способов задать иконку категории.

export const TreeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="5"></circle>
    <line x1="12" y1="14" x2="12" y2="21"></line>
  </svg>
);

export const CactusIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="9" y1="21" x2="9" y2="4"></line>
    <path d="M9 12H6a2 2 0 0 1-2-2V7"></path>
    <path d="M9 9h3a2 2 0 0 1 2 2v3"></path>
    <line x1="5" y1="21" x2="13" y2="21"></line>
  </svg>
);

export const FlowerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="1.6" fill="currentColor"></circle>
    <circle cx="12" cy="4.2" r="2.2"></circle>
    <circle cx="15.8" cy="8" r="2.2"></circle>
    <circle cx="12" cy="11.8" r="2.2"></circle>
    <circle cx="8.2" cy="8" r="2.2"></circle>
    <line x1="12" y1="14" x2="12" y2="21"></line>
  </svg>
);

export const GrassIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 21c0-6 2-9 2-9"></path>
    <path d="M12 21c0-8 0-13 0-13"></path>
    <path d="M19 21c0-6-2-9-2-9"></path>
  </svg>
);

export const PotIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 11V3"></path>
    <path d="M12 7c-1.5 0-2.5-1.5-2.5-1.5S10.5 7 12 7s2.5-1.5 2.5-1.5S13.5 7 12 7z"></path>
    <path d="M6 11h12l-1.4 9.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 11z"></path>
    <line x1="5" y1="11" x2="19" y2="11"></line>
  </svg>
);

export const BranchIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20C10 16 14 12 20 4"></path>
    <path d="M9.5 14.5c-2 0.3-3-1.5-3-1.5"></path>
    <path d="M14.5 9.5c2-0.3 3 1.5 3 1.5"></path>
  </svg>
);

export const BouquetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="21" x2="9.5" y2="10"></line>
    <line x1="12" y1="21" x2="12" y2="8"></line>
    <line x1="16" y1="21" x2="14.5" y2="10"></line>
    <circle cx="9.5" cy="8" r="2"></circle>
    <circle cx="12" cy="6" r="2"></circle>
    <circle cx="14.5" cy="8" r="2"></circle>
  </svg>
);

export const SproutIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 21V11"></path>
    <path d="M12 11C12 11 6 11 6 5c6 0 6 6 6 6z"></path>
    <path d="M12 14C12 14 18 14 18 8c-6 0-6 6-6 6z"></path>
  </svg>
);
