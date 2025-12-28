// ============================================================================
// Biome Classification
// Assigns biomes based on temperature, moisture, and elevation
// ============================================================================

import { Biome, Settings } from '../types';

export function classifyBiomes(
  heightMap: Float32Array,
  landMask: Uint8Array,
  lakeMask: Uint8Array,
  temperature: Float32Array,
  moisture: Float32Array,
  settings: Settings,
  width: number,
  height: number
): Uint8Array {
  const { desertMoistureMax, snowTempMax, mountainElevationMin, beachElevationRange } = settings.biomes;
  const { seaLevel } = settings.map;
  const size = width * height;
  const biome = new Uint8Array(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const elev = heightMap[idx];
      const temp = temperature[idx];
      const moist = moisture[idx];

      // Water biomes
      if (landMask[idx] === 0) {
        biome[idx] = Biome.Ocean;
        continue;
      }

      if (lakeMask[idx] === 1) {
        biome[idx] = Biome.Lake;
        continue;
      }

      // Normalize elevation above sea level
      const landElev = (elev - seaLevel) / (1 - seaLevel);

      // Beach
      if (landElev < beachElevationRange) {
        // Check if near ocean
        let nearOcean = false;
        const checkRadius = 3;
        outer:
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
          for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            const nx = x + dx;
            const ny2 = y + dy;
            if (nx >= 0 && nx < width && ny2 >= 0 && ny2 < height) {
              if (landMask[ny2 * width + nx] === 0) {
                nearOcean = true;
                break outer;
              }
            }
          }
        }
        
        if (nearOcean) {
          biome[idx] = Biome.Beach;
          continue;
        }
      }

      // High mountains
      if (landElev >= mountainElevationMin) {
        if (temp < snowTempMax * 1.5) {
          biome[idx] = Biome.Snow;
        } else {
          biome[idx] = Biome.MountainRock;
        }
        continue;
      }

      // Temperature/moisture based biomes
      if (temp < snowTempMax) {
        // Cold biomes
        biome[idx] = Biome.Snow;
      } else if (temp < snowTempMax * 2) {
        // Cool biomes
        if (moist < 0.3) {
          biome[idx] = Biome.Tundra;
        } else {
          biome[idx] = Biome.Taiga;
        }
      } else if (temp < 0.5) {
        // Temperate biomes
        if (moist < desertMoistureMax) {
          biome[idx] = Biome.Grassland;
        } else if (moist < 0.5) {
          biome[idx] = Biome.Grassland;
        } else {
          biome[idx] = Biome.TemperateForest;
        }
      } else if (temp < 0.75) {
        // Warm biomes
        if (moist < desertMoistureMax) {
          biome[idx] = Biome.Desert;
        } else if (moist < 0.4) {
          biome[idx] = Biome.Savanna;
        } else if (moist < 0.7) {
          biome[idx] = Biome.Grassland;
        } else {
          biome[idx] = Biome.TemperateForest;
        }
      } else {
        // Hot biomes
        if (moist < desertMoistureMax) {
          biome[idx] = Biome.Desert;
        } else if (moist < 0.35) {
          biome[idx] = Biome.Savanna;
        } else if (moist < 0.6) {
          biome[idx] = Biome.Grassland;
        } else {
          biome[idx] = Biome.Rainforest;
        }
      }
    }
  }

  return biome;
}
