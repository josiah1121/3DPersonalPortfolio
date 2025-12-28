import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createInfoCard } from '../src/components/infoCard.js';

describe('createInfoCard', () => {
  let scene, camera, infoCard;

  beforeEach(() => {
    // Mock matchMedia
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

    // Clean up any leaked overlays from previous failed tests
    const existing = document.getElementById('infocard-html-overlay');
    if (existing) existing.remove();

    scene = new THREE.Scene();
    // Use 50 FOV to match your "middle ground" desktop setting
    camera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 1000);
    infoCard = createInfoCard(scene, camera);
  });

  it('initializes with a hidden group containing 3 meshes', () => {
    expect(infoCard.group).toBeInstanceOf(THREE.Group);
    expect(infoCard.group.visible).toBe(false);
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
    
    const overlay = document.getElementById('infocard-html-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('block');
  });

  it('updates positions and opacities during the update loop', () => {
    infoCard.show({ title: 'Test' });
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();

    infoCard.update();

    /** * UPDATED LOGIC:
     * Camera is at Z = 10. 
     * infoCard.js now uses dist = 12.5 for the "middle ground" zoom.
     * Expected Z = CameraZ - dist => 10 - 12.5 = -2.5
     */
    expect(infoCard.group.position.z).toBeCloseTo(-2.5);
    
    const cardMesh = infoCard.group.children.find(c => c.renderOrder === 1000);
    expect(cardMesh.material.opacity).toBeGreaterThan(0);
  });

  it('hides the group when targetOpacity reaches zero', () => {
    infoCard.show({ title: 'Test' });
    infoCard.update(); 
    infoCard.hide();
    
    // Run update loop until lerp finishes
    for (let i = 0; i < 100; i++) {
      infoCard.update();
    }

    expect(infoCard.group.visible).toBe(false);
    const overlay = document.getElementById('infocard-html-overlay');
    expect(overlay.style.display).toBe('none');
  });

  it('responds to the Escape key to hide the card', () => {
    infoCard.show({ title: 'Test' });
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escEvent);

    infoCard.update();
    
    const cardMesh = infoCard.group.children.find(c => c.renderOrder === 1000);
    // Since hide() sets targetScale to 0.9, the scale should start dropping from 1.0
    expect(cardMesh.scale.x).toBeLessThan(1.0); 
  });

  it('cleans up resources on dispose', () => {
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    infoCard.dispose();

    // Check if event listener was removed
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    // Check if the group was removed from the scene
    expect(scene.children.includes(infoCard.group)).toBe(false);
    
    // Check if HTML element was removed from DOM
    expect(document.getElementById('infocard-html-overlay')).toBeNull();
  });
});