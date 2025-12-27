import React from 'react';
import { ShapeType } from '../types';

interface ControlsProps {
  currentShape: ShapeType;
  onShapeChange: (shape: ShapeType) => void;
  currentColors: string[];
  onColorChange: (index: number, color: string) => void;
  glowColor: string;
  onGlowChange: (color: string) => void;
  onImageUpload: (url: string) => void;
  onAutoColor: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateWatch: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentShape,
  onShapeChange,
  currentColors,
  onColorChange,
  glowColor,
  onGlowChange,
  onImageUpload,
  onAutoColor,
  isMuted,
  onToggleMute,
  onNavigateWatch,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageUpload(url);
    }
  };

  return (
    <>
      {/* Top Header - Logo and Audio Toggle */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="PSYOPANIME" 
            className="w-16 md:w-24 h-auto object-contain"
          />
        </div>
        
        {/* Audio Toggle */}
        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 border border-white/30 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-all group flex-shrink-0"
        >
          <span className="text-xs md:text-sm font-mono tracking-wider text-green-400 font-bold">
            AUDIO {isMuted ? 'OFF' : 'ON'}
          </span>
          <svg 
            className="w-4 h-4 md:w-5 md:h-5 text-white/70 group-hover:text-white transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
        </button>
      </header>

      {/* Navigation Menu */}
      <nav className="absolute top-20 md:top-24 left-0 right-0 z-40 px-4 md:px-8 flex gap-4 md:gap-8">
        <button
          onClick={onNavigateWatch}
          className="text-sm md:text-base font-bold text-white hover:text-red-400 transition-colors tracking-wider"
        >
          WATCH
        </button>
        <button className="text-sm md:text-base text-white/40 hover:text-white/60 transition-colors tracking-wider">
          CREATE
        </button>
        <button className="text-sm md:text-base text-white/40 hover:text-white/60 transition-colors tracking-wider">
          TUTORIALS
        </button>
      </nav>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 right-4 md:right-8 z-40">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
          
          {/* Main Action Buttons Row */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
            {/* Upload Button */}
            <label className="flex-1 min-w-[120px] cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-full px-4 md:px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-white font-bold text-xs md:text-sm text-center hover:from-red-700 hover:to-red-600 transition-all shadow-lg hover:shadow-red-500/50">
                UPLOAD
              </div>
            </label>

            {/* Auto Button */}
            <button
              onClick={onAutoColor}
              className="flex-1 min-w-[120px] px-4 md:px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg text-white font-bold text-xs md:text-sm hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
            >
              <span>★</span>
              <span>AUTO</span>
            </button>

            {/* Shape Button */}
            <button
              onClick={() => onShapeChange(currentShape === ShapeType.PSYOP_QUEEN_EXE ? ShapeType.LOGO : ShapeType.PSYOP_QUEEN_EXE)}
              className="flex-1 min-w-[120px] px-4 md:px-6 py-3 bg-white text-black rounded-lg font-bold text-xs md:text-sm hover:bg-gray-200 transition-all shadow-lg"
            >
              PSYOP.EXE
            </button>
          </div>

          {/* Color Controls - Hidden on small mobile, visible on tablet+ */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {/* Shadow */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/60 font-mono tracking-wider">SHADOW</label>
              <input
                type="color"
                value={currentColors[0]}
                onChange={(e) => onColorChange(0, e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            {/* Midtone */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/60 font-mono tracking-wider">MIDTONE</label>
              <input
                type="color"
                value={currentColors[1]}
                onChange={(e) => onColorChange(1, e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/60 font-mono tracking-wider">DETAILS</label>
              <input
                type="color"
                value={currentColors[2]}
                onChange={(e) => onColorChange(2, e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            {/* Glow */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/60 font-mono tracking-wider">GLOW</label>
              <input
                type="color"
                value={glowColor}
                onChange={(e) => onGlowChange(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Controls;
