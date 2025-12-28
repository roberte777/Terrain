'use client';

// ============================================================================
// Main Map Generator Component
// Combines all components into the complete application
// ============================================================================

import { useMapGenerator } from '../hooks/useMapGenerator';
import { MapCanvas } from './MapCanvas';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function MapGenerator() {
  const {
    settings,
    world,
    isGenerating,
    progress,
    error,
    regenerate,
    randomizeSeed,
    updateSettings,
    applyPreset,
  } = useMapGenerator();

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top bar */}
      <TopBar
        settings={settings}
        world={world}
        isGenerating={isGenerating}
        progress={progress}
        onRegenerate={regenerate}
        onRandomizeSeed={randomizeSeed}
        onApplyPreset={applyPreset}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-700 overflow-hidden">
          <Sidebar
            settings={settings}
            onSettingsChange={updateSettings}
            isGenerating={isGenerating}
          />
        </div>

        {/* Map canvas */}
        <div className="flex-1 overflow-hidden relative">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-10">
              Error: {error}
            </div>
          )}
          <MapCanvas world={world} settings={settings} />
          
          {/* Generation overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-lg">{progress.stage}</p>
                <p className="text-gray-400">{progress.percent}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        <div>
          Map: {settings.map.width} × {settings.map.height}
          {world && ` | ${world.cities.length} cities | ${world.roads.length} roads`}
        </div>
        <div className="flex items-center gap-4">
          <span>
            Auto-regenerate: {settings.performance.autoRegenerate ? 'On' : 'Off'}
          </span>
          <span>
            View: {settings.render.view}
          </span>
        </div>
      </div>
    </div>
  );
}
