import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

// Helper function to determine file format from URL or filename
function getFileFormat(url: string, originalFilename?: string): 'obj' | 'stl' | 'fbx' | 'unknown' {
  // Use original filename if provided (for blob URLs)
  const sourceToCheck = originalFilename || url;
  const extension = sourceToCheck.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'obj': return 'obj';
    case 'stl': return 'stl';
    case 'fbx': return 'fbx';
    default: 
      // Default to obj for sample files or unknown extensions
      if (sourceToCheck.includes('smplx') || !extension) {
        return 'obj';
      }
      return 'unknown';
  }
}

// Custom hook for loading different 3D model formats
function use3DModelLoader(url: string, originalFilename?: string) {
  const format = getFileFormat(url, originalFilename);
  
  const displayName = originalFilename || url;
  console.log(`Loading ${format.toUpperCase()} file:`, displayName);
  
  // Use the appropriate loader based on file format
  switch (format) {
    case 'obj':
      return useLoader(OBJLoader, url);
    case 'stl':
      return useLoader(STLLoader, url);
    case 'fbx':
      return useLoader(FBXLoader, url);
    case 'unknown':
      console.warn(`Unknown file format for ${displayName}, defaulting to OBJ loader`);
      return useLoader(OBJLoader, url);
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}

interface SelectedVertex {
  index: number; // 0-based vertex index
  position: THREE.Vector3;
}

interface ModelMeshProps {
  url: string;
  originalFilename?: string;
  onVertexSelect: (vertex: SelectedVertex | null) => void;
  selectedVertices: SelectedVertex[];
  pointSize: number;
  onBoundingBoxReady?: (boundingBox: THREE.Box3) => void;
}

function ModelMesh({ url, originalFilename, onVertexSelect, selectedVertices, pointSize, onBoundingBoxReady }: ModelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer } = useThree();
  
  // Track mouse down position and movement to distinguish clicks from drags
  const mouseDownPos = useRef<{x: number, y: number} | null>(null);
  const isDragging = useRef(false);
  
  const model = use3DModelLoader(url, originalFilename);
  const fileFormat = getFileFormat(url, originalFilename);
  
  // Parse model file and create custom attribute mapping
  const [modelData, setModelData] = useState<{ vertices: THREE.Vector3[], faces: number[], boundingBox: THREE.Box3, center: THREE.Vector3 } | null>(null);
  
  React.useEffect(() => {
    if (!model) return;
    
    // Extract geometry data from loaded model
    const extractModelData = () => {
      const vertices: THREE.Vector3[] = [];
      const faces: number[] = [];
      
      if (fileFormat === 'obj') {
        // For OBJ files, parse the original text format for accurate vertex indexing
        fetch(url)
          .then(response => response.text())
          .then(objText => {
            const lines = objText.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('v ')) {
                // Parse vertex
                const parts = line.split(/\s+/);
                if (parts.length >= 4) {
                  const x = parseFloat(parts[1]);
                  const y = parseFloat(parts[2]);
                  const z = parseFloat(parts[3]);
                  vertices.push(new THREE.Vector3(x, y, z));
                }
              } else if (line.startsWith('f ')) {
                // Parse face (convert to 0-based indices)
                const parts = line.split(/\s+/).slice(1); // Remove 'f'
                const faceVertices: number[] = [];
                
                for (const part of parts) {
                  const vertexIndex = parseInt(part.split('/')[0]) - 1; // Convert to 0-based
                  faceVertices.push(vertexIndex);
                }
                
                // Triangulate the face (assuming it's at least a triangle)
                for (let i = 1; i < faceVertices.length - 1; i++) {
                  faces.push(faceVertices[0]);
                  faces.push(faceVertices[i]);
                  faces.push(faceVertices[i + 1]);
                }
              }
            }
            
            processModelData(vertices, faces);
          })
          .catch(error => {
            console.error('Failed to parse OBJ file:', error);
          });
      } else {
        // For STL/FBX files, extract from Three.js geometry
        let firstMesh: THREE.Mesh | null = null;
        
        if (model instanceof THREE.Group) {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && !firstMesh) {
              firstMesh = child;
            }
          });
        } else if (model instanceof THREE.Mesh) {
          firstMesh = model;
        } else if (model instanceof THREE.BufferGeometry) {
          // STL loader returns geometry directly
          const tempMesh = new THREE.Mesh(model);
          firstMesh = tempMesh;
        }
        
        if (firstMesh && firstMesh.geometry) {
          const geometry = firstMesh.geometry;
          const positionAttribute = geometry.attributes.position;
          
          // Extract vertices from geometry
          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            vertices.push(new THREE.Vector3(x, y, z));
          }
          
          // Generate faces (every 3 vertices form a triangle)
          for (let i = 0; i < vertices.length; i += 3) {
            if (i + 2 < vertices.length) {
              faces.push(i, i + 1, i + 2);
            }
          }
        }
        
        processModelData(vertices, faces);
      }
    };
    
    const processModelData = (vertices: THREE.Vector3[], faces: number[]) => {
      // Calculate bounding box and center
      const boundingBox = new THREE.Box3();
      for (const vertex of vertices) {
        boundingBox.expandByPoint(vertex);
      }
      
      const center = boundingBox.getCenter(new THREE.Vector3());
      
      console.log(`Parsed ${fileFormat.toUpperCase()}: ${vertices.length} vertices, ${faces.length / 3} triangles`);
      console.log('Bounding box:', boundingBox);
      console.log('Center:', center);
      
      setModelData({ vertices, faces, boundingBox, center });
      
      // Notify parent component about bounding box
      onBoundingBoxReady?.(boundingBox);
    };
    
    extractModelData();
  }, [url, model, fileFormat, onBoundingBoxReady]);
  
  // Create mesh with custom attribute containing original vertex indices
  const mainMesh = React.useMemo(() => {
    if (!modelData) {
      console.log('Model data not ready yet');
      return null;
    }
    
    let firstMesh: THREE.Mesh | null = null;
    
    // Handle different model types
    if (model instanceof THREE.Group) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && !firstMesh) {
          firstMesh = child;
        }
      });
    } else if (model instanceof THREE.Mesh) {
      firstMesh = model;
    } else if (model instanceof THREE.BufferGeometry) {
      // STL loader returns geometry directly
      firstMesh = new THREE.Mesh(model);
    }
    
    if (!firstMesh) {
      console.log('No mesh found in loaded model');
      return null;
    }
    
    console.log('Found mesh, adding custom attribute');
    
    let geometry = firstMesh.geometry.clone() as THREE.BufferGeometry;
    
    // Make geometry non-indexed if it's indexed
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }
    
    // Create custom attribute for original vertex indices
    const positionAttribute = geometry.attributes.position;
    const vertexCount = positionAttribute.count;
    const originalIndices = new Float32Array(vertexCount);
    
    // Map geometry vertices to original vertex indices using our parsed face data
    for (let i = 0; i < vertexCount; i++) {
      const triangleIndex = Math.floor(i / 3);
      const vertexInTriangle = i % 3;
      
      if (triangleIndex < modelData.faces.length / 3) {
        const faceStartIndex = triangleIndex * 3;
        const originalVertexIndex = modelData.faces[faceStartIndex + vertexInTriangle];
        originalIndices[i] = originalVertexIndex;
        
        // Debug first few mappings
        if (i < 9) {
          console.log(`Geometry vertex ${i} -> Original vertex ${originalVertexIndex}`);
        }
      }
    }
    
    // Add the custom attribute to geometry
    geometry.setAttribute('originalIndex', new THREE.BufferAttribute(originalIndices, 1));
    
    console.log(`Added originalIndex attribute with ${vertexCount} vertices`);
    
    // Create new mesh with modified geometry
    const newMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ 
        color: 0xcccccc, 
        transparent: true, 
        opacity: 0.9 
      })
    );
    
    // Center the mesh at origin
    if (modelData.center) {
      newMesh.position.set(-modelData.center.x, -modelData.center.y, -modelData.center.z);
    }
    
    return newMesh;
  }, [model, modelData]);
  

  // Handle mouse down to start tracking potential drag
  const handleMouseDown = useCallback((event: ThreeEvent<MouseEvent>) => {
    mouseDownPos.current = { x: event.clientX, y: event.clientY };
    isDragging.current = false;
    console.log('🖱️  Mouse down at:', mouseDownPos.current);
  }, []);

  // Handle mouse move to detect dragging
  const handleMouseMove = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (mouseDownPos.current) {
      const deltaX = Math.abs(event.clientX - mouseDownPos.current.x);
      const deltaY = Math.abs(event.clientY - mouseDownPos.current.y);
      const dragThreshold = 5; // pixels
      
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        isDragging.current = true;
        console.log('🖱️  Dragging detected, delta:', { deltaX, deltaY });
      }
    }
  }, []);

  // Handle vertex selection - only if not dragging
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    
    // Check if this was a drag operation
    if (isDragging.current) {
      console.log('🖱️  Click ignored - was dragging');
      mouseDownPos.current = null;
      isDragging.current = false;
      return;
    }
    
    console.log('🖱️  Click event fired!', { 
      mainMesh: !!mainMesh, 
      modelData: !!modelData,
      meshRefCurrent: !!meshRef.current,
      eventType: event.type,
      pointer: pointer.toArray()
    });
    
    if (!meshRef.current || !mainMesh) {
      console.log('❌ Missing refs:', { meshRef: !!meshRef.current, mainMesh: !!mainMesh });
      return;
    }
    
    raycaster.setFromCamera(pointer, camera);
    
    // Raycast against the merged mesh
    const intersects = raycaster.intersectObject(meshRef.current, false);
    console.log('🎯 Raycast results:', { intersectCount: intersects.length });
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const faceIndex = intersect.faceIndex;
      
      if (faceIndex !== undefined && faceIndex !== null) {
        const clickGeometry = (mainMesh as any).geometry as THREE.BufferGeometry;
        const positionAttribute = clickGeometry.attributes.position;
        const indexAttribute = clickGeometry.index;
        
        // Get the three vertices of the intersected face
        let faceVertexIndices: number[] = [];
        if (indexAttribute) {
          // Indexed geometry
          const idx1 = indexAttribute.getX(faceIndex * 3);
          const idx2 = indexAttribute.getX(faceIndex * 3 + 1);
          const idx3 = indexAttribute.getX(faceIndex * 3 + 2);
          faceVertexIndices = [idx1, idx2, idx3];
        } else {
          // Non-indexed geometry
          faceVertexIndices = [faceIndex * 3, faceIndex * 3 + 1, faceIndex * 3 + 2];
        }
        
        // Find the closest vertex to the click point
        let closestGeometryIndex = faceVertexIndices[0];
        let closestDistance = Infinity;
        let closestWorldPosition = new THREE.Vector3();
        
        for (const geometryIndex of faceVertexIndices) {
          if (geometryIndex >= 0 && geometryIndex < positionAttribute.count) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, geometryIndex);
            
            // Transform to world coordinates
            const worldVertex = vertex.clone();
            meshRef.current!.localToWorld(worldVertex);
            
            const distance = worldVertex.distanceTo(intersect.point);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestGeometryIndex = geometryIndex;
              closestWorldPosition = worldVertex;
            }
          }
        }
        
        // Get the original OBJ index from the custom attribute
        const originalIndexAttribute = clickGeometry.attributes.originalIndex;
        
        let realObjIndex = closestGeometryIndex; // fallback
        if (originalIndexAttribute) {
          realObjIndex = originalIndexAttribute.getX(closestGeometryIndex);
        }
        
        console.log(`Click: geometry index ${closestGeometryIndex} -> OBJ index ${realObjIndex}`);
        
        onVertexSelect({
          index: realObjIndex,
          position: closestWorldPosition
        });
      }
    }
    
    // Reset tracking
    mouseDownPos.current = null;
    isDragging.current = false;
  }, [camera, raycaster, pointer, onVertexSelect, mainMesh, modelData]);

  if (!mainMesh) {
    console.log('Mesh not ready:', { mainMesh: !!mainMesh, modelDataReady: !!modelData });
    return <group />; // Return empty group if mesh not ready
  }
  
  const geometry = (mainMesh as any).geometry as THREE.BufferGeometry;
  console.log('Rendering mesh with', geometry.attributes.position.count, 'vertices');
  console.log('Has originalIndex attribute:', !!geometry.attributes.originalIndex);

  return (
    <group>
      {/* Wireframe overlay - non-interactive, rendered first */}
      <mesh 
        geometry={(mainMesh as any).geometry} 
        position={(mainMesh as any).position}
        raycast={() => null}
      >
        <meshBasicMaterial color={0xffffff} wireframe={true} transparent={true} opacity={0.5} />
      </mesh>
      
      {/* Main mesh with click handler - using mesh instead of primitive */}
      <mesh 
        ref={meshRef}
        geometry={(mainMesh as any).geometry}
        position={(mainMesh as any).position}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onClick={handleClick}
      >
        <meshLambertMaterial 
          color={0xcccccc} 
          transparent={true} 
          opacity={0.9} 
        />
      </mesh>
      
      {/* Render selected vertices as highlighted points */}
      {selectedVertices.map((vertex) => {
        // Validate and convert position
        const pos = vertex.position;
        if (!pos || isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
          console.warn('Invalid vertex position for rendering:', pos);
          return null;
        }
        
        const position = pos instanceof THREE.Vector3 ? 
          [pos.x, pos.y, pos.z] as [number, number, number] : 
          [0, 0, 0] as [number, number, number];
        
        // Use position-based key to avoid duplicate spheres at same location
        const posKey = `${pos.x.toFixed(6)}-${pos.y.toFixed(6)}-${pos.z.toFixed(6)}`;
        
        return (
          <mesh key={`vertex-${posKey}`} position={position}>
            <sphereGeometry args={[pointSize, 12, 12]} />
            <meshBasicMaterial color="red" />
          </mesh>
        );
      })}
    </group>
  );
}

