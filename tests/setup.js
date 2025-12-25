// tests/setup.js
import { vi } from 'vitest';
import 'vitest-canvas-mock';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// 1. Mock the HTTPS import for TWEEN
vi.mock('https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js', () => {
  return {
    default: {
      Tween: class {
        constructor(obj) { this.obj = obj; }
        to() { return this; }
        easing() { return this; }
        yoyo() { return this; }
        repeat() { return this; }
        start() { return this; }
        onComplete(cb) { if (cb) cb(); return this; }
      },
      Easing: {
        Elastic: { Out: (n) => n },
        Quadratic: { Out: (n) => n },
        Linear: { None: (n) => n }
      }
    }
  };
});

global.THREE = THREE;

// 2. Fix "generateShapes" error by providing a minimal font mock
FontLoader.prototype.load = (url, onLoad) => {
  onLoad({
    generateShapes: () => [], // Returns empty array so TextGeometry doesn't crash
    data: {}
  });
};

THREE.TextureLoader.prototype.load = () => new THREE.Texture();

// 3. Complete Canvas Mock
HTMLCanvasElement.prototype.getContext = function(type) {
  const actualCtx = this.getContextOriginal ? this.getContextOriginal(type) : null;
  
  return {
    ...actualCtx,
    // Text & Measure
    fillText: () => {},
    measureText: () => ({ width: 100 }),
    
    // Rects & Clears
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {}, // Added this to fix PersonalProject crash
    
    // Pathing
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    quadraticCurveTo: () => {},
    closePath: () => {},

    // Styling
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1.0,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,

    // Gradients
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),

    // Image Data
    getImageData: (x, y, w, h) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) data[i + 3] = 255; 
      return { data };
    },
  };
};