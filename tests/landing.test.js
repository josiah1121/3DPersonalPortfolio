import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { createLandingPage } from '../src/landing.js';

describe('Landing Page Component', () => {
  let scene, camera, onEnter, landingInstance;

  beforeEach(() => {
    document.body.innerHTML = '<div id="landing-overlay"></div>';
    document.body.style.cursor = 'default';
    
    window.innerWidth = 1024;
    window.innerHeight = 768;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
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
    camera = new THREE.PerspectiveCamera();
    onEnter = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (landingInstance && landingInstance.cleanup) landingInstance.cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers(); // Ensure real timers are restored after each test
  });

  it('initializes and adds a group with desktop scale', () => {
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children.find(child => child instanceof THREE.Group);
    
    expect(group).toBeDefined();
    expect(group.scale.x).toBe(1.0); 
    expect(document.body.style.cursor).toBe('none');
  });

  it('initializes with the updated larger scale on mobile', () => {
    // Mock small screen and touch
    window.innerWidth = 375;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
        media: query,
      })),
    });
    
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children.find(child => child instanceof THREE.Group);
    
    // Updated to match your new 3.0 scale requirement
    expect(group.scale.x).toBe(3.0); 
    expect(group.position.z).toBe(-400); // Check depth as well
    expect(document.body.style.cursor).not.toBe('none');
  });

  it('triggers onEnter after the mobile delay on tap', async () => {
    vi.useFakeTimers();
    window.innerWidth = 375;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children.find(child => child instanceof THREE.Group);
    const trigger = group.children.find(c => c.name === 'portal_trigger');

    vi.spyOn(THREE.Raycaster.prototype, 'intersectObject').mockReturnValue([{ object: trigger }]);

    const event = new Event('pointerdown');
    Object.defineProperty(event, 'clientX', { value: 500 });
    Object.defineProperty(event, 'clientY', { value: 500 });
    window.dispatchEvent(event);

    const overlay = document.getElementById('landing-overlay');

    // 1. Initially, it shouldn't have triggered the transition yet due to the delay
    expect(overlay.classList.contains('fade-out')).toBe(false);

    // 2. Advance past the 150ms mobile transition delay
    vi.advanceTimersByTime(151);
    expect(overlay.classList.contains('fade-out')).toBe(true);

    // 3. Advance through the animation duration
    vi.advanceTimersByTime(1500);
    expect(onEnter).toHaveBeenCalled();
  });

  it('cleans up event listeners on dispose', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    landingInstance = createLandingPage(scene, camera, onEnter);
    landingInstance.cleanup();

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});