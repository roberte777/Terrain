// ============================================================================
// Color Utilities and Palettes
// ============================================================================

import { Biome, BiomeInfo } from '../types';

// Parse hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Pre-computed biome colors as RGB
export const BIOME_COLORS: Record<Biome, { r: number; g: number; b: number }> = {
  [Biome.Ocean]: hexToRgb(BiomeInfo[Biome.Ocean].color),
  [Biome.Beach]: hexToRgb(BiomeInfo[Biome.Beach].color),
  [Biome.Lake]: hexToRgb(BiomeInfo[Biome.Lake].color),
  [Biome.Snow]: hexToRgb(BiomeInfo[Biome.Snow].color),
  [Biome.Tundra]: hexToRgb(BiomeInfo[Biome.Tundra].color),
  [Biome.Taiga]: hexToRgb(BiomeInfo[Biome.Taiga].color),
  [Biome.Grassland]: hexToRgb(BiomeInfo[Biome.Grassland].color),
  [Biome.TemperateForest]: hexToRgb(BiomeInfo[Biome.TemperateForest].color),
  [Biome.Rainforest]: hexToRgb(BiomeInfo[Biome.Rainforest].color),
  [Biome.Desert]: hexToRgb(BiomeInfo[Biome.Desert].color),
  [Biome.Savanna]: hexToRgb(BiomeInfo[Biome.Savanna].color),
  [Biome.MountainRock]: hexToRgb(BiomeInfo[Biome.MountainRock].color),
};

// Interpolate between two colors
export function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

// Elevation gradient colors
export const ELEVATION_GRADIENT = [
  { stop: 0.0, color: { r: 0, g: 0, b: 80 } },      // Deep ocean
  { stop: 0.3, color: { r: 20, g: 60, b: 140 } },   // Ocean
  { stop: 0.4, color: { r: 40, g: 100, b: 180 } },  // Shallow water
  { stop: 0.42, color: { r: 220, g: 210, b: 170 } },// Beach
  { stop: 0.5, color: { r: 100, g: 160, b: 80 } },  // Lowland
  { stop: 0.65, color: { r: 80, g: 120, b: 60 } },  // Hills
  { stop: 0.8, color: { r: 100, g: 100, b: 90 } },  // Mountains
  { stop: 0.95, color: { r: 180, g: 180, b: 180 } },// High peaks
  { stop: 1.0, color: { r: 255, g: 255, b: 255 } }, // Snow caps
];

// Get color from elevation gradient
export function getElevationColor(elevation: number): { r: number; g: number; b: number } {
  for (let i = 0; i < ELEVATION_GRADIENT.length - 1; i++) {
    const curr = ELEVATION_GRADIENT[i];
    const next = ELEVATION_GRADIENT[i + 1];
    
    if (elevation >= curr.stop && elevation <= next.stop) {
      const t = (elevation - curr.stop) / (next.stop - curr.stop);
      return lerpColor(curr.color, next.color, t);
    }
  }
  
  return ELEVATION_GRADIENT[ELEVATION_GRADIENT.length - 1].color;
}

// Temperature gradient (cold to hot)
export const TEMP_GRADIENT = [
  { stop: 0.0, color: { r: 200, g: 220, b: 255 } }, // Freezing
  { stop: 0.3, color: { r: 150, g: 200, b: 220 } }, // Cold
  { stop: 0.5, color: { r: 100, g: 180, b: 100 } }, // Temperate
  { stop: 0.7, color: { r: 220, g: 180, b: 80 } },  // Warm
  { stop: 1.0, color: { r: 200, g: 80, b: 60 } },   // Hot
];

// Moisture gradient (dry to wet)
export const MOISTURE_GRADIENT = [
  { stop: 0.0, color: { r: 220, g: 180, b: 120 } }, // Arid
  { stop: 0.3, color: { r: 200, g: 200, b: 150 } }, // Dry
  { stop: 0.5, color: { r: 150, g: 200, b: 150 } }, // Moderate
  { stop: 0.7, color: { r: 80, g: 180, b: 180 } },  // Humid
  { stop: 1.0, color: { r: 50, g: 100, b: 200 } },  // Wet
];

export function getGradientColor(
  value: number, 
  gradient: { stop: number; color: { r: number; g: number; b: number } }[]
): { r: number; g: number; b: number } {
  for (let i = 0; i < gradient.length - 1; i++) {
    const curr = gradient[i];
    const next = gradient[i + 1];
    
    if (value >= curr.stop && value <= next.stop) {
      const t = (value - curr.stop) / (next.stop - curr.stop);
      return lerpColor(curr.color, next.color, t);
    }
  }
  
  return gradient[gradient.length - 1].color;
}
