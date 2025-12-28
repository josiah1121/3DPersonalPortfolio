import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

// 1. Mock cursor.js using a getter to allow dynamic toggling of the boolean
vi.mock('../src/cursor.js', () => {
  return {
    mouse: new THREE.Vector2(0, 0),
    get isMouseOver() { return global._isMouseOverMock; }
  };
});

import { createSkillsTitle, updateSkillsTitle } from '../src/skillsTitle.js';

describe('skillsTitle', () => {
  let scene, camera, mockSkillsGroup;

  beforeEach(() => {
    global._isMouseOverMock = false;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    mockSkillsGroup = new THREE.Group();
    scene.clear();
    vi.clearAllMocks();
  });

  it('initializes the title group and converts text to particle data', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    expect(title).toBeDefined();
    const ud = title.userData;
    expect(ud.allParticles.length).toBeGreaterThan(0);
  });

  it('spawns particles over time based on delta', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    const ud = title.userData;
    expect(ud.positions[0]).toBe(0);
    updateSkillsTitle(camera, 0.05); 
    expect(ud.positions[0]).not.toBe(0);
  });

  it('correctly calculates the world position and title plane', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    expect(title.position.x).toBe(-870);
    expect(title.position.y).toBe(60);
    expect(title.position.z).toBe(-550);
  });

  it('progresses through letters sequentially to completion', () => {
    const title = createSkillsTitle(scene, mockSkillsGroup);
    updateSkillsTitle(camera, 20.0); 
    const ud = title.userData;
    const lastIdx = (ud.allParticles.length - 1) * 3;
    expect(ud.positions[lastIdx]).not.toBe(0);
  });

  it('applies repulsive force when mouse is near', () => {
    // 1. Enable interaction
    global._isMouseOverMock = true; 
    const title = createSkillsTitle(scene, mockSkillsGroup);
    
    // Sync matrices for world position math
    title.updateMatrixWorld(true);
    
    // Spawn particles and let them settle
    updateSkillsTitle(camera, 10.0); 
    const ud = title.userData;
    updateSkillsTitle(camera, 1.0); 
    
    // Capture state before repulsion
    const initialX = ud.positions[0];
    const initialZ = ud.positions[2];

    // 2. Correctly mock the Ray intersection
    // In your code: raycaster.ray.intersectPlane(titlePlane, mouse3D)
    // We transform a local position to world space to be the "hit" point
    const targetLocal = new THREE.Vector3(ud.positions[0], ud.positions[1], ud.positions[2]);
    const targetWorld = targetLocal.clone().applyMatrix4(title.matrixWorld);

    // FIX: Spy on Ray.prototype.intersectPlane, not Raycaster
    const raySpy = vi.spyOn(THREE.Ray.prototype, 'intersectPlane')
      .mockImplementation((plane, targetVec) => {
        targetVec.copy(targetWorld);
        return targetVec;
      });

    // 3. Update: Force calculation should now trigger
    updateSkillsTitle(camera, 0.016);

    const newX = ud.positions[0];
    const newZ = ud.positions[2];

    // Check if the particle moved away from its target coordinates
    const hasMoved = Math.abs(newX - initialX) > 0.001 || Math.abs(newZ - initialZ) > 0.001;
    
    expect(hasMoved).toBe(true);
    raySpy.mockRestore();
  });
});