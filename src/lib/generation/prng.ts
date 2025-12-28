// ============================================================================
// Deterministic Pseudorandom Number Generator
// Uses mulberry32 algorithm for reproducibility from seed
// ============================================================================

export class PRNG {
  private state: number;

  constructor(seed: string | number) {
    // Convert string seed to number using hash
    if (typeof seed === 'string') {
      this.state = this.hashString(seed);
    } else {
      this.state = seed;
    }
    // Ensure non-zero seed
    if (this.state === 0) this.state = 1;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) || 1;
  }

  // Mulberry32 PRNG - fast, simple, good distribution
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Random float in range [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Random integer in range [min, max]
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Random boolean with given probability
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  // Pick random element from array
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  // Shuffle array in place
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Generate Gaussian (normal) distributed random number
  gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Create a new PRNG with derived seed
  fork(): PRNG {
    return new PRNG(Math.floor(this.next() * 2147483647));
  }
}
