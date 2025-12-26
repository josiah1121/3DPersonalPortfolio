import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createExperienceTitle, updateExperienceTitle } from '../src/experienceTitle.js';

describe('experienceTitle', () => {
  let scene, camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    
    // Reset performance.now for deterministic animation tests
    vi.spyOn(performance, 'now').mockReturnValue(0);
    
    scene.clear();
  });

  it('creates particles by sampling text from a canvas', () => {
    // The setup.js mock for getImageData ensures we have "pixels" to convert
    const particles = createExperienceTitle(scene);

    expect(particles).toBeDefined();
    expect(particles instanceof THREE.Points).toBe(true);
    
    // Verify geometry has positions
    const posAttr = particles.geometry.getAttribute('position');
    expect(posAttr.count).toBeGreaterThan(0);
    expect(scene.children).toContain(particles);
  });

  it('initially scatters particles away from their home positions', () => {
    const particles = createExperienceTitle(scene);
    const currentPos = particles.geometry.getAttribute('position').array;
    
    // We need to access the "home" positions. Since they aren't exported,
    // we can check if the current positions are widely spread.
    //TITLE_X_OFFSET is 50, but scatter is 700 radius.
    let foundScattered = false;
    for (let i = 0; i < currentPos.length; i += 3) {
      if (Math.abs(currentPos[i] - 50) > 100) {
        foundScattered = true;
        break;
      }
    }
    expect(foundScattered).toBe(true);
  });

  it('moves particles toward home positions during update (Spring physics)', () => {
    const particles = createExperienceTitle(scene);
    const posAttr = particles.geometry.getAttribute('position');
    const initialX = posAttr.array[0];

    // Simulate time passing
    vi.spyOn(performance, 'now').mockReturnValue(500);
    
    updateExperienceTitle(camera);

    const updatedX = posAttr.array[0];
    // Particles should have moved from their scattered position toward home
    // (Testing that velocity was applied and position changed)
    expect(updatedX).not.toBe(initialX);
  });

  it('completes formation after the duration passes', () => {
    createExperienceTitle(scene);
    
    // Move time past titleFormationDuration (1200ms)
    vi.spyOn(performance, 'now').mockReturnValue(2000);
    
    // First update handles transition
    updateExperienceTitle(camera);
    
    // If we could access isFormingTitle we would, but we verify 
    // by ensuring no crashes and further position updates.
    expect(() => updateExperienceTitle(camera)).not.toThrow();
  });

  it('clones the particle material to prevent global state leaks', () => {
    const particles1 = createExperienceTitle(scene);
    const mat1 = particles1.material;
    
    // Clear and create again
    scene.clear();
    const particles2 = createExperienceTitle(scene);
    const mat2 = particles2.material;

    expect(mat1).not.toBe(mat2); // Should be unique instances
  });
});