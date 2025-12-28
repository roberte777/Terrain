'use client';

// ============================================================================
// Map Generator Hook
// Manages world generation state and worker communication
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, WorldData, DEFAULT_SETTINGS } from '../lib/types';
import { generateWorld } from '../lib/generation';

interface GeneratorState {
  world: WorldData | null;
  isGenerating: boolean;
  progress: { stage: string; percent: number };
  error: string | null;
}

export function useMapGenerator(initialSettings: Settings = DEFAULT_SETTINGS) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [state, setState] = useState<GeneratorState>({
    world: null,
    isGenerating: false,
    progress: { stage: '', percent: 0 },
    error: null,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Generate world (runs in main thread for simplicity, could be moved to worker)
  const generate = useCallback((settingsToUse: Settings) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: { stage: 'Starting...', percent: 0 },
    }));

    // Use requestAnimationFrame to allow UI to update
    requestAnimationFrame(() => {
      try {
        const world = generateWorld(settingsToUse, (stage, percent) => {
          setState(prev => ({
            ...prev,
            progress: { stage, percent },
          }));
        });

        setState(prev => ({
          ...prev,
          world,
          isGenerating: false,
          progress: { stage: 'Complete!', percent: 100 },
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Generation failed',
        }));
      }
    });
  }, []);

  // Regenerate with current settings
  const regenerate = useCallback(() => {
    generate(settings);
  }, [generate, settings]);

  // Randomize seed
  const randomizeSeed = useCallback(() => {
    const newSeed = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newSettings = {
      ...settings,
      map: { ...settings.map, seed: newSeed },
    };
    setSettings(newSettings);
    
    if (settings.performance.autoRegenerate) {
      generate(newSettings);
    }
  }, [settings, generate]);

  // Update settings with optional auto-regeneration
  const updateSettings = useCallback((updates: Partial<Settings> | ((prev: Settings) => Settings)) => {
    setSettings(prev => {
      const newSettings = typeof updates === 'function' 
        ? updates(prev) 
        : deepMerge(prev, updates);

      // Auto-regenerate with debounce
      if (newSettings.performance.autoRegenerate) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          generate(newSettings);
        }, newSettings.performance.debounceMs);
      }

      return newSettings;
    });
  }, [generate]);

  // Apply preset
  const applyPreset = useCallback((presetSettings: Partial<Settings>) => {
    const newSettings = deepMerge(DEFAULT_SETTINGS, presetSettings);
    setSettings(newSettings);
    generate(newSettings);
  }, [generate]);

  // Generate on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      generate(settings);
    }
  }, [generate, settings]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    settings,
    world: state.world,
    isGenerating: state.isGenerating,
    progress: state.progress,
    error: state.error,
    regenerate,
    randomizeSeed,
    updateSettings,
    applyPreset,
    setSettings,
  };
}

// Deep merge utility specifically for Settings
function deepMerge(target: Settings, source: Partial<Settings>): Settings {
  return {
    map: { ...target.map, ...source.map },
    continents: { ...target.continents, ...source.continents },
    elevation: { ...target.elevation, ...source.elevation },
    hydrology: { ...target.hydrology, ...source.hydrology },
    climate: { ...target.climate, ...source.climate },
    biomes: { ...target.biomes, ...source.biomes },
    forests: { ...target.forests, ...source.forests },
    cities: { ...target.cities, ...source.cities },
    roads: { ...target.roads, ...source.roads },
    render: { ...target.render, ...source.render },
    performance: { ...target.performance, ...source.performance },
  };
}
