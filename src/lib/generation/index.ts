// ============================================================================
// Main World Generation Pipeline
// Orchestrates all generation steps into a pure function
// ============================================================================

import { Settings, WorldData } from '../types';
import { PRNG } from './prng';
import { SimplexNoise } from './noise';
import { generateContinentSeeds, generateContinentMask } from './continents';
import { generateMountainRanges, generateHeightMap } from './elevation';
import { 
  calculateFlowDirection, 
  calculateFlowAccumulation, 
  generateRivers,
  detectLakes,
  calculateWaterDistance
} from './hydrology';
import { generateTemperature, generateMoisture } from './climate';
import { classifyBiomes } from './biomes';
import { generateForests } from './forests';
import { placeCities, generateRoads } from './cities';

export type ProgressCallback = (stage: string, percent: number) => void;

// Main generation function - pure function from settings + seed
export function generateWorld(
  settings: Settings,
  onProgress?: ProgressCallback
): WorldData {
  const { width, height, seed } = settings.map;

  // Initialize PRNG
  const prng = new PRNG(seed);

  onProgress?.('Initializing...', 0);

  // Step 1: Generate continents
  onProgress?.('Generating continents...', 5);
  const continentSeeds = generateContinentSeeds(settings, prng.fork());
  const { landMask, continentId } = generateContinentMask(
    settings, 
    continentSeeds, 
    new SimplexNoise(prng.fork()),
    prng.fork()
  );

  // Step 2: Generate elevation and mountains
  onProgress?.('Building mountains...', 15);
  const mountainRanges = generateMountainRanges(settings, landMask, prng.fork());
  const { heightMap, mountainMask } = generateHeightMap(
    settings,
    landMask,
    mountainRanges,
    new SimplexNoise(prng.fork()),
    prng.fork()
  );

  // Step 3: Generate hydrology
  onProgress?.('Simulating water flow...', 30);
  const flowDir = calculateFlowDirection(heightMap, landMask, width, height);
  const flowAccum = calculateFlowAccumulation(flowDir, landMask, width, height);
  const rivers = generateRivers(flowAccum, flowDir, landMask, heightMap, settings, width, height);
  
  onProgress?.('Detecting lakes...', 40);
  const lakeMask = detectLakes(heightMap, landMask, flowDir, settings, width, height);
  const waterDistance = calculateWaterDistance(landMask, rivers, lakeMask, width, height);

  // Step 4: Generate climate
  onProgress?.('Calculating climate...', 50);
  const temperature = generateTemperature(
    heightMap, 
    landMask, 
    settings, 
    width, 
    height,
    new SimplexNoise(prng.fork())
  );
  const moisture = generateMoisture(
    heightMap,
    landMask,
    waterDistance,
    settings,
    width,
    height,
    new SimplexNoise(prng.fork())
  );

  // Step 5: Classify biomes
  onProgress?.('Assigning biomes...', 60);
  const biome = classifyBiomes(
    heightMap,
    landMask,
    lakeMask,
    temperature,
    moisture,
    settings,
    width,
    height
  );

  // Step 6: Generate forests
  onProgress?.('Growing forests...', 70);
  const forest = generateForests(
    biome,
    moisture,
    waterDistance,
    settings,
    width,
    height,
    new SimplexNoise(prng.fork())
  );

  // Step 7: Place cities
  onProgress?.('Founding cities...', 80);
  const cities = placeCities(
    heightMap,
    landMask,
    biome,
    rivers,
    settings,
    width,
    height,
    prng.fork()
  );

  // Step 8: Generate roads
  onProgress?.('Building roads...', 90);
  const roads = generateRoads(
    cities,
    heightMap,
    landMask,
    forest,
    settings,
    width,
    height
  );

  onProgress?.('Complete!', 100);

  return {
    width,
    height,
    heightMap,
    landMask,
    temperature,
    moisture,
    biome,
    flowDir,
    flowAccum,
    rivers,
    forest,
    cities,
    roads,
    debug: {
      continentId,
      mountainMask,
      lakeMask,
    },
  };
}

// Re-export for convenience
export { PRNG } from './prng';
export { SimplexNoise, fbm, ridgedFbm } from './noise';
