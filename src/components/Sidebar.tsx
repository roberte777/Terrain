'use client';

// ============================================================================
// Sidebar Controls Component
// Contains all the settings controls grouped by category
// ============================================================================

import { Settings, RenderView } from '../lib/types';
import { Section } from './controls/Section';
import { Slider } from './controls/Slider';
import { Toggle } from './controls/Toggle';
import { NumberInput } from './controls/NumberInput';
import { Select } from './controls/Select';

interface SidebarProps {
  settings: Settings;
  onSettingsChange: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  isGenerating?: boolean;
}

export function Sidebar({ settings, onSettingsChange }: SidebarProps) {
  // Helper to update nested settings
  const updateMap = (key: keyof Settings['map'], value: number | string) => {
    onSettingsChange(prev => ({
      ...prev,
      map: { ...prev.map, [key]: value },
    }));
  };

  const updateContinents = (key: keyof Settings['continents'], value: number) => {
    onSettingsChange(prev => ({
      ...prev,
      continents: { ...prev.continents, [key]: value },
    }));
  };

  const updateElevation = (key: keyof Settings['elevation'], value: number) => {
    onSettingsChange(prev => ({
      ...prev,
      elevation: { ...prev.elevation, [key]: value },
    }));
  };

  const updateHydrology = (key: keyof Settings['hydrology'], value: number | boolean) => {
    onSettingsChange(prev => ({
      ...prev,
      hydrology: { ...prev.hydrology, [key]: value },
    }));
  };

  const updateClimate = (key: keyof Settings['climate'], value: number) => {
    onSettingsChange(prev => ({
      ...prev,
      climate: { ...prev.climate, [key]: value },
    }));
  };

  const updateBiomes = (key: keyof Settings['biomes'], value: number) => {
    onSettingsChange(prev => ({
      ...prev,
      biomes: { ...prev.biomes, [key]: value },
    }));
  };

  const updateForests = (key: keyof Settings['forests'], value: number | boolean) => {
    onSettingsChange(prev => ({
      ...prev,
      forests: { ...prev.forests, [key]: value },
    }));
  };

  const updateCities = (key: keyof Settings['cities'], value: number | boolean) => {
    onSettingsChange(prev => ({
      ...prev,
      cities: { ...prev.cities, [key]: value },
    }));
  };

  const updateRoads = (key: keyof Settings['roads'], value: number | boolean) => {
    onSettingsChange(prev => ({
      ...prev,
      roads: { ...prev.roads, [key]: value },
    }));
  };

  const updateRender = (key: keyof Settings['render'], value: RenderView | boolean | number) => {
    onSettingsChange(prev => ({
      ...prev,
      render: { ...prev.render, [key]: value },
    }));
  };

  const updatePerformance = (key: keyof Settings['performance'], value: boolean | number) => {
    onSettingsChange(prev => ({
      ...prev,
      performance: { ...prev.performance, [key]: value },
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-800 text-white">
      {/* World & Seed */}
      <Section title="🗺️ World & Seed" defaultOpen={true}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Seed</label>
            <input
              type="text"
              value={settings.map.seed}
              onChange={(e) => updateMap('seed', e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter seed..."
            />
          </div>
          <NumberInput
            label="Width"
            value={settings.map.width}
            min={128}
            max={2048}
            step={64}
            onChange={(v) => updateMap('width', v)}
          />
          <NumberInput
            label="Height"
            value={settings.map.height}
            min={128}
            max={2048}
            step={64}
            onChange={(v) => updateMap('height', v)}
          />
          <Slider
            label="Sea Level"
            value={settings.map.seaLevel}
            min={0.1}
            max={0.7}
            step={0.01}
            onChange={(v) => updateMap('seaLevel', v)}
          />
        </div>
      </Section>

      {/* Continents */}
      <Section title="🌍 Continents & Coastline">
        <Slider
          label="Min Continents"
          value={settings.continents.continentCountMin}
          min={1}
          max={10}
          step={1}
          onChange={(v) => updateContinents('continentCountMin', v)}
        />
        <Slider
          label="Max Continents"
          value={settings.continents.continentCountMax}
          min={1}
          max={15}
          step={1}
          onChange={(v) => updateContinents('continentCountMax', v)}
        />
        <Slider
          label="Continent Size (Falloff)"
          value={settings.continents.maskFalloff}
          min={0.5}
          max={4}
          step={0.1}
          onChange={(v) => updateContinents('maskFalloff', v)}
        />
        <Slider
          label="Coastline Noise"
          value={settings.continents.coastlineNoiseAmp}
          min={0}
          max={0.4}
          step={0.01}
          onChange={(v) => updateContinents('coastlineNoiseAmp', v)}
        />
        <Slider
          label="Archipelago Chance"
          value={settings.continents.archipelagoChance}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => updateContinents('archipelagoChance', v)}
        />
      </Section>

      {/* Elevation */}
      <Section title="⛰️ Elevation & Mountains">
        <Slider
          label="Base Noise Frequency"
          value={settings.elevation.baseNoiseFreq}
          min={0.5}
          max={8}
          step={0.1}
          onChange={(v) => updateElevation('baseNoiseFreq', v)}
        />
        <Slider
          label="Noise Octaves"
          value={settings.elevation.baseNoiseOctaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => updateElevation('baseNoiseOctaves', v)}
        />
        <Slider
          label="Min Mountain Ranges"
          value={settings.elevation.mountainRangeCountMin}
          min={0}
          max={15}
          step={1}
          onChange={(v) => updateElevation('mountainRangeCountMin', v)}
        />
        <Slider
          label="Max Mountain Ranges"
          value={settings.elevation.mountainRangeCountMax}
          min={0}
          max={20}
          step={1}
          onChange={(v) => updateElevation('mountainRangeCountMax', v)}
        />
        <Slider
          label="Mountain Height"
          value={settings.elevation.mountainRangeHeight}
          min={0.1}
          max={0.8}
          step={0.01}
          onChange={(v) => updateElevation('mountainRangeHeight', v)}
        />
        <Slider
          label="Ridge Strength"
          value={settings.elevation.ridgeStrength}
          min={0}
          max={0.8}
          step={0.01}
          onChange={(v) => updateElevation('ridgeStrength', v)}
        />
      </Section>

      {/* Hydrology */}
      <Section title="💧 Hydrology">
        <Slider
          label="River Threshold"
          value={settings.hydrology.riverMinAccum}
          min={10}
          max={500}
          step={10}
          onChange={(v) => updateHydrology('riverMinAccum', v)}
        />
        <Slider
          label="Rainfall Bias"
          value={settings.hydrology.rainfallBias}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateHydrology('rainfallBias', v)}
        />
        <Toggle
          label="Enable Lakes"
          checked={settings.hydrology.lakeFillEnabled}
          onChange={(v) => updateHydrology('lakeFillEnabled', v)}
        />
      </Section>

      {/* Climate */}
      <Section title="🌡️ Climate">
        <Slider
          label="Latitude Temperature Effect"
          value={settings.climate.latitudeTempStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateClimate('latitudeTempStrength', v)}
        />
        <Slider
          label="Elevation Temperature Effect"
          value={settings.climate.elevationTempStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateClimate('elevationTempStrength', v)}
        />
        <Slider
          label="Wind Direction (degrees)"
          value={settings.climate.windDirectionDegrees}
          min={0}
          max={360}
          step={15}
          onChange={(v) => updateClimate('windDirectionDegrees', v)}
        />
        <Slider
          label="Rain Shadow Strength"
          value={settings.climate.rainShadowStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateClimate('rainShadowStrength', v)}
        />
        <Slider
          label="Moisture from Water"
          value={settings.climate.moistureFromWaterStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateClimate('moistureFromWaterStrength', v)}
        />
      </Section>

      {/* Biomes */}
      <Section title="🌿 Biomes">
        <Slider
          label="Desert Moisture Max"
          value={settings.biomes.desertMoistureMax}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => updateBiomes('desertMoistureMax', v)}
        />
        <Slider
          label="Snow Temperature Max"
          value={settings.biomes.snowTempMax}
          min={0}
          max={0.4}
          step={0.01}
          onChange={(v) => updateBiomes('snowTempMax', v)}
        />
        <Slider
          label="Mountain Elevation Min"
          value={settings.biomes.mountainElevationMin}
          min={0.5}
          max={0.95}
          step={0.01}
          onChange={(v) => updateBiomes('mountainElevationMin', v)}
        />
      </Section>

      {/* Forests */}
      <Section title="🌲 Forests">
        <Toggle
          label="Enable Forests"
          checked={settings.forests.enabled}
          onChange={(v) => updateForests('enabled', v)}
        />
        <Slider
          label="Density Threshold"
          value={settings.forests.densityThreshold}
          min={0}
          max={0.8}
          step={0.01}
          onChange={(v) => updateForests('densityThreshold', v)}
          disabled={!settings.forests.enabled}
        />
        <Slider
          label="Moisture Influence"
          value={settings.forests.moistureInfluence}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateForests('moistureInfluence', v)}
          disabled={!settings.forests.enabled}
        />
        <Slider
          label="River Proximity Boost"
          value={settings.forests.riverProximityBoost}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => updateForests('riverProximityBoost', v)}
          disabled={!settings.forests.enabled}
        />
      </Section>

      {/* Cities */}
      <Section title="🏰 Cities">
        <Toggle
          label="Enable Cities"
          checked={settings.cities.enabled}
          onChange={(v) => updateCities('enabled', v)}
        />
        <NumberInput
          label="City Count"
          value={settings.cities.count}
          min={0}
          max={100}
          onChange={(v) => updateCities('count', v)}
          disabled={!settings.cities.enabled}
        />
        <Slider
          label="Min Spacing"
          value={settings.cities.minSpacing}
          min={10}
          max={100}
          step={5}
          onChange={(v) => updateCities('minSpacing', v)}
          disabled={!settings.cities.enabled}
        />
        <Slider
          label="Coast Preference"
          value={settings.cities.coastPreference}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => updateCities('coastPreference', v)}
          disabled={!settings.cities.enabled}
        />
        <Slider
          label="River Preference"
          value={settings.cities.riverPreference}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => updateCities('riverPreference', v)}
          disabled={!settings.cities.enabled}
        />
      </Section>

      {/* Roads */}
      <Section title="🛤️ Roads">
        <Toggle
          label="Enable Roads"
          checked={settings.roads.enabled}
          onChange={(v) => updateRoads('enabled', v)}
        />
        <NumberInput
          label="Max Connections per City"
          value={settings.roads.maxConnectionsPerCity}
          min={1}
          max={5}
          onChange={(v) => updateRoads('maxConnectionsPerCity', v)}
          disabled={!settings.roads.enabled}
        />
      </Section>

      {/* Rendering */}
      <Section title="🎨 Rendering" defaultOpen={true}>
        <Select
          label="View Mode"
          value={settings.render.view}
          options={[
            { value: 'biome', label: 'Biomes' },
            { value: 'elevation', label: 'Elevation' },
            { value: 'hydrology', label: 'Moisture' },
            { value: 'political', label: 'Political' },
            { value: 'debug', label: 'Debug' },
          ]}
          onChange={(v) => updateRender('view', v)}
        />
        <Toggle
          label="Show Rivers"
          checked={settings.render.showRivers}
          onChange={(v) => updateRender('showRivers', v)}
        />
        <Toggle
          label="Show Cities"
          checked={settings.render.showCities}
          onChange={(v) => updateRender('showCities', v)}
        />
        <Toggle
          label="Show Forests"
          checked={settings.render.showForests}
          onChange={(v) => updateRender('showForests', v)}
        />
        <Toggle
          label="Show Contours"
          checked={settings.render.showContours}
          onChange={(v) => updateRender('showContours', v)}
        />
      </Section>

      {/* Performance */}
      <Section title="⚙️ Performance">
        <Toggle
          label="Auto Regenerate"
          checked={settings.performance.autoRegenerate}
          onChange={(v) => updatePerformance('autoRegenerate', v)}
        />
        <Slider
          label="Debounce (ms)"
          value={settings.performance.debounceMs}
          min={100}
          max={1000}
          step={50}
          onChange={(v) => updatePerformance('debounceMs', v)}
          disabled={!settings.performance.autoRegenerate}
        />
      </Section>
    </div>
  );
}
