// ============================================================================
// Forest Generation
// Creates forest density map based on biome and moisture
// ============================================================================

import { Biome, Settings } from '../types';
import { SimplexNoise, fbm } from './noise';

// Biomes that can have forests
const FOREST_BIOMES = new Set([
  Biome.Taiga,
  Biome.TemperateForest,
  Biome.Rainforest,
  Biome.Grassland,
  Biome.Savanna,
]);

export function generateForests(
  biome: Uint8Array,
  moisture: Float32Array,
  waterDistance: Float32Array,
  settings: Settings,
  width: number,
  height: number,
  noise: SimplexNoise
): Uint8Array {
  const { 
    enabled, 
    densityNoiseFreq, 
    densityThreshold, 
    moistureInfluence,
    riverProximityBoost
  } = settings.forests;

  const size = width * height;
  const forest = new Uint8Array(size);

  if (!enabled) {
    return forest;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const cellBiome = biome[idx] as Biome;

      // Only add forests to appropriate biomes
      if (!FOREST_BIOMES.has(cellBiome)) {
        continue;
      }

      const nx = x / width;
      const ny = y / height;

      // Base forest density from noise
      let density = fbm(noise, nx, ny, 4, densityNoiseFreq, 0.6);

      // Influence from moisture
      density += moisture[idx] * moistureInfluence;

      // Boost near rivers
      const riverProximity = 1 - waterDistance[idx];
      density += riverProximity * riverProximityBoost;

      // Biome-specific modifiers
      switch (cellBiome) {
        case Biome.Rainforest:
          density += 0.3;
          break;
        case Biome.TemperateForest:
          density += 0.2;
          break;
        case Biome.Taiga:
          density += 0.1;
          break;
        case Biome.Savanna:
          density -= 0.2;
          break;
        case Biome.Grassland:
          density -= 0.1;
          break;
      }

      // Apply threshold
      if (density > densityThreshold) {
        // Scale to 0-255
        const intensity = Math.min(255, Math.floor((density - densityThreshold) / (1 - densityThreshold) * 255));
        forest[idx] = Math.max(1, intensity);
      }
    }
  }

  return forest;
}
