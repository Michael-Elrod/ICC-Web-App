// FloorplanViewer.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface FloorplanViewerProps {
  floorplans: { url: string; name: string }[];
  onClose?: () => void;
  mode: 'modal' | 'embedded';
}

const FloorplanViewer: React.FC<FloorplanViewerProps> = ({ floorplans, onClose, mode }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (mode === 'modal') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) onClose();
        if (e.key === 'ArrowLeft') setSelectedIndex(prev => prev > 0 ? prev - 1 : floorplans.length - 1);
        if (e.key === 'ArrowRight') setSelectedIndex(prev => prev < floorplans.length - 1 ? prev + 1 : 0);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onClose, floorplans.length, mode]);

  const MainContent = () => (
    <div className={`bg-white dark:bg-zinc-800 rounded-lg w-full ${mode === 'modal' ? 'max-w-6xl max-h-[90vh]' : 'h-full'} flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-zinc-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Floorplan {selectedIndex + 1} of {floorplans.length}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open(floorplans[selectedIndex].url, '_blank')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Download
          </button>
          {mode === 'modal' && onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Main image display */}
        <div className="flex-1 relative p-4 flex items-center justify-center">
          {/* Navigation arrows */}
          <button 
            onClick={() => setSelectedIndex(prev => prev > 0 ? prev - 1 : floorplans.length - 1)}
            className="absolute left-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative h-full w-full">
            <Image
              src={floorplans[selectedIndex].url}
              alt={floorplans[selectedIndex].name}
              fill
              className="object-contain"
            />
          </div>

          <button 
            onClick={() => setSelectedIndex(prev => prev < floorplans.length - 1 ? prev + 1 : 0)}
            className="absolute right-6 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Thumbnail sidebar */}
        <div className="w-48 border-l dark:border-zinc-700 p-2 overflow-y-auto">
          <div className="grid gap-2">
            {floorplans.map((plan, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedIndex === index 
                    ? 'border-blue-500' 
                    : 'border-transparent hover:border-blue-300'
                }`}
              >
                <Image
                  src={plan.url}
                  alt={plan.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <MainContent />
      </div>
    );
  }

  return <MainContent />;
};

export default FloorplanViewer;