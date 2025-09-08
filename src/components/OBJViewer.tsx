import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

interface SelectedVertex {
  index: number;
  position: THREE.Vector3;
}

interface OBJMeshProps {
  url: string;
  onVertexSelect: (vertex: SelectedVertex | null) => void;
  selectedVertices: SelectedVertex[];
}

function OBJMesh({ url, onVertexSelect, selectedVertices }: OBJMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);
  const { camera, raycaster, pointer } = useThree();
  
  const obj = useLoader(OBJLoader, url);
  
  // Extract vertices from the loaded OBJ
  const vertices = React.useMemo(() => {
    const allVertices: THREE.Vector3[] = [];
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        const positionAttribute = geometry.attributes.position;
        
        for (let i = 0; i < positionAttribute.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positionAttribute, i);
          child.localToWorld(vertex);
          allVertices.push(vertex);
        }
      }
    });
    return allVertices;
  }, [obj]);

  // Handle vertex selection
  const handleClick = useCallback((event: THREE.Event) => {
    event.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    
    // Create points for raycasting
    const points: THREE.Vector3[] = [];
    vertices.forEach(vertex => points.push(vertex));
    
    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pointsMaterial = new THREE.PointsMaterial({ size: 0.01 });
    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    
    const intersects = raycaster.intersectObject(pointsMesh);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const index = intersect.index || 0;
      const vertex = vertices[index];
      
      if (vertex) {
        onVertexSelect({
          index: index,
          position: vertex
        });
      }
    }
  }, [vertices, camera, raycaster, pointer, onVertexSelect]);

  // Clone and modify the object
  const clonedObj = React.useMemo(() => {
    const cloned = obj.clone();
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Set material to show wireframe and make it selectable
        child.material = new THREE.MeshBasicMaterial({
          color: 0x888888,
          wireframe: false
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [obj]);

  return (
    <group ref={meshRef} onClick={handleClick}>
      <primitive object={clonedObj} />
      
      {/* Render selected vertices as highlighted points */}
      {selectedVertices.map((vertex, index) => (
        <mesh key={index} position={vertex.position}>
          <sphereGeometry args={[0.005, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </group>
  );
}

interface OBJViewerProps {
  objUrl: string;
}

export default function OBJViewer({ objUrl }: OBJViewerProps) {
  const [selectedVertices, setSelectedVertices] = useState<SelectedVertex[]>([]);
  
  const handleVertexSelect = useCallback((vertex: SelectedVertex | null) => {
    if (vertex) {
      setSelectedVertices(prev => {
        // Check if vertex is already selected
        const existingIndex = prev.findIndex(v => v.index === vertex.index);
        if (existingIndex >= 0) {
          // Remove if already selected
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          // Add new selection
          return [...prev, vertex];
        }
      });
    }
  }, []);

  const clearSelection = () => {
    setSelectedVertices([]);
  };

  return (
    <div className="viewer-container" style={{ width: '100%', height: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, height: '100%' }}>
        <Canvas
          camera={{ position: [2, 2, 2], fov: 60 }}
          style={{ background: '#f0f0f0' }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls enablePan enableZoom enableRotate />
          <OBJMesh 
            url={objUrl} 
            onVertexSelect={handleVertexSelect}
            selectedVertices={selectedVertices}
          />
        </Canvas>
      </div>
      
      {/* Vertex info panel */}
      <div style={{
        width: '300px',
        padding: '20px',
        background: 'white',
        borderLeft: '1px solid #ccc',
        overflow: 'auto'
      }}>
        <h3>Selected Vertices</h3>
        <button onClick={clearSelection} style={{
          marginBottom: '10px',
          padding: '5px 10px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}>
          Clear Selection
        </button>
        
        {selectedVertices.length === 0 ? (
          <p>Click on vertices to select them</p>
        ) : (
          <div>
            <p>Selected {selectedVertices.length} vertices:</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {selectedVertices.map((vertex, index) => (
                <li key={index} style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#f5f5f5',
                  borderRadius: '3px',
                  fontSize: '14px'
                }}>
                  <strong>Vertex #{vertex.index}</strong><br/>
                  X: {vertex.position.x.toFixed(4)}<br/>
                  Y: {vertex.position.y.toFixed(4)}<br/>
                  Z: {vertex.position.z.toFixed(4)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}