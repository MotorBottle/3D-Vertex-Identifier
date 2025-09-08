import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OBJViewer from '../OBJViewer'

// Mock Three.js dependencies
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useLoader: vi.fn().mockReturnValue({
    traverse: vi.fn(),
    clone: vi.fn().mockReturnValue({
      traverse: vi.fn()
    })
  }),
  useThree: vi.fn().mockReturnValue({
    camera: {},
    raycaster: { setFromCamera: vi.fn(), intersectObject: vi.fn().mockReturnValue([]) },
    pointer: {}
  })
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />
}))

vi.mock('three/examples/jsm/loaders/OBJLoader.js', () => ({
  OBJLoader: vi.fn()
}))

describe('OBJViewer', () => {
  it('renders the viewer interface', () => {
    render(<OBJViewer objUrl="/test.obj" />)
    
    expect(screen.getByText('Selected Vertices')).toBeInTheDocument()
    expect(screen.getByText('Clear Selection')).toBeInTheDocument()
    expect(screen.getByText('Click on vertices to select them')).toBeInTheDocument()
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('displays clear selection button', () => {
    render(<OBJViewer objUrl="/test.obj" />)
    
    const clearButton = screen.getByRole('button', { name: 'Clear Selection' })
    expect(clearButton).toBeInTheDocument()
  })
})