// Component to handle automatic camera positioning
function AutoCameraPosition({ boundingBox, fileFormat }: { boundingBox: THREE.Box3 | null, fileFormat?: string }) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as any;
  const [lastBoundingBox, setLastBoundingBox] = React.useState<THREE.Box3 | null>(null);
  
  // Position camera immediately when boundingBox is available, with or without controls
  React.useEffect(() => {
    const timestamp = Date.now();
    console.log(`🔄 [${timestamp}] AutoCameraPosition triggered:`, { boundingBox: !!boundingBox, controls: !!controls });
    if (!boundingBox) {
      console.log('⏳ No boundingBox yet...');
      return;
    }
    
    // Check if this is the same bounding box to prevent duplicate positioning
    if (lastBoundingBox && 
        lastBoundingBox.min.equals(boundingBox.min) && 
        lastBoundingBox.max.equals(boundingBox.max)) {
      console.log(`🚫 [${timestamp}] Same bounding box, skipping positioning...`);
      return;
    }
    
    const format = fileFormat?.toLowerCase();
    console.log(`📐 [${timestamp}] Starting camera positioning for format:`, format);
    
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Since we recenter the mesh at origin, use origin for camera target
    const center = new THREE.Vector3(0, 0, 0);
    
    // Calculate optimal camera distance with adaptive multiplier
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 50;
    const baseDist = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    
    // Use unified center-based positioning for all formats
    const multiplier = 1.2;
    
    const distance = baseDist * multiplier;
    
    // Position camera at a nice angle relative to the model center
    const cameraPosition = new THREE.Vector3(
      center.x + distance, 
      center.y + distance, 
      center.z + distance
    );
    
    camera.position.copy(cameraPosition);
    camera.lookAt(center);
    
    // Update camera and controls
    camera.updateProjectionMatrix();
    
    if (controls) {
      controls.target.copy(center);
      controls.update();
      console.log('🎯 Updated controls target and refreshed');
    } else {
      console.log('⚠️ Controls not available');
    }
    
    console.log(`📷 [${timestamp}] Auto-positioned camera:`, {
      fileFormat: format || 'unknown',
      objectSize: size,
      center: center.toArray(),
      maxDim,
      multiplier,
      distance,
      cameraPosition: cameraPosition.toArray()
    });
    
    // Remember this bounding box to prevent duplicate positioning
    setLastBoundingBox(boundingBox.clone());
    
  }, [boundingBox, camera, controls]);
  
  // Force reset when boundingBox is null (new model loading)
  React.useEffect(() => {
    if (boundingBox === null) {
      // Reset state for new model
      setLastBoundingBox(null);
      
      if (controls) {
        // Reset to default position while waiting for new model
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);
        
        // Reset OrbitControls internal state
        if ('target' in controls) {
          (controls as any).target.set(0, 0, 0);
        }
      }
      
      // Reset zoom/distance state if available
      if (controls && 'object' in controls && 'position' in (controls as any).object) {
        // For OrbitControls, we need to reset the distance calculation
        const controlsAny = controls as any;
        if ('getDistance' in controlsAny) {
          // Calculate the distance from current camera position to target
          const distance = camera.position.distanceTo((controlsAny).target);
          console.log('Current OrbitControls distance:', distance);
        }
      }
      
      // Force a complete reset
      if (controls && 'reset' in controls) {
        (controls as any).reset();
      }
      
      // Re-apply our desired position after reset
      camera.position.set(2, 2, 2);
      camera.lookAt(0, 0, 0);
      
      camera.updateProjectionMatrix();
      if (controls && 'update' in controls) {
        (controls as any).update();
      }
      console.log('Reset camera and controls for new model loading');
    }
  }, [boundingBox, camera, controls]);
  
  return null;
}

