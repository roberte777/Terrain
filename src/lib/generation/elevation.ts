// ============================================================================
// Elevation & Mountain Generation
// Creates heightmap with mountain ranges and terrain features
// ============================================================================

import { Settings } from '../types';
import { PRNG } from './prng';
import { SimplexNoise, fbm, ridgedFbm } from './noise';

export interface MountainRange {
  points: { x: number; y: number }[];
  width: number;
  height: number;
}

// Generate mountain range spines using random walk
export function generateMountainRanges(
  settings: Settings,
  landMask: Uint8Array,
  prng: PRNG
): MountainRange[] {
  const { width, height } = settings.map;
  const { 
    mountainRangeCountMin, 
    mountainRangeCountMax,
    mountainRangeWidth,
    mountainRangeHeight,
    mountainRangeCurviness
  } = settings.elevation;

  const ranges: MountainRange[] = [];
  const count = prng.int(mountainRangeCountMin, mountainRangeCountMax);

  for (let i = 0; i < count; i++) {
    // Find a starting point on land
    let startX = 0, startY = 0;
    let found = false;
    
    for (let attempt = 0; attempt < 100 && !found; attempt++) {
      startX = prng.int(0, width - 1);
      startY = prng.int(0, height - 1);
      if (landMask[startY * width + startX] === 1) {
        found = true;
      }
    }
    
    if (!found) continue;

    // Random walk to create spine
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const rangeLength = prng.int(20, 80);
    const baseAngle = prng.range(0, Math.PI * 2);
    let currentAngle = baseAngle;
    let currentX = startX;
    let currentY = startY;

    for (let j = 0; j < rangeLength; j++) {
      // Add curviness
      currentAngle += prng.range(-mountainRangeCurviness, mountainRangeCurviness);
      
      const step = prng.range(3, 8);
      currentX += Math.cos(currentAngle) * step;
      currentY += Math.sin(currentAngle) * step;

      // Keep on land if possible
      const ix = Math.round(currentX);
      const iy = Math.round(currentY);
      
      if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
        if (landMask[iy * width + ix] === 1) {
          points.push({ x: currentX, y: currentY });
        } else {
          // Try to stay on land by adjusting angle
          currentAngle += Math.PI / 4;
        }
      } else {
        break;
      }
    }

    if (points.length > 5) {
      ranges.push({
        points,
        width: mountainRangeWidth * Math.min(width, height) * prng.range(0.8, 1.2),
        height: mountainRangeHeight * prng.range(0.7, 1.3),
      });
    }
  }

  return ranges;
}

// Calculate distance from point to polyline
function distanceToPolyline(
  x: number, 
  y: number, 
  points: { x: number; y: number }[]
): number {
  let minDist = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Project point onto line segment
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) {
      const d = Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2);
      minDist = Math.min(minDist, d);
      continue;
    }

    const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / len2));
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    minDist = Math.min(minDist, dist);
  }

  return minDist;
}

// Generate height map
export function generateHeightMap(
  settings: Settings,
  landMask: Uint8Array,
  mountainRanges: MountainRange[],
  noise: SimplexNoise,
  prng: PRNG
): { heightMap: Float32Array; mountainMask: Uint8Array } {
  const { width, height } = settings.map;
  const { 
    baseNoiseFreq, 
    baseNoiseOctaves, 
    baseNoisePersistence,
    ridgeNoiseFreq,
    ridgeNoiseOctaves,
    ridgeStrength,
    erosionThermalIterations
  } = settings.elevation;
  const { seaLevel } = settings.map;

  const size = width * height;
  const heightMap = new Float32Array(size);
  const mountainMask = new Uint8Array(size);

  // Create ridge noise generator
  const ridgeNoise = new SimplexNoise(prng.fork());

  // Generate base terrain
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const nx = x / width;
      const ny = y / height;

      if (landMask[idx] === 0) {
        // Ocean depth
        heightMap[idx] = fbm(noise, nx, ny, 3, baseNoiseFreq, 0.5) * seaLevel * 0.8;
        continue;
      }

      // Base land elevation
      let elev = fbm(noise, nx, ny, baseNoiseOctaves, baseNoiseFreq, baseNoisePersistence);
      
      // Ensure land is above sea level
      elev = seaLevel + elev * (1 - seaLevel) * 0.5;

      // Add mountain influence
      let mountainInfluence = 0;
      for (const range of mountainRanges) {
        const dist = distanceToPolyline(x, y, range.points);
        const normalizedDist = dist / range.width;
        
        if (normalizedDist < 1) {
          // Smooth falloff from mountain center
          const influence = Math.pow(1 - normalizedDist, 2);
          mountainInfluence = Math.max(mountainInfluence, influence * range.height);
        }
      }

      if (mountainInfluence > 0.1) {
        mountainMask[idx] = Math.min(255, Math.floor(mountainInfluence * 255));
        
        // Add ridge noise for mountain detail
        const ridge = ridgedFbm(ridgeNoise, nx, ny, ridgeNoiseOctaves, ridgeNoiseFreq, 0.5);
        elev += mountainInfluence * (0.7 + ridge * ridgeStrength);
      }

      heightMap[idx] = Math.min(1, elev);
    }
  }

  // Simple thermal erosion (smoothing steep slopes)
  for (let iter = 0; iter < erosionThermalIterations; iter++) {
    const tempMap = new Float32Array(heightMap);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (landMask[idx] === 0) continue;

        const h = heightMap[idx];
        let total = h;
        let count = 1;

        // Check neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nidx = (y + dy) * width + (x + dx);
            if (landMask[nidx] === 1) {
              const diff = h - heightMap[nidx];
              if (Math.abs(diff) > 0.1) {
                total += heightMap[nidx];
                count++;
              }
            }
          }
        }

        tempMap[idx] = total / count;
      }
    }

    for (let i = 0; i < size; i++) {
      heightMap[i] = heightMap[i] * 0.8 + tempMap[i] * 0.2;
    }
  }

  return { heightMap, mountainMask };
}
