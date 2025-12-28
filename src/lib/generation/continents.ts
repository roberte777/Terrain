// ============================================================================
// Continent Generation
// Creates random continent seed points and builds landmass masks
// ============================================================================

import { Settings } from '../types';
import { PRNG } from './prng';
import { SimplexNoise, fbm } from './noise';

export interface ContinentSeed {
  x: number;
  y: number;
  radius: number;
  id: number;
}

// Generate continent seed points with Poisson-ish spacing
export function generateContinentSeeds(
  settings: Settings,
  prng: PRNG
): ContinentSeed[] {
  const { width, height } = settings.map;
  const { continentCountMin, continentCountMax, seedSpacing } = settings.continents;

  const count = prng.int(continentCountMin, continentCountMax);
  const minDist = Math.min(width, height) * seedSpacing;
  const seeds: ContinentSeed[] = [];
  
  const maxAttempts = 1000;
  let attempts = 0;

  while (seeds.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Generate candidate point (avoid edges)
    const margin = 0.1;
    const x = prng.range(width * margin, width * (1 - margin));
    const y = prng.range(height * margin, height * (1 - margin));

    // Check spacing against existing seeds
    let valid = true;
    for (const seed of seeds) {
      const dx = x - seed.x;
      const dy = y - seed.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) {
        valid = false;
        break;
      }
    }

    if (valid) {
      const baseRadius = Math.min(width, height) * prng.range(0.15, 0.35);
      seeds.push({
        x,
        y,
        radius: baseRadius,
        id: seeds.length + 1,
      });
    }
  }

  // If we couldn't place enough due to spacing, place the rest randomly
  while (seeds.length < count) {
    const margin = 0.15;
    seeds.push({
      x: prng.range(width * margin, width * (1 - margin)),
      y: prng.range(height * margin, height * (1 - margin)),
      radius: Math.min(width, height) * prng.range(0.1, 0.25),
      id: seeds.length + 1,
    });
  }

  return seeds;
}

// Generate continent mask and land mask
export function generateContinentMask(
  settings: Settings,
  seeds: ContinentSeed[],
  noise: SimplexNoise,
  prng: PRNG
): { landMask: Uint8Array; continentId: Uint16Array } {
  const { width, height, seaLevel } = settings.map;
  const { maskFalloff, coastlineNoiseFreq, coastlineNoiseAmp, archipelagoChance } = settings.continents;
  
  const size = width * height;
  const landMask = new Uint8Array(size);
  const continentId = new Uint16Array(size);
  const continentInfluence = new Float32Array(size);

  // Calculate continent influence for each cell
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let maxInfluence = 0;
      let maxId = 0;

      for (const seed of seeds) {
        const dx = x - seed.x;
        const dy = y - seed.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normalizedDist = dist / seed.radius;
        
        // Influence falls off with distance
        const influence = Math.max(0, 1 - Math.pow(normalizedDist, maskFalloff));
        
        if (influence > maxInfluence) {
          maxInfluence = influence;
          maxId = seed.id;
        }
      }

      continentInfluence[idx] = maxInfluence;
      continentId[idx] = maxId;
    }
  }

  // Add coastline noise and determine land
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const nx = x / width;
      const ny = y / height;

      // Add noise to coastlines
      const coastNoise = fbm(noise, nx, ny, 4, coastlineNoiseFreq, 0.5) * coastlineNoiseAmp;
      const totalValue = continentInfluence[idx] + coastNoise;

      // Threshold against sea level
      if (totalValue > seaLevel) {
        landMask[idx] = 1;
      }
    }
  }

  // Add archipelago islands
  if (archipelagoChance > 0) {
    const islandNoise = new SimplexNoise(prng.fork());
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (landMask[idx] === 0) {
          const nx = x / width;
          const ny = y / height;
          
          // High frequency noise for small islands
          const islandValue = fbm(islandNoise, nx, ny, 3, 20, 0.5);
          if (islandValue > (1 - archipelagoChance * 0.5)) {
            // Only create islands near existing land
            let nearLand = false;
            const checkRadius = 20;
            outer:
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
              for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const nx2 = x + dx;
                const ny2 = y + dy;
                if (nx2 >= 0 && nx2 < width && ny2 >= 0 && ny2 < height) {
                  if (landMask[ny2 * width + nx2] === 1) {
                    nearLand = true;
                    break outer;
                  }
                }
              }
            }
            
            if (nearLand && prng.chance(archipelagoChance)) {
              landMask[idx] = 1;
              // Find nearest continent for ID
              continentId[idx] = continentId[Math.max(0, idx - 1)] || 1;
            }
          }
        }
      }
    }
  }

  return { landMask, continentId };
}