interface OBJViewerProps {
  objUrl: string;
  originalFilename?: string;
  selectedVertices?: SelectedVertex[];
  onSelectedVerticesChange?: (vertices: SelectedVertex[]) => void;
  pointSize?: number;
}

export default function OBJViewer({ objUrl, originalFilename, selectedVertices: externalSelectedVertices = [], onSelectedVerticesChange, pointSize = 0.01 }: OBJViewerProps) {
  const [selectedVertices, setSelectedVertices] = useState<SelectedVertex[]>([]);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  
  // Reset bounding box when URL changes to trigger camera repositioning
  React.useEffect(() => {
    setBoundingBox(null);
  }, [objUrl]);
  
  // Sync internal state with external state
  React.useEffect(() => {
    setSelectedVertices(externalSelectedVertices);
  }, [externalSelectedVertices]);
  
  const handleBoundingBoxReady = useCallback((box: THREE.Box3) => {
    setBoundingBox(box);
  }, []);
  
  const handleVertexSelect = useCallback((vertex: SelectedVertex | null) => {
    if (vertex) {
      setSelectedVertices(prev => {
        // Check if vertex is already selected by position similarity (not just index)
        // Since the same 3D point might have different indices in merged geometry
        const POSITION_TOLERANCE = 0.0001;
        const existingVertex = prev.find(v => {
          const posDiff = v.position.distanceTo(vertex.position);
          return posDiff < POSITION_TOLERANCE;
        });
        
        let newVertices: SelectedVertex[];
        
        if (existingVertex) {
          // Remove if already selected (deselect by position)
          newVertices = prev.filter(v => {
            const posDiff = v.position.distanceTo(vertex.position);
            return posDiff >= POSITION_TOLERANCE;
          });
          console.log(`Deselected vertex at position:`, vertex.position);
        } else {
          // Add new selection only if not already present
          newVertices = [...prev, vertex];
          console.log(`Selected vertex ${vertex.index} at position:`, vertex.position);
        }
        
        // Schedule parent notification for next tick to avoid setState during render
        setTimeout(() => {
          onSelectedVerticesChange?.(newVertices);
        }, 0);
        
        return newVertices;
      });
    }
  }, [onSelectedVerticesChange]);

  // Clear selection function removed as it's not used in current UI

  return (
    <div className="viewer-container" style={{ width: '100%', height: '100%' }}>
      <Canvas
        key={objUrl} // Force Canvas recreation when URL changes
        camera={{ position: [2, 2, 2], fov: 60 }}
        style={{ background: '#f0f0f0', width: '100%', height: '100%' }}
        onPointerDown={(e) => console.log('📱 Canvas pointer down', e)}
        onClick={(e) => console.log('📱 Canvas click', e)}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls 
          key={objUrl} // Force recreation when URL changes
          makeDefault
          enablePan 
          enableZoom 
          enableRotate 
        />
        <AutoCameraPosition 
          boundingBox={boundingBox} 
          fileFormat={getFileFormat(objUrl, originalFilename)}
        />
        <ModelMesh 
          url={objUrl} 
          originalFilename={originalFilename}
          onVertexSelect={handleVertexSelect}
          selectedVertices={selectedVertices}
          pointSize={pointSize}
          onBoundingBoxReady={handleBoundingBoxReady}
        />
      </Canvas>
    </div>
  );
}