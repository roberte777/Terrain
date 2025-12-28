// ============================================================================
// City Placement and Road Generation
// Places cities based on suitability scoring and connects them with roads
// ============================================================================

import { City, CityType, Road, Biome, Settings } from '../types';
import { PRNG } from './prng';

// City name generator
const NAME_PREFIXES = ['New', 'Old', 'East', 'West', 'North', 'South', 'Great', 'Little', 'Upper', 'Lower'];
const NAME_ROOTS = [
  'haven', 'port', 'ford', 'bridge', 'burg', 'ton', 'ville', 'dale', 'wood', 'field',
  'castle', 'keep', 'hold', 'watch', 'guard', 'stone', 'rock', 'cliff', 'hill', 'mount',
  'river', 'lake', 'bay', 'cove', 'shore', 'marsh', 'glen', 'vale', 'moor', 'heath',
];
const NAME_SUFFIXES = ['ia', 'heim', 'grad', 'opolis', 'minster', 'wick', 'worth', 'stead', ''];

function generateCityName(prng: PRNG): string {
  const usePrefix = prng.chance(0.2);
  const useSuffix = prng.chance(0.5);
  
  let name = '';
  
  if (usePrefix) {
    name += prng.pick(NAME_PREFIXES) + ' ';
  }
  
  const root = prng.pick(NAME_ROOTS);
  name += root.charAt(0).toUpperCase() + root.slice(1);
  
  if (useSuffix) {
    name += prng.pick(NAME_SUFFIXES);
  }
  
  return name;
}

// Biomes suitable for cities
const CITY_BIOMES = new Set([
  Biome.Beach,
  Biome.Grassland,
  Biome.TemperateForest,
  Biome.Savanna,
  Biome.Taiga,
]);

// Calculate slope at a point
function calculateSlope(
  heightMap: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) {
    return 1;
  }

  const idx = y * width + x;
  const h = heightMap[idx];
  
  let maxDiff = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nidx = (y + dy) * width + (x + dx);
      maxDiff = Math.max(maxDiff, Math.abs(heightMap[nidx] - h));
    }
  }

  return maxDiff;
}

// Check if cell is near coast
function isNearCoast(
  landMask: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 5
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (landMask[ny * width + nx] === 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function placeCities(
  heightMap: Float32Array,
  landMask: Uint8Array,
  biome: Uint8Array,
  rivers: Uint8Array,
  settings: Settings,
  width: number,
  height: number,
  prng: PRNG
): City[] {
  if (!settings.cities.enabled) {
    return [];
  }

  const { 
    count, 
    minSpacing, 
    coastPreference, 
    riverPreference, 
    flatPreference 
  } = settings.cities;

  const cities: City[] = [];
  const size = width * height;

  // Calculate suitability scores
  const scores = new Float32Array(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Must be on land
      if (landMask[idx] === 0) {
        scores[idx] = 0;
        continue;
      }

      // Must be in suitable biome
      const cellBiome = biome[idx] as Biome;
      if (!CITY_BIOMES.has(cellBiome)) {
        scores[idx] = 0;
        continue;
      }

      let score = 1;

      // Prefer flat terrain
      const slope = calculateSlope(heightMap, x, y, width, height);
      score += (1 - slope * 10) * flatPreference;

      // Prefer coastal areas (for ports)
      if (isNearCoast(landMask, x, y, width, height)) {
        score += coastPreference;
      }

      // Prefer river proximity
      if (rivers[idx] > 0) {
        score += riverPreference;
      } else {
        // Check nearby rivers
        let nearRiver = false;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (rivers[ny * width + nx] > 0) {
                nearRiver = true;
                break;
              }
            }
          }
          if (nearRiver) break;
        }
        if (nearRiver) {
          score += riverPreference * 0.5;
        }
      }

      // Add some randomness
      score += prng.next() * 0.5;

      scores[idx] = Math.max(0, score);
    }
  }

  // Place cities using weighted selection with spacing
  const placed = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Find best available location
    let bestIdx = -1;
    let bestScore = 0;

    // Sample random candidates
    const sampleCount = Math.min(1000, size);
    for (let s = 0; s < sampleCount; s++) {
      const idx = Math.floor(prng.next() * size);
      
      if (scores[idx] <= bestScore) continue;

      const x = idx % width;
      const y = Math.floor(idx / width);

      // Check spacing from existing cities
      let tooClose = false;
      for (const cityIdx of placed) {
        const cx = cityIdx % width;
        const cy = Math.floor(cityIdx / width);
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < minSpacing) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        bestIdx = idx;
        bestScore = scores[idx];
      }
    }

    if (bestIdx >= 0) {
      const x = bestIdx % width;
      const y = Math.floor(bestIdx / width);

      // Determine city type
      let type: CityType = 'town';
      const isCoastal = isNearCoast(landMask, x, y, width, height);
      const hasRiver = rivers[bestIdx] > 0;

      if (i === 0) {
        type = 'capital';
      } else if (isCoastal && hasRiver) {
        type = prng.chance(0.7) ? 'port' : 'city';
      } else if (isCoastal) {
        type = prng.chance(0.5) ? 'port' : 'city';
      } else if (bestScore > 3) {
        type = 'city';
      }

      cities.push({
        id: i,
        x,
        y,
        size: i === 0 ? 1 : prng.range(0.3, 0.9),
        type,
        name: generateCityName(prng),
      });

      placed.add(bestIdx);
      
      // Suppress nearby scores
      for (let dy = -minSpacing; dy <= minSpacing; dy++) {
        for (let dx = -minSpacing; dx <= minSpacing; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minSpacing) {
              scores[ny * width + nx] = 0;
            }
          }
        }
      }
    }
  }

  return cities;
}

