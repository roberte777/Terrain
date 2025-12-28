// ============================================================================
// Hydrology System
// Rivers, lakes, and water flow simulation
// ============================================================================

import { Settings } from '../types';

// Direction vectors for 8-way movement
const DX = [0, 1, 1, 1, 0, -1, -1, -1];
const DY = [-1, -1, 0, 1, 1, 1, 0, -1];

// Calculate flow direction for each cell (steepest descent)
export function calculateFlowDirection(
  heightMap: Float32Array,
  landMask: Uint8Array,
  width: number,
  height: number
): Int8Array {
  const size = width * height;
  const flowDir = new Int8Array(size).fill(-1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (landMask[idx] === 0) continue; // Skip water

      const currentHeight = heightMap[idx];
      let steepestDir = -1;
      let steepestSlope = 0;

      // Check all 8 neighbors
      for (let d = 0; d < 8; d++) {
        const nx = x + DX[d];
        const ny = y + DY[d];

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const nidx = ny * width + nx;
        const neighborHeight = heightMap[nidx];
        const dist = (d % 2 === 0) ? 1 : Math.SQRT2; // Diagonal distance
        const slope = (currentHeight - neighborHeight) / dist;

        if (slope > steepestSlope) {
          steepestSlope = slope;
          steepestDir = d;
        }
      }

      flowDir[idx] = steepestDir;
    }
  }

  return flowDir;
}

// Calculate flow accumulation (how much water flows through each cell)
export function calculateFlowAccumulation(
  flowDir: Int8Array,
  landMask: Uint8Array,
  width: number,
  height: number
): Float32Array {
  const size = width * height;
  const flowAccum = new Float32Array(size).fill(1); // Each cell starts with 1 unit
  
  // Build dependency graph
  const inDegree = new Uint16Array(size);
  
  for (let i = 0; i < size; i++) {
    if (landMask[i] === 0) continue;
    
    const dir = flowDir[i];
    if (dir >= 0) {
      const x = i % width;
      const y = Math.floor(i / width);
      const nx = x + DX[dir];
      const ny = y + DY[dir];
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        inDegree[ny * width + nx]++;
      }
    }
  }

  // Topological sort using queue
  const queue: number[] = [];
  
  // Find all source cells (no incoming flow)
  for (let i = 0; i < size; i++) {
    if (landMask[i] === 1 && inDegree[i] === 0) {
      queue.push(i);
    }
  }

  // Process in topological order
  while (queue.length > 0) {
    const idx = queue.shift()!;
    const dir = flowDir[idx];
    
    if (dir < 0) continue;

    const x = idx % width;
    const y = Math.floor(idx / width);
    const nx = x + DX[dir];
    const ny = y + DY[dir];

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const nidx = ny * width + nx;
      flowAccum[nidx] += flowAccum[idx];
      
      inDegree[nidx]--;
      if (inDegree[nidx] === 0 && landMask[nidx] === 1) {
        queue.push(nidx);
      }
    }
  }

  return flowAccum;
}

// Generate river mask based on flow accumulation threshold
export function generateRivers(
  flowAccum: Float32Array,
  flowDir: Int8Array,
  landMask: Uint8Array,
  heightMap: Float32Array,
  settings: Settings,
  width: number,
  height: number
): Uint8Array {
  const { riverMinAccum } = settings.hydrology;
  const size = width * height;
  const rivers = new Uint8Array(size);

  // Mark cells with high flow accumulation as rivers
  for (let i = 0; i < size; i++) {
    if (landMask[i] === 1 && flowAccum[i] >= riverMinAccum) {
      // River intensity based on accumulation (logarithmic scale)
      const intensity = Math.min(255, Math.floor(Math.log(flowAccum[i] / riverMinAccum + 1) * 50));
      rivers[i] = Math.max(1, intensity);
    }
  }

  return rivers;
}

// Simple lake detection (depressions)
export function detectLakes(
  heightMap: Float32Array,
  landMask: Uint8Array,
  flowDir: Int8Array,
  settings: Settings,
  width: number,
  height: number
): Uint8Array {
  const size = width * height;
  const lakeMask = new Uint8Array(size);

  if (!settings.hydrology.lakeFillEnabled) {
    return lakeMask;
  }

  // Find sinks (cells with no outflow on land)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      if (landMask[idx] === 0) continue;
      if (flowDir[idx] >= 0) continue; // Has outflow

      // This is a sink - mark as potential lake
      // Simple flood fill to create small lake
      const queue: number[] = [idx];
      const visited = new Set<number>();
      const lakeHeight = heightMap[idx];
      const maxLakeSize = 100;
      let lakeSize = 0;

      while (queue.length > 0 && lakeSize < maxLakeSize) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const cx = current % width;
        const cy = Math.floor(current / width);

        // Only add cells at similar or lower height
        if (heightMap[current] <= lakeHeight + 0.02) {
          lakeMask[current] = 1;
          lakeSize++;

          // Add neighbors
          for (let d = 0; d < 8; d++) {
            const nx = cx + DX[d];
            const ny = cy + DY[d];
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (landMask[nidx] === 1 && !visited.has(nidx)) {
                queue.push(nidx);
              }
            }
          }
        }
      }
    }
  }

  return lakeMask;
}

// Calculate distance to water (ocean, rivers, lakes)
export function calculateWaterDistance(
  landMask: Uint8Array,
  rivers: Uint8Array,
  lakeMask: Uint8Array,
  width: number,
  height: number
): Float32Array {
  const size = width * height;
  const distance = new Float32Array(size).fill(Infinity);

  // Multi-source BFS from all water cells
  const queue: { x: number; y: number; dist: number }[] = [];

  // Initialize with water cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (landMask[idx] === 0 || rivers[idx] > 0 || lakeMask[idx] === 1) {
        distance[idx] = 0;
        queue.push({ x, y, dist: 0 });
      }
    }
  }

  // BFS
  while (queue.length > 0) {
    const { x, y, dist } = queue.shift()!;
    const idx = y * width + x;

    if (dist > distance[idx]) continue;

    for (let d = 0; d < 8; d++) {
      const nx = x + DX[d];
      const ny = y + DY[d];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        const stepDist = (d % 2 === 0) ? 1 : Math.SQRT2;
        const newDist = dist + stepDist;

        if (newDist < distance[nidx]) {
          distance[nidx] = newDist;
          queue.push({ x: nx, y: ny, dist: newDist });
        }
      }
    }
  }

  // Normalize to 0-1 range
  let maxDist = 0;
  for (let i = 0; i < size; i++) {
    if (distance[i] < Infinity) {
      maxDist = Math.max(maxDist, distance[i]);
    }
  }

  if (maxDist > 0) {
    for (let i = 0; i < size; i++) {
      distance[i] = Math.min(1, distance[i] / maxDist);
    }
  }

  return distance;
}
