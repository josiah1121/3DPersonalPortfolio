import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

describe('Landing Page Component', () => {
  let scene, camera, onEnter, createLandingPage, landingInstance;

  beforeEach(async () => {
    // Import the component
    const mod = await import('../src/landing.js');
    createLandingPage = mod.createLandingPage;

    document.body.innerHTML = '<div id="landing-overlay"></div>';
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    onEnter = vi.fn();
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (landingInstance && landingInstance.cleanup) {
      landingInstance.cleanup();
    }
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('initializes and adds a group to the scene', () => {
    landingInstance = createLandingPage(scene, camera, onEnter);
    expect(scene.children.length).toBeGreaterThan(0);
    expect(document.body.style.cursor).toBe('none');
  });

  it('updates rotations based on time', () => {
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children[0];
    const layer1 = group.children[0];
    landingInstance.update(10);
    expect(layer1.rotation.z).toBeDefined();
  });

  it('scales up when the portal trigger is hovered', async () => {
    landingInstance = createLandingPage(scene, camera, onEnter);
    const trigger = scene.getObjectByName('portal_trigger');
    
    // Mock the raycaster to hit our trigger
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObject').mockReturnValue([{ object: trigger }]);

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }));

    expect(document.body.style.cursor).toBe('pointer');
    expect(TWEEN.Tween).toHaveBeenCalled();
  });

  it('triggers onEnter and cleans up after click', async () => {
    vi.useFakeTimers();
    landingInstance = createLandingPage(scene, camera, onEnter);
    const trigger = scene.getObjectByName('portal_trigger');

    // 1. Simulate Hover
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObject').mockReturnValue([{ object: trigger }]);
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }));
    
    // 2. Simulate Click
    window.dispatchEvent(new MouseEvent('pointerdown'));

    const overlay = document.getElementById('landing-overlay');
    expect(overlay.classList.contains('fade-out')).toBe(true);

    // 3. Fast-forward through the 1500ms timeout
    vi.advanceTimersByTime(1500);

    expect(onEnter).toHaveBeenCalled();
    vi.useRealTimers();
  });
});