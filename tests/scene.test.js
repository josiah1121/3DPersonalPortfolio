import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { initScene } from '../src/scene.js';

// 1. Mock WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(function() {
      return {
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        domElement: document.createElement('canvas'),
        render: vi.fn(),
      };
    }),
  };
});

// 2. Mock OrbitControls
vi.mock('three/addons/controls/OrbitControls.js', () => {
  return {
    OrbitControls: vi.fn().mockImplementation(function() {
      return {
        update: vi.fn(),
        enableDamping: false,
        dampingFactor: 0,
        rotateSpeed: 0,
        target: new THREE.Vector3(),
      };
    }),
  };
});

describe('Scene Initialization', () => {
  beforeEach(() => {
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

    document.body.innerHTML = '';
    // Set typical Desktop resolution
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    vi.clearAllMocks();
  });

  it('sets up the scene with the correct background and fog', () => {
    const { scene } = initScene();
    expect(scene.background.getHex()).toBe(0x000011);
    expect(scene.fog).toBeInstanceOf(THREE.FogExp2);
  });

  it('configures the camera with the cinematic starting position', () => {
    const { camera } = initScene();
    
    // Updated to match source code changes: camera.position.set(0, 650, 2200);
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(650);
    expect(camera.position.z).toBe(2200);
    
    // Updated to match source code FOV logic for desktop landscape (45)
    expect(camera.fov).toBe(45);
  });

  it('attaches a renderer to the document body', () => {
    initScene();
    const canvas = document.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('creates an infinite ground plane and grid helper', () => {
    const { scene } = initScene();
    const ground = scene.children.find(c => c.geometry instanceof THREE.PlaneGeometry);
    expect(ground).toBeDefined();
    expect(ground.position.y).toBe(-80);
  });

  it('updates camera aspect on window resize', () => {
    const { camera } = initScene();
    window.innerWidth = 1000;
    window.innerHeight = 500;
    window.dispatchEvent(new Event('resize'));
    expect(camera.aspect).toBe(2);
  });

  it('defines the recenterCameraOnText global function', () => {
    initScene();
    expect(typeof window.recenterCameraOnText).toBe('function');
  });
});