// Simple A* pathfinding for roads
function findPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  heightMap: Float32Array,
  landMask: Uint8Array,
  forest: Uint8Array,
  settings: Settings,
  width: number,
  height: number
): { x: number; y: number }[] | null {
  const { costElevation, costWater, costForest, costMountain } = settings.roads;
  const { seaLevel } = settings.map;

  const heuristic = (x: number, y: number): number => {
    return Math.abs(x - to.x) + Math.abs(y - to.y);
  };

  const getCost = (x: number, y: number, px: number, py: number): number => {
    const idx = y * width + x;
    
    if (landMask[idx] === 0) {
      return costWater;
    }

    let cost = 1;
    
    // Elevation cost
    const elev = heightMap[idx];
    const prevElev = heightMap[py * width + px];
    cost += Math.abs(elev - prevElev) * costElevation * 10;

    // Mountain cost
    if (elev > seaLevel + 0.5) {
      cost += costMountain;
    }

    // Forest cost
    if (forest[idx] > 0) {
      cost += costForest * (forest[idx] / 255);
    }

    return cost;
  };

  // A* implementation
  const openSet = new Map<number, { x: number; y: number; g: number; f: number; parent: number | null }>();
  const closedSet = new Set<number>();

  const startIdx = from.y * width + from.x;
  const endIdx = to.y * width + to.x;

  openSet.set(startIdx, {
    x: from.x,
    y: from.y,
    g: 0,
    f: heuristic(from.x, from.y),
    parent: null,
  });

  const maxIterations = 10000;
  let iterations = 0;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f
    let currentIdx = -1;
    let lowestF = Infinity;
    for (const [idx, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentIdx = idx;
      }
    }

    if (currentIdx === endIdx) {
      // Reconstruct path by tracing parent pointers
      const path: { x: number; y: number }[] = [];
      const pathNodes = new Map<number, { x: number; y: number; parent: number | null }>();
      
      // Copy openSet to pathNodes for reconstruction
      for (const [idx, node] of openSet) {
        pathNodes.set(idx, node);
      }
      
      let traceIdx: number | null = currentIdx;
      while (traceIdx !== null) {
        const x = traceIdx % width;
        const y = Math.floor(traceIdx / width);
        path.unshift({ x, y });
        
        const node = pathNodes.get(traceIdx);
        traceIdx = node ? node.parent : null;
      }
      
      // Simplify path
      return simplifyPath(path);
    }

    const current = openSet.get(currentIdx)!;
    openSet.delete(currentIdx);
    closedSet.add(currentIdx);

    // Check neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = current.x + dx;
        const ny = current.y + dy;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const nidx = ny * width + nx;
        if (closedSet.has(nidx)) continue;

        const moveCost = getCost(nx, ny, current.x, current.y);
        const g = current.g + moveCost;

        const existing = openSet.get(nidx);
        if (existing && existing.g <= g) continue;

        openSet.set(nidx, {
          x: nx,
          y: ny,
          g,
          f: g + heuristic(nx, ny),
          parent: currentIdx,
        });
      }
    }
  }

  return null;
}

// Simplify path using Ramer-Douglas-Peucker algorithm
function simplifyPath(path: { x: number; y: number }[], epsilon: number = 2): { x: number; y: number }[] {
  if (path.length <= 2) return path;

  // Find point with maximum distance
  let maxDist = 0;
  let maxIdx = 0;

  const start = path[0];
  const end = path[path.length - 1];

  for (let i = 1; i < path.length - 1; i++) {
    const dist = perpendicularDistance(path[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(path.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(path.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) {
    return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  }

  return Math.abs(
    (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len
  );
}

export function generateRoads(
  cities: City[],
  heightMap: Float32Array,
  landMask: Uint8Array,
  forest: Uint8Array,
  settings: Settings,
  width: number,
  height: number
): Road[] {
  if (!settings.roads.enabled || cities.length < 2) {
    return [];
  }

  const { maxConnectionsPerCity } = settings.roads;
  const roads: Road[] = [];
  const connections = new Map<number, number>();

  // Sort city pairs by distance
  const pairs: { from: City; to: City; dist: number }[] = [];
  
  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const dist = Math.sqrt(
        (cities[i].x - cities[j].x) ** 2 + 
        (cities[i].y - cities[j].y) ** 2
      );
      pairs.push({ from: cities[i], to: cities[j], dist });
    }
  }

  pairs.sort((a, b) => a.dist - b.dist);

  // Connect cities preferring shorter distances
  for (const { from, to } of pairs) {
    const fromConns = connections.get(from.id) || 0;
    const toConns = connections.get(to.id) || 0;

    if (fromConns >= maxConnectionsPerCity || toConns >= maxConnectionsPerCity) {
      continue;
    }

    const path = findPath(from, to, heightMap, landMask, forest, settings, width, height);
    
    if (path) {
      roads.push({
        fromCityId: from.id,
        toCityId: to.id,
        path,
      });

      connections.set(from.id, fromConns + 1);
      connections.set(to.id, toConns + 1);
    }
  }

  return roads;
}
