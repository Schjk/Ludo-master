
import React, { useEffect, useState, useRef } from 'react';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onClick: () => void;
  disabled: boolean;
  skin?: 'classic' | 'gold' | 'neon';
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onClick, disabled, skin = 'classic' }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const rollInterval = useRef<number | null>(null);

  useEffect(() => {
    if (rolling) {
      rollInterval.current = window.setInterval(() => {
        setRotation({
          x: Math.floor(Math.random() * 720),
          y: Math.floor(Math.random() * 720)
        });
      }, 60);
    } else if (value) {
      if (rollInterval.current) {
        clearInterval(rollInterval.current);
        rollInterval.current = null;
      }
      
      const targetRotations: Record<number, { x: number; y: number }> = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 },
      };
      
      const target = targetRotations[value];
      setRotation({ x: 720 + target.x, y: 720 + target.y });
    }
  }, [rolling, value]);

  const dotColor = skin === 'gold' ? '#2c1e14' : skin === 'neon' ? '#fff' : '#2c1e14';
  const Dot = () => <div className="dot" style={{ backgroundColor: dotColor }} />;

  const faceStyle = () => {
    if (skin === 'gold') return 'bg-gold-gradient border-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.4)]';
    if (skin === 'neon') return 'bg-blue-600 border-blue-300 shadow-[0_0_15px_blue]';
    return 'bg-radial-gradient(circle, #fffef0 0%, #e6dfc8 100%) border-[#5c4033]';
  };

  const renderFaceDots = (num: number) => {
    switch(num) {
      case 1: return <div className="w-full h-full flex items-center justify-center"><Dot /></div>;
      case 2: return <div className="w-full h-full flex flex-col justify-between"><div className="flex justify-start"><Dot /></div><div className="flex justify-end"><Dot /></div></div>;
      case 3: return <div className="w-full h-full flex flex-col justify-between"><div className="flex justify-start"><Dot /></div><div className="flex justify-center"><Dot /></div><div className="flex justify-end"><Dot /></div></div>;
      case 4: return <div className="w-full h-full flex flex-col justify-between"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      case 5: return <div className="w-full h-full flex flex-col justify-between"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-center"><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      case 6: return <div className="w-full h-full flex flex-col justify-between"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      default: return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div 
        className={`dice-scene ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer active:scale-90 transition-transform'}`}
        onClick={!disabled ? onClick : undefined}
      >
        <div 
          className="dice-cube"
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transition: rolling ? 'none' : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1.2)' }}
        >
          <div className={`dice-face front ${faceStyle()}`}>{renderFaceDots(1)}</div>
          <div className={`dice-face back ${faceStyle()}`}>{renderFaceDots(2)}</div>
          <div className={`dice-face right ${faceStyle()}`}>{renderFaceDots(3)}</div>
          <div className={`dice-face left ${faceStyle()}`}>{renderFaceDots(4)}</div>
          <div className={`dice-face top ${faceStyle()}`}>{renderFaceDots(5)}</div>
          <div className={`dice-face bottom ${faceStyle()}`}>{renderFaceDots(6)}</div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
