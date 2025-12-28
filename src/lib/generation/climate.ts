// ============================================================================
// Climate System
// Temperature and moisture calculation
// ============================================================================

import { Settings } from '../types';
import { SimplexNoise, fbm } from './noise';

// Generate temperature map based on latitude and elevation
export function generateTemperature(
  heightMap: Float32Array,
  landMask: Uint8Array,
  settings: Settings,
  width: number,
  height: number,
  noise: SimplexNoise
): Float32Array {
  const { latitudeTempStrength, elevationTempStrength } = settings.climate;
  const { seaLevel } = settings.map;
  const size = width * height;
  const temperature = new Float32Array(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const nx = x / width;
      const ny = y / height;

      // Base temperature from latitude (hottest at equator)
      const latitudeFactor = 1 - Math.abs(ny - 0.5) * 2;
      let temp = latitudeFactor * latitudeTempStrength + (1 - latitudeTempStrength);

      // Reduce temperature with elevation
      const elevation = heightMap[idx];
      if (landMask[idx] === 1) {
        const normalizedElev = (elevation - seaLevel) / (1 - seaLevel);
        temp -= normalizedElev * elevationTempStrength;
      }

      // Add some noise for variation
      const noiseValue = fbm(noise, nx + 10, ny + 10, 2, 4, 0.5) * 0.1;
      temp += noiseValue - 0.05;

      temperature[idx] = Math.max(0, Math.min(1, temp));
    }
  }

  return temperature;
}

// Generate moisture map based on water proximity and wind patterns
export function generateMoisture(
  heightMap: Float32Array,
  landMask: Uint8Array,
  waterDistance: Float32Array,
  settings: Settings,
  width: number,
  height: number,
  noise: SimplexNoise
): Float32Array {
  const { 
    windDirectionDegrees,
    rainShadowStrength,
    moistureFromWaterStrength
  } = settings.climate;
  const { rainfallBias } = settings.hydrology;
  const size = width * height;
  const moisture = new Float32Array(size);

  // Wind direction vector
  const windRad = windDirectionDegrees * Math.PI / 180;
  const windX = Math.cos(windRad);
  const windY = Math.sin(windRad);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const nx = x / width;
      const ny = y / height;

      // Base moisture from rainfall
      let moist = rainfallBias;

      // Add moisture from water proximity
      const waterProximity = 1 - waterDistance[idx];
      moist += waterProximity * moistureFromWaterStrength;

      // Rain shadow effect
      if (landMask[idx] === 1 && rainShadowStrength > 0) {
        // Check upwind for mountains
        let mountainBlock = 0;
        const checkDist = 50;
        
        for (let d = 1; d <= checkDist; d++) {
          const checkX = Math.round(x - windX * d);
          const checkY = Math.round(y - windY * d);
          
          if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
            const checkIdx = checkY * width + checkX;
            const checkElev = heightMap[checkIdx];
            const currentElev = heightMap[idx];
            
            if (checkElev > currentElev + 0.1) {
              mountainBlock = Math.max(mountainBlock, (checkElev - currentElev) * (1 - d / checkDist));
            }
          }
        }
        
        moist -= mountainBlock * rainShadowStrength;
      }

      // Add noise variation
      const noiseValue = fbm(noise, nx + 20, ny + 20, 3, 6, 0.5) * 0.3;
      moist += noiseValue - 0.15;

      moisture[idx] = Math.max(0, Math.min(1, moist));
    }
  }

  return moisture;
}
