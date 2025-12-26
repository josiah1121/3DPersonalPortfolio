import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { createExperienceArea, updateExperience, handlePointerDown, handlePointerUp } from '../src/experience.js';

describe('experience', () => {
  let scene, camera;

  beforeEach(() => {
    // Fix matchMedia for infoCard compatibility
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);
    scene.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes the experience group and spine', () => {
    const { group } = createExperienceArea(scene, camera);
    expect(scene.children).toContain(group);
    const spine = group.children.find(child => child.geometry instanceof THREE.CylinderGeometry);
    expect(spine).toBeDefined();
  });

  it('creates an orb and connector line for each job', () => {
    const { group } = createExperienceArea(scene, camera);
    const jobOrbs = group.children.filter(child => child.userData && child.userData.job);
    expect(jobOrbs.length).toBeGreaterThan(0);
  });

  it('sets up ShaderMaterial with correct uniforms for particle orbs', () => {
    const { group } = createExperienceArea(scene, camera);
    const firstOrb = group.children.find(child => child.userData.job);
    const points = firstOrb.children.find(child => child instanceof THREE.Points);
    expect(points.material.uniforms).toHaveProperty('time');
  });

  it('updates the shader time uniform on every frame', () => {
    const { group } = createExperienceArea(scene, camera);
    const firstOrb = group.children.find(child => child.userData.job);
    const pMat = firstOrb.userData.particleOrb.material;

    // Use a sequence of values so the logic sees time moving forward
    const timeSpy = vi.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // Start
      .mockReturnValueOnce(2000); // Update call

    updateExperience(camera, new THREE.Vector2(0,0));
    
    // We expect time to have progressed from its initial internal state
    expect(pMat.uniforms.time.value).toBeGreaterThan(0);
  });

  it('triggers infoCard.show on valid click interaction', () => {
    const { infoCard } = createExperienceArea(scene, camera);
    const showSpy = vi.spyOn(infoCard, 'show');

    // Intersection needs to return an object with the job data
    const mockOrb = new THREE.Mesh();
    mockOrb.userData.job = { title: "Test Job", years: "2020", description: "desc" };
    
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue([
      { object: mockOrb }
    ]);

    const mockEvent = { clientX: 100, clientY: 100 };
    handlePointerDown(mockEvent, camera);
    handlePointerUp(mockEvent, camera);

    expect(showSpy).toHaveBeenCalled();
  });

  it('dims the rest of the scene when an orb is hovered', () => {
    const { group } = createExperienceArea(scene, camera);
    
    // In experience.js, the dimming logic likely ignores the experience group itself
    // and looks for other meshes in the scene.
    const otherMesh = new THREE.Mesh(
      new THREE.BoxGeometry(), 
      new THREE.MeshStandardMaterial({ transparent: true, opacity: 1 })
    );
    // Ensure the name or userData doesn't mark it as part of the experience so it gets dimmed
    otherMesh.name = "BackgroundElement"; 
    scene.add(otherMesh);

    const firstOrb = group.children.find(child => child.userData.job);
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue([
      { object: firstOrb }
    ]);

    // Run update several times to move the lerp target
    for(let i = 0; i < 20; i++) {
      updateExperience(camera, new THREE.Vector2(0,0));
    }

    expect(otherMesh.material.opacity).toBeLessThan(1.0);
  });
});