import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createSkillsTitle, updateSkillsTitle } from '../src/skillsTitle.js';

describe('skillsTitle', () => {
  let scene, camera, mockSkillsGroup;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    
    // Skills group used for position calculations
    mockSkillsGroup = new THREE.Group();
    mockSkillsGroup.position.set(-1100, 100, -800);
    
    scene.clear();
    vi.restoreAllMocks();
  });

  it('initializes the title group and converts text to particle data', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);

    expect(title).toBeDefined();
    expect(title instanceof THREE.Group).toBe(true);
    
    // Check that we extracted particle data into userData
    const ud = title.userData;
    expect(ud.allParticles.length).toBeGreaterThan(0);
    expect(ud.geometry.attributes.position.count).toBe(10000); // maxParticles
  });

  it('spawns particles over time based on delta', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    const ud = title.userData;

    // Initially, particles at index 0 should be at 0,0,0 (unspawned)
    expect(ud.positions[0]).toBe(0);

    // Update with a delta large enough to spawn the first few particles
    // interval is 0.0008, so 0.01 should spawn several
    updateSkillsTitle(camera, 0.01);

    // The first particle should now have a randomized spawn position (not 0,0,0)
    expect(ud.positions[0]).not.toBe(0);
    expect(ud.positions[1]).toBeGreaterThan(0); // spawned with +50 height minimum
  });

  it('correctly calculates the world position and title plane', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    
    // Based on code: -1100 + 30, 50, -800 + 180
    expect(title.position.x).toBe(-1070);
    expect(title.position.y).toBe(50);
    expect(title.position.z).toBe(-620);
  });

  it('progresses through letters sequentially', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    
    // Update multiple times to simulate time passing
    // Total particles are usually ~1000-2000 for "Skills"
    // We update with a huge delta to "finish" the animation
    updateSkillsTitle(camera, 5.0); 

    const ud = title.userData;
    const lastIdx = (ud.allParticles.length - 1) * 3;
    
    // The last particle in the entire array should now be active
    expect(ud.positions[lastIdx]).not.toBe(0);
  });

  it('applies repulsive force when mouse is near', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    
    // 1. Spawn everything first
    updateSkillsTitle(camera, 5.0);
    
    const ud = title.userData;
    const initialX = ud.positions[0];

    // 2. Mock mouse position directly over the first particle
    // Note: We need to mock the cursor.js exports
    vi.mock('./cursor.js', () => ({
      mouse: new THREE.Vector2(0, 0),
      isMouseOver: true
    }));

    // Update again - it should trigger the repulsion logic
    updateSkillsTitle(camera, 0.016);

    const newX = ud.positions[0];
    expect(newX).not.toBe(initialX);
  });
});