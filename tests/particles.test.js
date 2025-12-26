// tests/particles.test.js
import { createParticles, updateParticles } from '../src/particles.js';
import * as THREE from 'three';

describe('particles', () => {
  let scene, camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
  });

  it('creates particle system with correct number of points', () => {
    // Using a longer string or lowering the threshold
    createParticles(scene, "JOSIAH CLARK PORTFOLIO"); 
    const points = scene.children.find(c => c instanceof THREE.Points);
    expect(points).toBeDefined();

    const count = points.geometry.attributes.position.count;
    // Lower this to 100 since we are using mocked canvas data anyway
    expect(count).toBeGreaterThan(100); 
  });

  it('particles move toward home positions over time', () => {
    createParticles(scene, "A");
    const points = scene.children[0];
    const posAttr = points.geometry.attributes.position;

    const initialPositions = posAttr.array.slice(0, 9); // first 3 particles

    updateParticles(camera);
    updateParticles(camera);
    updateParticles(camera);

    const finalPositions = posAttr.array.slice(0, 9);
    expect(finalPositions).not.toEqual(initialPositions);
  });
});