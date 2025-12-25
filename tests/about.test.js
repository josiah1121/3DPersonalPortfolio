import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';

// 1. Mock External Assets & Classes
vi.mock('three/addons/loaders/FontLoader.js', () => ({
  FontLoader: vi.fn().mockImplementation(function() {
    return { load: vi.fn((url, onLoad) => onLoad({ data: {}, generateShapes: () => [] })) };
  })
}));

vi.mock('three/addons/geometries/TextGeometry.js', () => ({
  TextGeometry: vi.fn().mockImplementation(function() {
    return {
      computeBoundingBox: vi.fn(),
      translate: vi.fn(),
      boundingBox: { min: { x: 0 }, max: { x: 10 } },
      morphAttributes: {},
      attributes: {},
      userData: {}
    };
  })
}));

vi.mock('https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js', () => {
  const TweenMock = vi.fn().mockImplementation(function() {
    return {
      to: vi.fn().mockReturnThis(),
      easing: vi.fn().mockReturnThis(),
      yoyo: vi.fn().mockReturnThis(),
      repeat: vi.fn().mockReturnThis(),
      start: vi.fn().mockReturnThis(),
      onComplete: vi.fn().mockReturnThis(),
    };
  });
  return {
    default: {
      Tween: TweenMock,
      Easing: { Elastic: { Out: vi.fn() } }
    }
  };
});

describe('About Area', () => {
  let scene;
  let mockCtx;

  beforeEach(() => {
    scene = new THREE.Scene();
    document.body.innerHTML = '';
    vi.useFakeTimers();
    vi.resetModules();

    // Setup a robust Canvas Mock
    mockCtx = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
    };
    
    // Intercept every getContext('2d') call
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes correctly and draws bio text to the canvas', async () => {
    const { createAboutArea } = await import('../src/about.js');
    const group = createAboutArea(scene);

    expect(group.position.x).toBe(-1800);
    
    // Check our mockCtx instead of a prototype spy
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      "Josiah Clark", 
      expect.any(Number), 
      expect.any(Number)
    );
    
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Collins Aerospace"), 
      expect.any(Number), 
      expect.any(Number)
    );
  });

  it('updates letter physics and triggers TWEEN on landing', async () => {
    const { createAboutArea, updateAboutLetters } = await import('../src/about.js');
    const group = createAboutArea(scene);
    
    const letter = group.children.find(c => c.userData && c.userData.velocity);
    
    letter.position.y = -50; 
    letter.userData.targetY = -60;
    letter.userData.landed = false;

    updateAboutLetters(0.1); 

    expect(letter.userData.landed).toBe(true);
    expect(letter.position.y).toBe(-60);
    expect(letter.material.emissiveIntensity).toBe(4.0);
  });

  it('adds panel meshes after animation frame', async () => {
    const { createAboutArea } = await import('../src/about.js');
    const group = createAboutArea(scene);

    vi.runAllTimers(); 
    
    const panel = group.children.find(c => c.geometry instanceof THREE.PlaneGeometry);
    expect(panel).toBeDefined();
  });
});