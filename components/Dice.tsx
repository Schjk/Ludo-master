
import React, { useEffect, useState, useRef } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onClick: () => void;
  disabled: boolean;
  skin?: string;
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onClick, disabled, skin = 'classic' }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState(1);
  const rollInterval = useRef<number | null>(null);

  // RIGOROUS mapping for 3D Cube faces
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },       // Front
    6: { x: 180, y: 0 },     // Back
    3: { x: 0, y: -90 },     // Right
    4: { x: 0, y: 90 },      // Left
    2: { x: -90, y: 0 },     // Top
    5: { x: 90, y: 0 },      // Bottom
  };

  useEffect(() => {
    if (rolling) {
      setScale(1.1);
      rollInterval.current = window.setInterval(() => {
        setRotation({
          x: Math.floor(Math.random() * 720) - 360,
          y: Math.floor(Math.random() * 720) - 360,
          z: Math.floor(Math.random() * 360)
        });
      }, 60);
    } else if (value !== null) {
      if (rollInterval.current) {
        clearInterval(rollInterval.current);
        rollInterval.current = null;
      }
      
      const target = faceRotations[value];
      setScale(1.2);
      setTimeout(() => setScale(1), 300);
      
      setRotation({ 
        x: 1080 + target.x, 
        y: 1080 + target.y, 
        z: 0 
      });
    }
  }, [rolling, value]);

  const Dot = () => {
    let dotStyle: React.CSSProperties = {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: '#000',
      boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.6)',
    };

    if (skin === 'gold') dotStyle.backgroundColor = '#3f2b01';
    if (skin === 'neon') { dotStyle.backgroundColor = '#22d3ee'; dotStyle.boxShadow = '0 0 8px #22d3ee'; }
    if (skin === 'ruby') { dotStyle.backgroundColor = '#fff'; dotStyle.boxShadow = '0 0 5px #fff'; }

    return <div style={dotStyle} />;
  };

  const getFaceClass = () => {
    const base = "dice-face border-[3px] ";
    switch (skin) {
      case 'gold': return base + "bg-gradient-to-br from-[#fef3c7] via-[#fbbf24] to-[#b45309] border-[#92400e] shadow-inner";
      case 'neon': return base + "bg-[#020617] border-[#22d3ee] shadow-[0_0_15px_#22d3ee,inset_0_0_8px_#22d3ee]";
      case 'ruby': return base + "bg-gradient-to-br from-[#ef4444] to-[#7f1d1d] border-[#ef4444]";
      default: return base + "bg-gradient-to-br from-white via-slate-50 to-slate-200 border-slate-300 shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]";
    }
  };

  const renderDots = (num: number) => {
    const grid = "grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-2";
    const pos = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    }[num] || [];

    return (
      <div className={grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {pos.includes(i) && <Dot />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div 
        className={`dice-scene transition-all duration-300 ${disabled ? 'opacity-30 pointer-events-none grayscale' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        onClick={!disabled ? onClick : undefined}
        style={{ transform: `scale(${scale})` }}
      >
        <div 
          className="dice-cube"
          style={{ 
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`, 
            transition: rolling ? 'none' : 'transform 1.4s cubic-bezier(0.15, 0.9, 0.3, 1.25)' 
          }}
        >
          <div className={getFaceClass()} style={{ transform: 'translateZ(36px)' }}>{renderDots(1)}</div>
          <div className={getFaceClass()} style={{ transform: 'rotateY(180deg) translateZ(36px)' }}>{renderDots(6)}</div>
          <div className={getFaceClass()} style={{ transform: 'rotateY(90deg) translateZ(36px)' }}>{renderDots(3)}</div>
          <div className={getFaceClass()} style={{ transform: 'rotateY(-90deg) translateZ(36px)' }}>{renderDots(4)}</div>
          <div className={getFaceClass()} style={{ transform: 'rotateX(90deg) translateZ(36px)' }}>{renderDots(2)}</div>
          <div className={getFaceClass()} style={{ transform: 'rotateX(-90deg) translateZ(36px)' }}>{renderDots(5)}</div>
        </div>
      </div>
      <div className={`mt-8 w-16 h-2 rounded-[50%] bg-black/50 blur-md transition-all duration-700 ${rolling ? 'scale-x-150 opacity-10' : 'scale-x-100 opacity-60'}`} />
    </div>
  );
};

export default Dice;
