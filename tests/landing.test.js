import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { createLandingPage } from '../src/landing.js';

describe('Landing Page Component', () => {
  let scene, camera, onEnter, landingInstance;

  beforeEach(() => {
    document.body.innerHTML = '<div id="landing-overlay"></div>';
    document.body.style.cursor = 'default';
    
    // Set a default desktop width
    window.innerWidth = 1024;
    window.innerHeight = 768;

    // Comprehensive matchMedia mock
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
  });

  it('initializes and adds a group with desktop scale', () => {
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children.find(child => child instanceof THREE.Group);
    
    expect(group).toBeDefined();
    expect(group.scale.x).toBe(1.0); 
    expect(document.body.style.cursor).toBe('none');
  });

  it('initializes with a smaller scale on mobile screen width', () => {
    // 1. Mock small screen width
    window.innerWidth = 375;
    
    // 2. Mock touch capability
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
    
    expect(group.scale.x).toBeCloseTo(0.6); 
    expect(document.body.style.cursor).not.toBe('none');
  });

  it('triggers onEnter immediately on mobile tap', async () => {
    vi.useFakeTimers();
    window.innerWidth = 375;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    
    landingInstance = createLandingPage(scene, camera, onEnter);
    const group = scene.children.find(child => child instanceof THREE.Group);
    const trigger = group.children.find(c => c.name === 'portal_trigger');

    vi.spyOn(THREE.Raycaster.prototype, 'intersectObject').mockReturnValue([{ object: trigger }]);

    // Manually define clientX/Y on event for JSDOM compatibility
    const event = new Event('pointerdown');
    Object.defineProperty(event, 'clientX', { value: 500 });
    Object.defineProperty(event, 'clientY', { value: 500 });
    window.dispatchEvent(event);

    const overlay = document.getElementById('landing-overlay');
    expect(overlay.classList.contains('fade-out')).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(onEnter).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cleans up event listeners on dispose', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    landingInstance = createLandingPage(scene, camera, onEnter);
    landingInstance.cleanup();

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});