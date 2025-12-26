import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createInfoCard } from '../src/components/infoCard.js';

describe('createInfoCard', () => {
  let scene, camera, infoCard;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    // Position camera so group.copy(camera) has a known starting point
    camera.position.set(0, 0, 0);
    infoCard = createInfoCard(scene, camera);
  });

  it('initializes with a hidden group containing 3 meshes', () => {
    expect(infoCard.group).toBeInstanceOf(THREE.Group);
    expect(infoCard.group.visible).toBe(false);
    
    // Overlay, Backdrop, and Card Mesh
    const meshes = infoCard.group.children.filter(child => child instanceof THREE.Mesh);
    expect(meshes.length).toBe(3);
  });

  it('becomes visible and updates target values when show() is called', () => {
    const testData = {
      title: 'Test Project',
      years: '2023 - 2024',
      description: 'A test description'
    };

    infoCard.show(testData);
    expect(infoCard.group.visible).toBe(true);
    
    // After calling show, currentOpacity is still 0 (needs update() to transition)
    // but we can check if the group is now active
    expect(infoCard.group.visible).toBe(true);
  });

  it('updates positions and opacities during the update loop', () => {
    infoCard.show({ title: 'Test' });
    
    // Move camera to ensure the card follows it
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();

    // Run update logic
    infoCard.update();

    // The group should have moved to the camera's position 
    // and then translated -10 on Z (based on your code's const dist = 10)
    expect(infoCard.group.position.z).toBeLessThan(camera.position.z);
    
    // Check if opacity is increasing from 0
    const cardMesh = infoCard.group.children.find(c => c.geometry instanceof THREE.PlaneGeometry && c.scale.x !== 5);
    expect(cardMesh.material.opacity).toBeGreaterThan(0);
  });

  it('hides the group when targetOpacity reaches zero', () => {
    infoCard.show({ title: 'Test' });
    infoCard.update(); // Bring opacity up
    
    infoCard.hide();
    
    // Simulate multiple frames to let the lerp (0.12) reach the threshold (< 0.01)
    for (let i = 0; i < 50; i++) {
      infoCard.update();
    }

    expect(infoCard.group.visible).toBe(false);
  });

  it('responds to the Escape key to hide the card', () => {
    infoCard.show({ title: 'Test' });
    expect(infoCard.group.visible).toBe(true);

    // Dispatch synthetic keyboard event
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escEvent);

    // Update to process the change in targetOpacity
    infoCard.update();
    
    // Verify it started hiding (targetScale should be 0.9 now)
    // We can't check the private variable, but we can check the mesh scale decreasing
    const cardMesh = infoCard.group.children.find(c => c.renderOrder === 1000);
    expect(cardMesh.scale.x).toBeLessThan(1.0);
  });

  it('cleans up resources on dispose', () => {
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');
    const sceneRemoveSpy = vi.spyOn(scene, 'remove');
    
    infoCard.dispose();

    expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(sceneRemoveSpy).toHaveBeenCalledWith(infoCard.group);
  });
});