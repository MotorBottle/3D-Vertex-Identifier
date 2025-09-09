import React, { useState } from 'react'
import OBJViewer from './components/OBJViewer'
import './App.css'

interface SelectedVertex {
  index: number;
  position: THREE.Vector3;
}

// Import THREE for Vector3 type
import * as THREE from 'three'

function App() {
  const [objFile, setObjFile] = useState<string>('smplx_0060.obj')
  const [originalFilename, setOriginalFilename] = useState<string>('smplx_0060.obj')
  const [selectedVertices, setSelectedVertices] = useState<SelectedVertex[]>([])
  const [pointSize, setPointSize] = useState<number>(0.01)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setObjFile(url)
      setOriginalFilename(file.name)
      // Clear all selected vertices when loading a new model
      setSelectedVertices([])
    }
  }

  const handleClearAll = () => {
    setSelectedVertices([])
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, display: 'flex' }}>
      {/* Left Sidebar */}
      <div style={{
        width: '320px',
        height: '100vh',
        background: 'white',
        borderRight: '1px solid #ddd',
        padding: '20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        flexShrink: 0
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>3D Vertex Identifier</h2>
        
        {/* Selected Points Display */}
        {selectedVertices.length > 0 && (
          <div style={{
            padding: '12px',
            background: '#f0f8ff',
            border: '2px solid #4a90e2',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#4a90e2', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              已选择顶点 Selected Points ({selectedVertices.length}):
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#d32f2f',
              lineHeight: '1.4',
              wordBreak: 'break-all',
              marginBottom: '10px'
            }}>
              {selectedVertices.map((v, idx) => `V${idx + 1}(${v.index})`).join(', ')}
            </div>
            <button
              onClick={handleClearAll}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#d32f2f'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f44336'}
            >
              Clear All
            </button>
          </div>
        )}
        
        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: '#333', 
            display: 'block', 
            marginBottom: '8px' 
          }}>
            Load 3D Model:
          </label>
          <input
            type="file"
            accept=".obj,.stl,.fbx"
            onChange={handleFileUpload}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
            Supports: OBJ, STL, FBX files<br/>
            Current: {objFile.includes('smplx') ? 'Sample file' : 'Custom file'}
          </p>
        </div>
        
        {/* Point Size Slider */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: '#333', 
            display: 'block', 
            marginBottom: '8px' 
          }}>
            Point Size: {pointSize.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.0005"
            max="0.01"
            step="0.0005"
            value={pointSize}
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '8px' }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '11px', 
            color: '#999' 
          }}>
            <span>Small (0.0005)</span>
            <span>Large (0.01)</span>
          </div>
        </div>
        
        {/* Instructions */}
        <div style={{
          padding: '12px',
          background: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#666'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Instructions:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>Click on mesh vertices to select them</li>
            <li>Click again to deselect</li>
            <li>Use mouse to rotate, zoom, and pan</li>
            <li>Selected vertex numbers appear above</li>
          </ul>
        </div>
        
        {/* Author Info */}
        <div style={{
          padding: '12px',
          background: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#888',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px', fontWeight: 'bold', color: '#666' }}>
            3D Vertex Identifier
          </div>
          <div style={{ marginBottom: '4px' }}>
            Built with React + Three.js
          </div>
          <div>
            Developed by MotorBottle & Claude Code
          </div>
        </div>
      </div>
      
      {/* Main 3D Viewer */}
      <div style={{ flex: 1, height: '100vh' }}>
        <OBJViewer 
          objUrl={objFile}
          originalFilename={originalFilename}
          selectedVertices={selectedVertices}
          onSelectedVerticesChange={setSelectedVertices}
          pointSize={pointSize}
        />
      </div>
    </div>
  )
}

export default App
