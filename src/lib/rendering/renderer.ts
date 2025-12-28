// ============================================================================
// Canvas Rendering System
// Renders world data to canvas with different view modes
// ============================================================================

import { WorldData, Settings, Biome, City, Road } from '../types';
import { BIOME_COLORS, getElevationColor, getGradientColor, MOISTURE_GRADIENT } from './colors';

// Render world to canvas context
export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  settings: Settings
): void {
  const { width, height } = world;
  const { view, showRivers, showCities, showForests, showContours, contourInterval } = settings.render;

  // Create image data for efficient pixel manipulation
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Render base layer based on view mode
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;

      let color = { r: 0, g: 0, b: 0 };

      switch (view) {
        case 'elevation':
          color = renderElevationPixel(world, idx);
          break;
        case 'biome':
          color = renderBiomePixel(world, idx);
          break;
        case 'hydrology':
          color = renderHydrologyPixel(world, idx);
          break;
        case 'political':
          color = renderPoliticalPixel(world, idx);
          break;
        case 'debug':
          color = renderDebugPixel(world, idx);
          break;
      }

      // Apply shading based on elevation for depth
      if (view !== 'elevation' && view !== 'debug') {
        const elev = world.heightMap[idx];
        const shade = 0.7 + elev * 0.3;
        color.r = Math.round(color.r * shade);
        color.g = Math.round(color.g * shade);
        color.b = Math.round(color.b * shade);
      }

      data[pixelIdx] = color.r;
      data[pixelIdx + 1] = color.g;
      data[pixelIdx + 2] = color.b;
      data[pixelIdx + 3] = 255;
    }
  }

  // Apply overlays
  if (showForests && view !== 'debug') {
    applyForestOverlay(data, world);
  }

  if (showRivers && view !== 'hydrology') {
    applyRiverOverlay(data, world);
  }

  if (showContours) {
    applyContourOverlay(data, world, width, height, contourInterval);
  }

  // Put image data to canvas
  ctx.putImageData(imageData, 0, 0);

  // Draw vector elements on top
  if (settings.roads.enabled && world.roads.length > 0) {
    drawRoads(ctx, world.roads);
  }

  if (showCities && world.cities.length > 0) {
    drawCities(ctx, world.cities, view === 'political');
  }
}

function renderElevationPixel(world: WorldData, idx: number): { r: number; g: number; b: number } {
  const elev = world.heightMap[idx];
  return getElevationColor(elev);
}

function renderBiomePixel(
  world: WorldData, 
  idx: number
): { r: number; g: number; b: number } {
  const biome = world.biome[idx] as Biome;
  return { ...BIOME_COLORS[biome] };
}

function renderHydrologyPixel(world: WorldData, idx: number): { r: number; g: number; b: number } {
  const isLand = world.landMask[idx] === 1;
  
  if (!isLand) {
    return { r: 30, g: 80, b: 140 }; // Ocean
  }

  // Show moisture
  const moisture = world.moisture[idx];
  return getGradientColor(moisture, MOISTURE_GRADIENT);
}

function renderPoliticalPixel(
  world: WorldData, 
  idx: number
): { r: number; g: number; b: number } {
  const biome = world.biome[idx] as Biome;
  const baseColor = BIOME_COLORS[biome];
  
  // Desaturate biome colors for political view
  const gray = (baseColor.r + baseColor.g + baseColor.b) / 3;
  return {
    r: Math.round(baseColor.r * 0.6 + gray * 0.4),
    g: Math.round(baseColor.g * 0.6 + gray * 0.4),
    b: Math.round(baseColor.b * 0.6 + gray * 0.4),
  };
}

