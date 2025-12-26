import React, { useEffect, useState } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onClick: () => void;
  disabled: boolean;
  color: string; // Tailwind text color class (Unused for dots now, strict black)
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onClick, disabled }) => {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      return () => clearInterval(interval);
    } else if (value) {
      setDisplayValue(value);
    }
  }, [rolling, value]);

  const dotPosition = (num: number) => {
    const dots = [];
    if ([1, 3, 5].includes(num)) dots.push('top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'); // Center
    if ([2, 3, 4, 5, 6].includes(num)) dots.push('top-2 left-2'); // Top Left
    if ([2, 3, 4, 5, 6].includes(num)) dots.push('bottom-2 right-2'); // Bottom Right
    if ([4, 5, 6].includes(num)) dots.push('top-2 right-2'); // Top Right
    if ([4, 5, 6].includes(num)) dots.push('bottom-2 left-2'); // Bottom Left
    if ([6].includes(num)) dots.push('top-1/2 left-2 -translate-y-1/2'); // Middle Left
    if ([6].includes(num)) dots.push('top-1/2 right-2 -translate-y-1/2'); // Middle Right
    return dots;
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-20 h-20 rounded-2xl shadow-[0_8px_15px_-3px_rgba(0,0,0,0.3)] 
          border border-[#e2d5b5] bg-gradient-to-br from-[#fffef0] to-[#e6dfc8]
          relative transition-all duration-200
          ${rolling ? 'animate-spin' : ''}
          ${disabled ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
        `}
      >
        {/* Bevel effect */}
        <div className="absolute inset-1 rounded-xl border border-white/50"></div>
        
        {dotPosition(displayValue).map((pos, idx) => (
          <div key={idx} className={`absolute w-4 h-4 rounded-full bg-black shadow-inner ${pos}`} />
        ))}
      </button>
      <span className="mt-3 text-sm font-bold text-[#e6dfc8] uppercase tracking-widest text-shadow-sm">
        {rolling ? 'Rolling...' : value ? `Rolled: ${value}` : 'Roll'}
      </span>
    </div>
  );
};

export default Dice;
