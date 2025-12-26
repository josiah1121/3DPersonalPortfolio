import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createExperienceArea, updateExperience, handlePointerDown, handlePointerUp } from '../src/experience.js';

describe('experience', () => {
  let scene, camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 0);
    // Reset the scene before each test
    scene.clear();
  });

  it('initializes the experience group and spine', () => {
    const { group } = createExperienceArea(scene, camera);
    
    expect(scene.children).toContain(group);
    // Check for the timeline "spine" cylinder
    const spine = group.children.find(child => child.geometry instanceof THREE.CylinderGeometry);
    expect(spine).toBeDefined();
    expect(spine.material.color.getHex()).toBe(0x003366);
  });

  it('creates an orb and connector line for each job', () => {
    const { group } = createExperienceArea(scene, camera);
    
    // There are 2 jobs defined in the src/experience.js array
    const jobOrbs = group.children.filter(child => child instanceof THREE.Group && child.userData.job);
    const connectors = group.children.filter(child => child.geometry instanceof THREE.TubeGeometry);
    
    expect(jobOrbs.length).toBe(2);
    expect(connectors.length).toBe(2);
  });

  it('sets up ShaderMaterial with correct uniforms for particle orbs', () => {
    const { group } = createExperienceArea(scene, camera);
    const firstOrb = group.children.find(child => child.userData.job);
    const points = firstOrb.children.find(child => child instanceof THREE.Points);

    expect(points.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(points.material.uniforms).toHaveProperty('time');
    expect(points.material.uniforms).toHaveProperty('flow');
  });

  it('updates the shader time uniform on every frame', () => {
    const { group } = createExperienceArea(scene, camera);
    const firstOrb = group.children.find(child => child.userData.job);
    const pMat = firstOrb.userData.particleOrb.material;

    // Simulate time passing
    vi.spyOn(performance, 'now').mockReturnValue(5000);
    updateExperience(camera, null);
    
    expect(pMat.uniforms.time.value).toBe(5.0);
  });

  it('triggers infoCard.show on valid click interaction', () => {
    const { infoCard } = createExperienceArea(scene, camera);
    const showSpy = vi.spyOn(infoCard, 'show');

    // Simulate a mouse down and up in the same spot (a click)
    const mockEvent = { clientX: 500, clientY: 500 };
    
    // We mock the Raycaster's intersection because JSDOM doesn't do 3D picking
    // In experience.js, the logic looks for obj.userData.job
    const mockOrb = new THREE.Group();
    mockOrb.userData.job = { title: "Test Job" };
    
    // Override Raycaster for this test to return our mock orb
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue([
      { object: mockOrb }
    ]);

    handlePointerDown(mockEvent, camera);
    handlePointerUp(mockEvent, camera);

    expect(showSpy).toHaveBeenCalledWith(expect.objectContaining({ title: "Test Job" }));
  });

  it('dims the rest of the scene when an orb is hovered', () => {
    const { group } = createExperienceArea(scene, camera);
    
    // Add a dummy mesh to the scene to see if it dims
    const dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ opacity: 1 }));
    scene.add(dummyMesh);

    // Mock mouse vector for raycasting
    const mouseVec = new THREE.Vector2(0, 0);
    
    // Simulate hover via raycaster mock
    const firstOrb = group.children.find(child => child.userData.job);
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue([
      { object: firstOrb }
    ]);

    updateExperience(camera, mouseVec);

    // After dimming logic, the dummy mesh opacity should be decreasing
    expect(dummyMesh.material.opacity).toBeLessThan(1.0);
  });
});