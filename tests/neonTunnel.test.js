// tests/neonTunnel.test.js
import { createNeonTunnel } from '../src/neonTunnel.js';
import * as THREE from 'three';

describe('createNeonTunnel', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  it('adds a group with many tube meshes to the scene', () => {
    const { tunnelGroup } = createNeonTunnel(scene);

    const tubes = [];
    tunnelGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.TubeGeometry) {
        tubes.push(obj);
      }
    });

    expect(tubes.length).toBeGreaterThan(50);
  });

  it('adds floor glow lines at correct height', () => {
    const { tunnelGroup } = createNeonTunnel(scene);
  
    const floorLinesGroup = tunnelGroup.children.find(
      child => child instanceof THREE.Group && child.children.length === 3
    );
  
    expect(floorLinesGroup).toBeDefined();
  
    floorLinesGroup.children.forEach(line => {
      // Since the Y offset is baked into the Geometry/Curve, 
      // we check the bounding box of the geometry.
      line.geometry.computeBoundingBox();
      const centerY = (line.geometry.boundingBox.max.y + line.geometry.boundingBox.min.y) / 2;
      
      // We add the group's position (just in case the group itself moved)
      const finalY = centerY + line.position.y + floorLinesGroup.position.y;
  
      expect(finalY).toBeCloseTo(-79, 1);
    });
  });
});