function renderDebugPixel(world: WorldData, idx: number): { r: number; g: number; b: number } {
  // Show continent IDs with distinct colors
  const continentId = world.debug.continentId[idx];
  const mountainMask = world.debug.mountainMask[idx];
  
  if (world.landMask[idx] === 0) {
    return { r: 20, g: 40, b: 80 };
  }

  // Color by continent
  const hue = (continentId * 137.5) % 360; // Golden angle for good distribution
  const saturation = mountainMask > 0 ? 0.3 : 0.6;
  const lightness = 0.4 + (mountainMask / 255) * 0.4;

  return hslToRgb(hue / 360, saturation, lightness);
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function applyForestOverlay(
  data: Uint8ClampedArray,
  world: WorldData
): void {
  const forestColor = { r: 20, g: 60, b: 20 };

  for (let i = 0; i < world.forest.length; i++) {
    if (world.forest[i] > 0) {
      const alpha = (world.forest[i] / 255) * 0.4;
      const pixelIdx = i * 4;
      
      data[pixelIdx] = Math.round(data[pixelIdx] * (1 - alpha) + forestColor.r * alpha);
      data[pixelIdx + 1] = Math.round(data[pixelIdx + 1] * (1 - alpha) + forestColor.g * alpha);
      data[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * (1 - alpha) + forestColor.b * alpha);
    }
  }
}

function applyRiverOverlay(
  data: Uint8ClampedArray,
  world: WorldData
): void {
  const riverColor = { r: 60, g: 120, b: 200 };

  for (let i = 0; i < world.rivers.length; i++) {
    if (world.rivers[i] > 0) {
      const intensity = Math.min(1, world.rivers[i] / 100);
      const alpha = 0.5 + intensity * 0.5;
      const pixelIdx = i * 4;
      
      data[pixelIdx] = Math.round(data[pixelIdx] * (1 - alpha) + riverColor.r * alpha);
      data[pixelIdx + 1] = Math.round(data[pixelIdx + 1] * (1 - alpha) + riverColor.g * alpha);
      data[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * (1 - alpha) + riverColor.b * alpha);
    }
  }

  // Also highlight lakes
  for (let i = 0; i < world.debug.lakeMask.length; i++) {
    if (world.debug.lakeMask[i] > 0) {
      const pixelIdx = i * 4;
      data[pixelIdx] = 52;
      data[pixelIdx + 1] = 152;
      data[pixelIdx + 2] = 219;
    }
  }
}

function applyContourOverlay(
  data: Uint8ClampedArray,
  world: WorldData,
  width: number,
  height: number,
  interval: number
): void {
  const contourColor = { r: 80, g: 60, b: 40 };

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const elev = world.heightMap[idx];
      const contourLevel = Math.floor(elev / interval);

      // Check if crossing contour line
      let isContour = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nidx = (y + dy) * width + (x + dx);
          const nContourLevel = Math.floor(world.heightMap[nidx] / interval);
          if (nContourLevel !== contourLevel) {
            isContour = true;
            break;
          }
        }
        if (isContour) break;
      }

      if (isContour && world.landMask[idx] === 1) {
        const pixelIdx = idx * 4;
        const alpha = 0.3;
        data[pixelIdx] = Math.round(data[pixelIdx] * (1 - alpha) + contourColor.r * alpha);
        data[pixelIdx + 1] = Math.round(data[pixelIdx + 1] * (1 - alpha) + contourColor.g * alpha);
        data[pixelIdx + 2] = Math.round(data[pixelIdx + 2] * (1 - alpha) + contourColor.b * alpha);
      }
    }
  }
}

function drawRoads(ctx: CanvasRenderingContext2D, roads: Road[]): void {
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.7)';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const road of roads) {
    if (road.path.length < 2) continue;

    ctx.beginPath();
    ctx.moveTo(road.path[0].x, road.path[0].y);
    
    for (let i = 1; i < road.path.length; i++) {
      ctx.lineTo(road.path[i].x, road.path[i].y);
    }
    
    ctx.stroke();
  }
}

function drawCities(ctx: CanvasRenderingContext2D, cities: City[], showLabels: boolean): void {
  for (const city of cities) {
    const size = 2 + city.size * 4;
    
    // City marker
    ctx.beginPath();
    
    switch (city.type) {
      case 'capital':
        // Star shape for capital
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        drawStar(ctx, city.x, city.y, 5, size, size / 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'port':
        // Anchor shape for port (simplified as filled circle with ring)
        ctx.fillStyle = '#4169e1';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.arc(city.x, city.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'city':
        // Square for city
        ctx.fillStyle = '#dc143c';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.rect(city.x - size / 2, city.y - size / 2, size, size);
        ctx.fill();
        ctx.stroke();
        break;
      default:
        // Circle for town
        ctx.fillStyle = '#8b4513';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.arc(city.x, city.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // City name label
    if (showLabels) {
      ctx.font = city.type === 'capital' ? 'bold 10px sans-serif' : '9px sans-serif';
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.textAlign = 'center';
      ctx.strokeText(city.name, city.x, city.y - size - 2);
      ctx.fillText(city.name, city.x, city.y - size - 2);
    }
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D, 
  cx: number, 
  cy: number, 
  spikes: number, 
  outerRadius: number, 
  innerRadius: number
): void {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

// Export as PNG
export function exportAsPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Export world data as JSON
export function exportAsJson(world: WorldData, settings: Settings): string {
  // Convert typed arrays to regular arrays for JSON serialization
  const exportData = {
    settings,
    world: {
      width: world.width,
      height: world.height,
      cities: world.cities,
      roads: world.roads,
    },
  };

  return JSON.stringify(exportData, null, 2);
}
