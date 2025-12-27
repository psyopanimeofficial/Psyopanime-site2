import React, { useRef } from 'react';
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
  onNavigateWatch
}) => {
  // Only expose PSYOP_QUEEN_EXE
  const shapes = [ShapeType.PSYOP_QUEEN_EXE];
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageUpload(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // v4 Labels
  const colorLabels = [
    "Shadow",
    "Midtone",
    "Details"
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-1 md:p-6">
      {/* Header - Adaptive Layout */}
      <div className="pointer-events-auto w-full flex flex-wrap md:flex-nowrap items-center justify-between md:gap-10 gap-y-1">
        
        {/* Logo */}
        <div className="order-1 flex-shrink-0">
          <img 
            src="https://i.imgur.com/ChM6TPY.png" 
            alt="PSYOP ANIME" 
            className="h-14 md:h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
        </div>
        
        {/* Mute Toggle */}
        <div className="order-2 md:order-3 flex-shrink-0">
          <button 
            onClick={onToggleMute}
            className="flex items-center gap-2 px-3 py-1.5 md:px-3 md:py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[10px] md:text-xs font-mono uppercase transition-colors whitespace-nowrap"
          >
            {isMuted ? (
              <>
                <span className="text-red-400 font-bold">MUTED</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              </>
            ) : (
              <>
                <span className="text-green-400 font-bold">AUDIO ON</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 md:w-4 md:h-4 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="order-3 md:order-2 w-full md:w-auto flex items-center gap-5 md:gap-8 overflow-x-auto no-scrollbar pt-1 md:pt-0 justify-start">
            <button 
              onClick={onNavigateWatch}
              className="text-base md:text-2xl font-bold tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] uppercase whitespace-nowrap"
            >
              WATCH
            </button>
            <button 
              className="text-base md:text-2xl font-bold tracking-tighter text-gray-500 hover:text-gray-400 cursor-not-allowed transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] uppercase whitespace-nowrap"
              title="Coming Soon"
            >
              CREATE
            </button>
            <button 
              className="text-base md:text-2xl font-bold tracking-tighter text-gray-500 hover:text-gray-400 cursor-not-allowed transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] uppercase whitespace-nowrap"
              title="Coming Soon"
            >
              TUTORIALS
            </button>
        </div>
      </div>

      {/* Main Controls Bottom Bar */}
      <div className="pointer-events-auto bg-black/60 md:bg-black/40 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-6 w-full max-w-6xl mx-auto mb-1 md:mb-4 shadow-2xl">
        <div className="flex flex-col xl:flex-row gap-2 md:gap-6 items-center justify-between">
          
          {/* Section 1: Actions */}
          <div className="flex-1 w-full overflow-x-auto pb-1 md:pb-0 flex items-center gap-2 md:gap-4 no-scrollbar">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             
             <button
               onClick={() => fileInputRef.current?.click()}
               className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-[0_0_10px_rgba(220,38,38,0.5)] whitespace-nowrap shrink-0"
             >
               UPLOAD
             </button>
             
             <button
               onClick={onAutoColor}
               className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-[0_0_10px_rgba(147,51,234,0.5)] whitespace-nowrap flex items-center gap-2 shrink-0"
             >
               <span className="text-yellow-300">★</span> <span className="hidden sm:inline">AUTO TONE</span><span className="sm:hidden">AUTO</span>
             </button>

             <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>

             <div className="flex gap-2 shrink-0">
               {shapes.map((shape) => (
                 <button
                   key={shape}
                   onClick={() => onShapeChange(shape)}
                   className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap
                     ${currentShape === shape 
                       ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105' 
                       : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                     }`}
                 >
                   {shape === ShapeType.PSYOP_QUEEN_EXE ? 'PSYOP.EXE' : shape}
                 </button>
               ))}
             </div>
          </div>

          {/* Section 2: Colors + Glow Dial */}
          <div className="flex items-center gap-2 md:gap-3 md:border-l border-white/10 md:pl-4 overflow-x-auto w-full xl:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/10 no-scrollbar">
             
             {/* Particle Tones */}
             {currentColors.map((col, idx) => (
               <div key={idx} className="flex flex-col gap-1 items-center min-w-[45px] md:min-w-[60px] shrink-0">
                 <label className="text-[7px] md:text-[9px] uppercase tracking-widest text-gray-400 whitespace-nowrap">{colorLabels[idx] || `Tone ${idx+1}`}</label>
                 <div className="flex items-center justify-center p-1 bg-white/5 rounded-lg border border-white/10">
                   <input 
                      type="color" 
                      value={col}
                      onChange={(e) => onColorChange(idx, e.target.value)}
                      className="w-6 h-6 md:w-8 md:h-8 rounded cursor-pointer bg-transparent border-none p-0 appearance-none"
                   />
                 </div>
               </div>
             ))}

             <div className="w-px h-8 bg-white/20 mx-1 md:mx-2"></div>

             {/* GLOW DIAL */}
             <div className="flex flex-col gap-1 items-center min-w-[50px] md:min-w-[70px] shrink-0">
               <label className="text-[7px] md:text-[9px] uppercase tracking-widest text-cyan-400 whitespace-nowrap font-bold">GLOW DIAL</label>
               <div className="relative group">
                 <div className="absolute inset-0 bg-current blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full" style={{color: glowColor}}></div>
                 <div className="relative flex items-center justify-center p-1 bg-white/5 rounded-full border border-white/30 hover:border-white/80 transition-all">
                    <input 
                        type="color" 
                        value={glowColor}
                        onChange={(e) => onGlowChange(e.target.value)}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer bg-transparent border-none p-0 appearance-none"
                    />
                 </div>
               </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Controls;