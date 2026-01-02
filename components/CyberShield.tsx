
import React from 'react';

export const CyberShield: React.FC<{ animate?: boolean; size?: string; dark?: boolean }> = ({ animate = false, size = "w-12 h-12", dark = false }) => {
  return (
    <div className={`${size} relative flex items-center justify-center ${animate ? 'animate-scan-pulse' : ''}`}>
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-[0_0_12px_rgba(255,0,51,0.6)]`}>
        {/* Shield Background */}
        <path 
          d="M50 5 L90 20 V50 C90 80 50 95 50 95 C50 95 10 80 10 50 V20 L50 5 Z" 
          fill={dark ? "#000" : "rgba(10,10,12,0.9)"}
          stroke="#ff0033" 
          strokeWidth="3"
        />
        
        {/* Eagle Silhouette/Stylized */}
        <g transform="translate(15, 20) scale(0.7)" fill="#ff0033">
          {/* Wings */}
          <path d="M0 20 C10 0 40 0 50 25 C60 0 90 0 100 20 L95 30 C80 15 60 15 50 35 C40 15 20 15 5 30 Z" />
          <path d="M5 35 C15 25 35 25 45 40 L40 50 C30 40 15 40 10 50 Z" />
          <path d="M95 35 C85 25 65 25 55 40 L60 50 C70 40 85 40 90 50 Z" />
          
          {/* Body and Head */}
          <path d="M50 30 L55 45 L50 75 L45 45 Z" />
          <path d="M50 25 C53 20 57 20 60 25 L50 35 L40 25 C43 20 47 20 50 25" />
          
          {/* Glowing Eyes */}
          <circle cx="47" cy="24" r="1.5" fill="#fff" />
          <circle cx="53" cy="24" r="1.5" fill="#fff" />
        </g>
        
        {/* Red Glow Inner */}
        <path 
          d="M50 12 L85 24 V50 C85 75 50 90 50 90 C50 90 15 75 15 50 V24 L50 12 Z" 
          fill="none" 
          stroke="rgba(255,0,51,0.2)" 
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
