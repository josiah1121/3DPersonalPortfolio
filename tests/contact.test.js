import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';

describe('contactArea', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    document.body.innerHTML = '';
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('draws contact info to the canvas', async () => {
    // 1. Create a mock context object with a fillText spy
    const mockCtx = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      getContext: vi.fn(),
      beginPath: vi.fn(),
      // Add any other canvas methods used in contact.js
    };

    // 2. Mock getContext to return our mockCtx
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
    
    // 3. Import and run
    const { createContactArea } = await import('../src/contact.js');
    createContactArea(scene);

    // 4. Verify the spy on our mock object
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("CONNECT"), 
      expect.any(Number), 
      expect.any(Number)
    );
    
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("josiah1121@gmail.com"), 
      expect.any(Number), 
      expect.any(Number)
    );

    getContextSpy.mockRestore();
  });

  it('creates the 3D console elements after the next animation frame', async () => {
    const { createContactArea } = await import('../src/contact.js');
    const group = createContactArea(scene);

    // Force requestAnimationFrame to resolve
    vi.runAllTimers();
    
    // Check if children were added (Panel, Glow, Base, Pillar)
    expect(group.children.length).toBeGreaterThanOrEqual(4);
    
    const hasPanel = group.children.some(c => c.geometry instanceof THREE.PlaneGeometry);
    expect(hasPanel).toBe(true);
  });
});