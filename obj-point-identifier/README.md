# 3D Vertex Identifier

A web-based 3D model viewer that lets you click on vertices to see their index numbers.

## Features

- Load OBJ, STL, and FBX files
- Click on any vertex to select it
- See vertex numbers in real-time
- Rotate, zoom, and pan around models
- Adjust point size for better visibility
- Clear all selections with one click

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd obj-point-identifier

# Run development version
docker-compose --profile dev up

# Or run production version
docker-compose up
```

The app will be available at:
- Development: http://localhost:5173
- Production: http://localhost:4173

### Manual Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm run preview
```

## How to Use

1. **Load a Model**: Click "Choose File" and select an OBJ, STL, or FBX file
2. **Select Vertices**: Click on any point on the model to select it
3. **View Numbers**: Selected vertex numbers appear in the left panel
4. **Navigate**: Use mouse to rotate, zoom, and pan around the model
5. **Adjust Size**: Use the point size slider to make vertices easier to see
6. **Clear All**: Click "Clear All" to remove all selections

## File Support

- **OBJ**: Wavefront OBJ files with vertex data
- **STL**: STereoLithography files (ASCII and binary)
- **FBX**: Autodesk FBX files

## Deployment

### Static Hosting

After building, the `dist` folder contains all static files that can be deployed to any web server.

### Docker Production

```bash
docker-compose up
```

This runs the optimized production build on port 4173.

## Technology

- React + TypeScript
- Three.js for 3D rendering
- Vite for building
- Docker for deployment

## License

MIT