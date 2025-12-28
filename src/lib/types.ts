// ============================================================================
// Core Types for Procedural Fantasy World Map Generator
// ============================================================================

// Biome enumeration
export enum Biome {
  Ocean = 0,
  Beach = 1,
  Lake = 2,
  Snow = 3,
  Tundra = 4,
  Taiga = 5,
  Grassland = 6,
  TemperateForest = 7,
  Rainforest = 8,
  Desert = 9,
  Savanna = 10,
  MountainRock = 11,
}

// Biome display names and colors
export const BiomeInfo: Record<Biome, { name: string; color: string }> = {
  [Biome.Ocean]: { name: 'Ocean', color: '#1a5276' },
  [Biome.Beach]: { name: 'Beach', color: '#f9e79f' },
  [Biome.Lake]: { name: 'Lake', color: '#3498db' },
  [Biome.Snow]: { name: 'Snow', color: '#fdfefe' },
  [Biome.Tundra]: { name: 'Tundra', color: '#aeb6bf' },
  [Biome.Taiga]: { name: 'Taiga', color: '#1e8449' },
  [Biome.Grassland]: { name: 'Grassland', color: '#82e0aa' },
  [Biome.TemperateForest]: { name: 'Temperate Forest', color: '#239b56' },
  [Biome.Rainforest]: { name: 'Rainforest', color: '#145a32' },
  [Biome.Desert]: { name: 'Desert', color: '#f5b041' },
  [Biome.Savanna]: { name: 'Savanna', color: '#d4ac0d' },
  [Biome.MountainRock]: { name: 'Mountain', color: '#7b7d7d' },
};

// City type
export type CityType = 'capital' | 'city' | 'town' | 'port';

export interface City {
  id: number;
  x: number;
  y: number;
  size: number;
  type: CityType;
  name: string;
}

export interface Road {
  fromCityId: number;
  toCityId: number;
  path: { x: number; y: number }[];
}

// World data output from generation
export interface WorldData {
  width: number;
  height: number;

  heightMap: Float32Array;
  landMask: Uint8Array;
  temperature: Float32Array;
  moisture: Float32Array;
  biome: Uint8Array;

  flowDir: Int8Array;
  flowAccum: Float32Array;
  rivers: Uint8Array;

  forest: Uint8Array;
  cities: City[];
  roads: Road[];

  debug: {
    continentId: Uint16Array;
    mountainMask: Uint8Array;
    lakeMask: Uint8Array;
  };
}

// Render view modes
export type RenderView = 'elevation' | 'biome' | 'hydrology' | 'political' | 'debug';

// Complete settings schema
export interface Settings {
  map: {
    width: number;
    height: number;
    seed: string;
    seaLevel: number;
  };

  continents: {
    continentCountMin: number;
    continentCountMax: number;
    seedSpacing: number;
    maskFalloff: number;
    coastlineNoiseFreq: number;
    coastlineNoiseAmp: number;
    archipelagoChance: number;
  };

  elevation: {
    baseNoiseFreq: number;
    baseNoiseOctaves: number;
    baseNoisePersistence: number;
    ridgeNoiseFreq: number;
    ridgeNoiseOctaves: number;
    ridgeStrength: number;
    mountainRangeCountMin: number;
    mountainRangeCountMax: number;
    mountainRangeWidth: number;
    mountainRangeHeight: number;
    mountainRangeCurviness: number;
    erosionThermalIterations: number;
  };

  hydrology: {
    rainfallBias: number;
    riverSourceCount: number;
    riverMinAccum: number;
    lakeFillEnabled: boolean;
    hydraulicErosionDrops: number;
    hydraulicErosionEnabled: boolean;
  };

  climate: {
    latitudeTempStrength: number;
    elevationTempStrength: number;
    windDirectionDegrees: number;
    rainShadowStrength: number;
    moistureFromWaterStrength: number;
  };

  biomes: {
    desertMoistureMax: number;
    snowTempMax: number;
    mountainElevationMin: number;
    beachElevationRange: number;
  };

  forests: {
    enabled: boolean;
    densityNoiseFreq: number;
    densityThreshold: number;
    moistureInfluence: number;
    riverProximityBoost: number;
  };

  cities: {
    enabled: boolean;
    count: number;
    minSpacing: number;
    coastPreference: number;
    riverPreference: number;
    flatPreference: number;
  };

  roads: {
    enabled: boolean;
    maxConnectionsPerCity: number;
    costElevation: number;
    costWater: number;
    costForest: number;
    costMountain: number;
  };

  render: {
    view: RenderView;
    showRivers: boolean;
    showCities: boolean;
    showForests: boolean;
    showContours: boolean;
    contourInterval: number;
  };

