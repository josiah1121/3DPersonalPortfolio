import 'vitest-canvas-mock';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Global THREE if needed
global.THREE = THREE;

// Keep your FontLoader mock
FontLoader.prototype.load = (url, onLoad) => {
  onLoad({});
};

// Keep your TextureLoader mock
THREE.TextureLoader.prototype.load = () => new THREE.Texture();

// Mock getImageData to return "fake" text pixels
HTMLCanvasElement.prototype.getContext = function(type) {
    const actualCtx = this.getContextOriginal ? this.getContextOriginal(type) : null;
    
    return {
      ...actualCtx,
      fillText: () => {},
      measureText: () => ({ width: 100 }),
      clearRect: () => {},
      getImageData: (x, y, w, h) => {
        const data = new Uint8ClampedArray(w * h * 4);
        // Fill the buffer so that even with a step of 3, we find plenty of pixels
        for (let i = 0; i < data.length; i += 4) {
          data[i + 3] = 255; // Set Alpha to max for every pixel
        }
        return { data };
      },
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      fillRect: () => {},
    };
  };