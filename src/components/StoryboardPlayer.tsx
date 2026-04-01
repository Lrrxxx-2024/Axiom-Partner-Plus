import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoryboardPlayerProps {
  frames: string[];
}

export default function StoryboardPlayer({ frames }: StoryboardPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(8);

  useEffect(() => {
    let interval: any;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextFrame = () => setCurrentIndex((prev) => (prev + 1) % frames.length);
  const prevFrame = () => setCurrentIndex((prev) => (prev - 1 + frames.length) % frames.length);

  return (
    <div className="mt-4 space-y-4">
      {/* Main Preview / Player */}
      <div className="relative group aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <img
          src={frames[currentIndex]}
          alt={`Frame ${currentIndex + 1}`}
          className="w-full h-full object-contain transition-opacity duration-100"
          referrerPolicy="no-referrer"
        />
        
        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <div className="flex items-center gap-1">
                <button onClick={prevFrame} className="p-1 hover:bg-white/20 rounded text-white">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-white w-12 text-center">
                  {String(currentIndex + 1).padStart(2, '0')} / {frames.length}
                </span>
                <button onClick={nextFrame} className="p-1 hover:bg-white/20 rounded text-white">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase">FPS</span>
                <select 
                  value={fps} 
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="bg-transparent text-[10px] text-white border-none focus:ring-0 cursor-pointer"
                >
                  <option value={4} className="bg-black">4</option>
                  <option value={8} className="bg-black">8</option>
                  <option value={12} className="bg-black">12</option>
                  <option value={24} className="bg-black">24</option>
                </select>
              </div>
              <button 
                onClick={() => setIsFullscreen(true)}
                className="p-1 hover:bg-white/20 rounded text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              animate={{ width: `${((currentIndex + 1) / frames.length) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
        {frames.map((frame, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setIsPlaying(false);
            }}
            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
              currentIndex === idx ? 'border-white scale-95 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={frame} alt={`Thumb ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute bottom-0.5 right-1 text-[8px] font-mono text-white bg-black/50 px-1 rounded">
              {idx + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8"
          >
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-full max-w-5xl aspect-video relative">
              <img
                src={frames[currentIndex]}
                alt="Fullscreen Frame"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute bottom-[-60px] left-0 right-0 flex items-center justify-center gap-8">
                <button onClick={prevFrame} className="p-4 hover:bg-white/10 rounded-full text-white">
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-6 bg-white text-black rounded-full hover:scale-110 transition-transform"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>
                <button onClick={nextFrame} className="p-4 hover:bg-white/10 rounded-full text-white">
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
