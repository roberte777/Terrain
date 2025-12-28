'use client';

// ============================================================================
// Top Bar Component
// Contains seed controls, regenerate button, and presets
// ============================================================================

import { Settings, PRESETS } from '../lib/types';
import { exportAsJson } from '../lib/rendering/renderer';
import { WorldData } from '../lib/types';

interface TopBarProps {
  settings: Settings;
  world: WorldData | null;
  isGenerating: boolean;
  progress: { stage: string; percent: number };
  onRegenerate: () => void;
  onRandomizeSeed: () => void;
  onApplyPreset: (presetSettings: Partial<Settings>) => void;
}

export function TopBar({
  settings,
  world,
  isGenerating,
  progress,
  onRegenerate,
  onRandomizeSeed,
  onApplyPreset,
}: TopBarProps) {
  const handleExportJson = () => {
    if (!world) return;

    const json = exportAsJson(world, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fantasy-map-${settings.map.seed}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-wrap gap-4">
      {/* Left side - Title and controls */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Fantasy Map Generator
        </h1>

        <div className="h-6 w-px bg-gray-700"></div>

        {/* Seed display */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Seed:</span>
          <code className="text-sm text-blue-400 bg-gray-800 px-2 py-1 rounded font-mono">
            {settings.map.seed}
          </code>
        </div>

        {/* Action buttons */}
        <button
          onClick={onRandomizeSeed}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-1"
          title="Randomize Seed"
        >
          🎲 Random Seed
        </button>

        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-1"
          title="Regenerate Map"
        >
          🔄 Regenerate
        </button>
      </div>

      {/* Center - Progress */}
      {isGenerating && (
        <div className="flex items-center gap-3 flex-1 justify-center min-w-[200px] max-w-[400px]">
          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {progress.stage}
          </span>
        </div>
      )}

      {/* Right side - Presets and Export */}
      <div className="flex items-center gap-3">
        {/* Presets */}
        <select
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const preset = PRESETS.find(p => p.name === e.target.value);
            if (preset) {
              onApplyPreset(preset.settings);
            }
          }}
          value=""
        >
          <option value="" disabled>
            📋 Load Preset...
          </option>
          {PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>

        {/* Export */}
        <button
          onClick={handleExportJson}
          disabled={!world}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors flex items-center gap-1"
          title="Export Settings & Data as JSON"
        >
          📄 Export JSON
        </button>
      </div>
    </div>
  );
}
