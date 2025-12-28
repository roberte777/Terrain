'use client';

// ============================================================================
// Map Canvas Component
// Renders the generated world using HTML5 Canvas
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';
import { WorldData, Settings } from '../lib/types';
import { renderWorld, exportAsPng } from '../lib/rendering/renderer';

interface MapCanvasProps {
  world: WorldData | null;
  settings: Settings;
  onExportPng?: () => void;
}

export function MapCanvas({ world, settings, onExportPng }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render world when it changes
  useEffect(() => {
    if (!world || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = world.width;
    canvas.height = world.height;

    // Render
    renderWorld(ctx, world, settings);
  }, [world, settings]);

  // Export handler
  const handleExport = useCallback(() => {
    if (canvasRef.current && world) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      exportAsPng(canvasRef.current, `fantasy-map-${settings.map.seed}-${timestamp}.png`);
    }
  }, [world, settings.map.seed]);

  // Expose export function
  useEffect(() => {
    if (onExportPng) {
      // This is a simple way to expose the export function
      // In a real app, you might use a ref or context
    }
  }, [onExportPng]);

  if (!world) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Generating world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-900 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      />
      <button
        onClick={handleExport}
        className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors flex items-center gap-2"
        title="Export as PNG"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Export PNG
      </button>
    </div>
  );
}
