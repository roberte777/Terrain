# Fantasy World Map Generator

A procedural 2D fantasy world map generator built with TypeScript and React (Next.js). Generate unique fantasy worlds with continents, mountains, rivers, biomes, forests, cities, and roads - all configurable in real-time.

![Fantasy Map Generator](https://via.placeholder.com/800x400?text=Fantasy+World+Map+Generator)

## Features

### World Generation
- **Procedural Continents**: Random number of continents with configurable spacing and size
- **Mountains**: Structured mountain ranges with ridged noise for realistic peaks
- **Rivers & Lakes**: Flow simulation with accumulation-based river generation
- **Climate System**: Temperature based on latitude and elevation, moisture from water proximity
- **Biomes**: 12 distinct biome types classified from temperature and moisture
- **Forests**: Biome-aware vegetation with moisture influence
- **Cities**: Smart placement based on terrain suitability (coast, rivers, flatness)
- **Roads**: A* pathfinding between cities with terrain-aware costs

### User Interface
- **Real-time Preview**: See changes as you adjust parameters
- **Multiple Views**: Biome, Elevation, Moisture, Political, and Debug modes
- **Collapsible Controls**: Organized settings grouped by system
- **Presets**: Quick-start configurations (Earth-like, Archipelago, Pangea, etc.)
- **Export**: Save maps as PNG or export settings as JSON
- **Deterministic Seeds**: Reproducible generation from seed strings

### Render Modes
- **Biome View**: Full-color biome display with terrain shading
- **Elevation View**: Height-based gradient from ocean depths to mountain peaks
- **Moisture View**: Humidity levels across the map
- **Political View**: Desaturated biomes with city labels
- **Debug View**: Continent IDs and mountain masks for debugging

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fantasy-map-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the map generator.

### Production Build

```bash
npm run build
npm start
```

## Usage

### Basic Controls

1. **Seed**: Enter any text to generate a specific world, or click "Random Seed" for a new random world
2. **Regenerate**: Manually trigger regeneration (useful when auto-regenerate is off)
3. **Presets**: Load pre-configured settings for different world types

### Settings Categories

| Category | Description |
|----------|-------------|
| **World & Seed** | Map dimensions, seed, and sea level |
| **Continents** | Number, size, and coastline noise |
| **Elevation** | Base terrain noise and mountain ranges |
| **Hydrology** | Rivers, lakes, and rainfall |
| **Climate** | Temperature and moisture distribution |
| **Biomes** | Threshold settings for biome classification |
| **Forests** | Vegetation density and distribution |
| **Cities** | City count, spacing, and placement preferences |
| **Roads** | Road network generation settings |
| **Rendering** | View mode and overlay toggles |
| **Performance** | Auto-regeneration and debounce settings |

### Keyboard Shortcuts

Currently, all controls are mouse-based through the UI.

## Architecture

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── MapCanvas.tsx      # Canvas rendering
│   ├── MapGenerator.tsx   # Main app component
│   ├── Sidebar.tsx        # Settings controls
│   ├── TopBar.tsx         # Header with actions
│   └── controls/          # Reusable control components
├── hooks/
│   └── useMapGenerator.ts # State management hook
├── lib/
│   ├── types.ts           # TypeScript types and defaults
│   ├── generation/        # World generation algorithms
│   │   ├── index.ts       # Main generation pipeline
│   │   ├── prng.ts        # Deterministic random number generator
│   │   ├── noise.ts       # Simplex noise implementation
│   │   ├── continents.ts  # Continent generation
│   │   ├── elevation.ts   # Height map and mountains
│   │   ├── hydrology.ts   # Rivers and lakes
│   │   ├── climate.ts     # Temperature and moisture
│   │   ├── biomes.ts      # Biome classification
│   │   ├── forests.ts     # Vegetation generation
│   │   └── cities.ts      # City placement and roads
│   └── rendering/         # Canvas rendering
│       ├── colors.ts      # Color palettes
│       └── renderer.ts    # Main renderer
└── workers/
    └── mapWorker.ts       # Web worker for background generation
```

## Generation Pipeline

The world is generated in sequential steps:

1. **Initialize PRNG** - Create deterministic random generator from seed
2. **Generate Continents** - Place continent seeds and create landmass masks
3. **Build Elevation** - Apply noise and mountain ranges
4. **Simulate Hydrology** - Calculate flow direction, accumulation, and rivers
5. **Calculate Climate** - Determine temperature and moisture
6. **Classify Biomes** - Assign biome types to each cell
7. **Grow Forests** - Add vegetation based on biome and moisture
8. **Found Cities** - Place cities based on suitability
9. **Build Roads** - Connect cities with A* pathfinding

## Biomes

| Biome | Description |
|-------|-------------|
| Ocean | Deep water bodies |
| Beach | Coastal sandy areas |
| Lake | Inland water bodies |
| Snow | Frozen high-altitude or polar regions |
| Tundra | Cold, treeless plains |
| Taiga | Cold coniferous forests |
| Grassland | Temperate prairies |
| Temperate Forest | Deciduous woodlands |
| Rainforest | Hot, wet tropical forests |
| Desert | Hot, arid regions |
| Savanna | Hot grasslands with sparse trees |
| Mountain Rock | High-altitude rocky terrain |

## Customization

### Adding New Presets

Edit `src/lib/types.ts` and add to the `PRESETS` array:

```typescript
{
  name: 'My Preset',
  description: 'Description of the preset',
  settings: {
    // Partial settings to override defaults
  },
}
```

### Modifying Biome Colors

Edit `src/lib/types.ts` - the `BiomeInfo` object contains colors for each biome:

```typescript
[Biome.Grassland]: { name: 'Grassland', color: '#82e0aa' },
```

## Performance Notes

- Default map size (512×384) generates in ~1-2 seconds
- Larger maps (1024×768+) may take several seconds
- Auto-regenerate has a configurable debounce (default 300ms)
- Roads are the most expensive feature - disable for faster generation

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rendering**: HTML5 Canvas 2D
- **State**: React hooks with custom useMapGenerator

## License

MIT License - feel free to use this for any purpose.

## Contributing

Contributions are welcome! Some ideas for improvements:

- [ ] WebGL rendering for larger maps
- [ ] Web Worker for background generation
- [ ] Region/kingdom generation with borders
- [ ] Named locations and lore generation
- [ ] Map zoom and pan controls
- [ ] Undo/redo for settings changes
- [ ] More biome types and transitions
- [ ] Custom color themes
- [ ] SVG export for print quality

## Acknowledgments

- Simplex noise based on Stefan Gustavson's implementation
- Inspired by various procedural terrain generation techniques
