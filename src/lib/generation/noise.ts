// ============================================================================
// Simplex Noise Implementation
// Based on Stefan Gustavson's implementation
// ============================================================================

import { PRNG } from './prng';

// Gradient vectors for 2D
const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

export class SimplexNoise {
  private perm: Uint8Array;
  private permMod8: Uint8Array;

  constructor(prng: PRNG) {
    // Build permutation table
    this.perm = new Uint8Array(512);
    this.permMod8 = new Uint8Array(512);

    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Shuffle using PRNG
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod8[i] = this.perm[i] % 8;
    }
  }

  private dot2(gx: number, gy: number, x: number, y: number): number {
    return gx * x + gy * y;
  }

  // 2D Simplex noise - returns value in range [-1, 1]
  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    // Skew input space
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // Unskew cell origin
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine which simplex we're in
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1; j1 = 0;
    } else {
      i1 = 0; j1 = 1;
    }

    // Offsets for other corners
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    // Hash coordinates
    const ii = i & 255;
    const jj = j & 255;

    // Calculate contributions from corners
    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.permMod8[ii + this.perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(GRAD2[gi0][0], GRAD2[gi0][1], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.permMod8[ii + i1 + this.perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(GRAD2[gi1][0], GRAD2[gi1][1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.permMod8[ii + 1 + this.perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(GRAD2[gi2][0], GRAD2[gi2][1], x2, y2);
    }

    // Scale to [-1, 1]
    return 70.0 * (n0 + n1 + n2);
  }

  // Normalized to [0, 1]
  noise2DNormalized(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) * 0.5;
  }
}

// Fractal Brownian Motion (fBm) - layered noise
export function fbm(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number,
  frequency: number,
  persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let maxValue = 0;
  let freq = frequency;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise.noise2DNormalized(x * freq, y * freq);
    maxValue += amplitude;
    amplitude *= persistence;
    freq *= 2;
  }

  return value / maxValue;
}

// Ridged multifractal noise - creates sharp ridges
export function ridgedFbm(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number,
  frequency: number,
  persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let maxValue = 0;
  let freq = frequency;
  let weight = 1;

  for (let i = 0; i < octaves; i++) {
    let n = noise.noise2DNormalized(x * freq, y * freq);
    // Create ridges by inverting
    n = 1 - Math.abs(n * 2 - 1);
    n = n * n * weight;
    weight = Math.min(1, Math.max(0, n * 2));
    
    value += amplitude * n;
    maxValue += amplitude;
    amplitude *= persistence;
    freq *= 2;
  }

  return value / maxValue;
}

// Domain warping for organic shapes
export function warpedNoise(
  noise: SimplexNoise,
  x: number,
  y: number,
  frequency: number,
  warpStrength: number
): number {
  const warpX = noise.noise2D(x * frequency, y * frequency) * warpStrength;
  const warpY = noise.noise2D(x * frequency + 5.2, y * frequency + 1.3) * warpStrength;
  return noise.noise2DNormalized((x + warpX) * frequency, (y + warpY) * frequency);
}
