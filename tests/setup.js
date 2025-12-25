import { vi } from 'vitest';
import 'vitest-canvas-mock';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// 1. Define the TWEEN mock structure using a standard function for the constructor
const tweenMockInstance = {
  to: vi.fn().mockReturnThis(),
  easing: vi.fn().mockReturnThis(),
  yoyo: vi.fn().mockReturnThis(),
  repeat: vi.fn().mockReturnThis(),
  start: vi.fn().mockReturnThis(),
  // Added onUpdate to handle dynamic speed/color changes
  onUpdate: vi.fn(function(cb) {
    if (cb) cb({ val: 3 }); // Simulate the end-state of the tween for the test
    return this;
  }),
  onComplete: vi.fn(function(cb) { 
    if (cb) cb(); 
    return this; 
  }),
};

// Use a regular function here so 'new' works
const MockTween = vi.fn(function() {
  return tweenMockInstance;
});

const TWEEN_MOCK = {
  Tween: MockTween,
  Easing: {
    Elastic: { Out: vi.fn(n => n) },
    Quadratic: { 
      Out: vi.fn(n => n),
      In: vi.fn(n => n) // Added this to support your onClick animation
    },
    Linear: { None: vi.fn(n => n) },
    Back: { Out: vi.fn(n => n) },
    Exponential: { In: vi.fn(n => n) }
  },
  update: vi.fn()
};

// 2. Mock the CDN URL
vi.mock('https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js', () => ({
  default: TWEEN_MOCK,
  ...TWEEN_MOCK
}));

global.THREE = THREE;

// --- Loaders & Canvas Mocks ---
FontLoader.prototype.load = (url, onLoad) => {
  onLoad({ generateShapes: () => [], data: {} });
};

THREE.TextureLoader.prototype.load = (url, onLoad) => {
  const texture = new THREE.Texture();
  if (onLoad) onLoad(texture);
  return texture;
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(), 
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1.0,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    getImageData: vi.fn((x, y, w, h) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) data[i + 3] = 255; 
      return { data };
    }),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
  })),
});