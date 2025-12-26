import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { initDust, updateDust } from '../src/dust.js';

describe('dust system', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    scene.clear();
  });

  it('initializes the dust system with 4000 points and specialized attributes', () => {
    initDust(scene);

    const dustSystem = scene.children.find(child => child instanceof THREE.Points);
    
    expect(dustSystem).toBeDefined();
    expect(dustSystem.geometry.attributes.position.count).toBe(4000);
    
    // Check for the custom attributes required by your shader
    expect(dustSystem.geometry.attributes.phase).toBeDefined();
    expect(dustSystem.geometry.attributes.speed).toBeDefined();
    expect(dustSystem.geometry.attributes.bobAmp).toBeDefined();
    
    // Verify initial layout spread
    const posArray = dustSystem.geometry.attributes.position.array;
    expect(posArray.length).toBe(4000 * 3);
  });

  it('sets up the ShaderMaterial with correct uniforms and rendering properties', () => {
    initDust(scene);
    const dustSystem = scene.children.find(child => child instanceof THREE.Points);
    const material = dustSystem.material;

    expect(material instanceof THREE.ShaderMaterial).toBe(true);
    expect(material.uniforms.time.value).toBe(0);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(dustSystem.renderOrder).toBe(999);
  });

  it('increments the time uniform on update', () => {
    initDust(scene);
    const dustSystem = scene.children.find(child => child instanceof THREE.Points);
    
    const initialTime = dustSystem.material.uniforms.time.value;
    updateDust();
    
    expect(dustSystem.material.uniforms.time.value).toBeGreaterThan(initialTime);
    expect(dustSystem.material.uniforms.time.value).toBeCloseTo(0.014);
  });

  it('assigns random values within specified ranges for bobbing and speed', () => {
    initDust(scene);
    const dustSystem = scene.children.find(child => child instanceof THREE.Points);
    const bobAmpArray = dustSystem.geometry.attributes.bobAmp.array;
    const speedArray = dustSystem.geometry.attributes.speed.array;

    // Check a few samples to ensure they are within the logic ranges
    // BobAmp: 12 + Math.random() * 28 => Range [12, 40]
    expect(bobAmpArray[0]).toBeGreaterThanOrEqual(12);
    expect(bobAmpArray[0]).toBeLessThanOrEqual(40);

    // Speed: 0.25 + Math.random() * 0.55 => Range [0.25, 0.8]
    expect(speedArray[0]).toBeGreaterThanOrEqual(0.25);
    expect(speedArray[0]).toBeLessThanOrEqual(0.8);
  });
});