  performance: {
    autoRegenerate: boolean;
    debounceMs: number;
  };
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  map: {
    width: 512,
    height: 384,
    seed: 'fantasy-world',
    seaLevel: 0.4,
  },

  continents: {
    continentCountMin: 2,
    continentCountMax: 5,
    seedSpacing: 0.25,
    maskFalloff: 2.0,
    coastlineNoiseFreq: 4.0,
    coastlineNoiseAmp: 0.15,
    archipelagoChance: 0.1,
  },

  elevation: {
    baseNoiseFreq: 2.0,
    baseNoiseOctaves: 6,
    baseNoisePersistence: 0.5,
    ridgeNoiseFreq: 3.0,
    ridgeNoiseOctaves: 4,
    ridgeStrength: 0.3,
    mountainRangeCountMin: 3,
    mountainRangeCountMax: 8,
    mountainRangeWidth: 0.08,
    mountainRangeHeight: 0.4,
    mountainRangeCurviness: 0.5,
    erosionThermalIterations: 5,
  },

  hydrology: {
    rainfallBias: 0.5,
    riverSourceCount: 50,
    riverMinAccum: 100,
    lakeFillEnabled: true,
    hydraulicErosionDrops: 0,
    hydraulicErosionEnabled: false,
  },

  climate: {
    latitudeTempStrength: 0.7,
    elevationTempStrength: 0.5,
    windDirectionDegrees: 270,
    rainShadowStrength: 0.3,
    moistureFromWaterStrength: 0.5,
  },

  biomes: {
    desertMoistureMax: 0.2,
    snowTempMax: 0.15,
    mountainElevationMin: 0.75,
    beachElevationRange: 0.05,
  },

  forests: {
    enabled: true,
    densityNoiseFreq: 8.0,
    densityThreshold: 0.4,
    moistureInfluence: 0.6,
    riverProximityBoost: 0.2,
  },

  cities: {
    enabled: true,
    count: 20,
    minSpacing: 30,
    coastPreference: 1.5,
    riverPreference: 2.0,
    flatPreference: 1.0,
  },

  roads: {
    enabled: true,
    maxConnectionsPerCity: 3,
    costElevation: 2.0,
    costWater: 100.0,
    costForest: 1.5,
    costMountain: 5.0,
  },

  render: {
    view: 'biome',
    showRivers: true,
    showCities: true,
    showForests: true,
    showContours: false,
    contourInterval: 0.1,
  },

  performance: {
    autoRegenerate: true,
    debounceMs: 300,
  },
};

// Preset configurations
export interface Preset {
  name: string;
  description: string;
  settings: Partial<Settings>;
}

export const PRESETS: Preset[] = [
  {
    name: 'Earth-like',
    description: 'Balanced world with varied biomes',
    settings: DEFAULT_SETTINGS,
  },
  {
    name: 'Archipelago',
    description: 'Many small islands',
    settings: {
      map: { ...DEFAULT_SETTINGS.map, seaLevel: 0.55 },
      continents: {
        ...DEFAULT_SETTINGS.continents,
        continentCountMin: 8,
        continentCountMax: 15,
        maskFalloff: 3.0,
        archipelagoChance: 0.4,
      },
    },
  },
  {
    name: 'Pangea',
    description: 'One massive supercontinent',
    settings: {
      map: { ...DEFAULT_SETTINGS.map, seaLevel: 0.35 },
      continents: {
        ...DEFAULT_SETTINGS.continents,
        continentCountMin: 1,
        continentCountMax: 1,
        maskFalloff: 1.2,
      },
    },
  },
  {
    name: 'High Mountains',
    description: 'Dramatic peaks and valleys',
    settings: {
      elevation: {
        ...DEFAULT_SETTINGS.elevation,
        mountainRangeCountMin: 8,
        mountainRangeCountMax: 15,
        mountainRangeHeight: 0.6,
        ridgeStrength: 0.5,
      },
    },
  },
  {
    name: 'Dry World',
    description: 'Arid climate with deserts',
    settings: {
      hydrology: {
        ...DEFAULT_SETTINGS.hydrology,
        rainfallBias: 0.2,
        riverSourceCount: 20,
      },
      climate: {
        ...DEFAULT_SETTINGS.climate,
        moistureFromWaterStrength: 0.2,
      },
    },
  },
];

// Worker message types
export type WorkerRequest =
  | { type: 'generate'; settings: Settings }
  | { type: 'cancel' };

export type WorkerResponse =
  | { type: 'progress'; stage: string; percent: number }
  | { type: 'result'; world: WorldData }
  | { type: 'error'; message: string };

// Render buffers for quick view switching
export interface RenderBuffers {
  elevation: ImageData;
  biome: ImageData;
  hydrology: ImageData;
  political: ImageData;
  debug: ImageData;
}
