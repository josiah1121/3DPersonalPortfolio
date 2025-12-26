import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { loadModel } from '../src/loadModel.js';

// 1. Mock GLTFLoader using a standard function expression
vi.mock('three/addons/loaders/GLTFLoader.js', () => {
  return {
    GLTFLoader: vi.fn().mockImplementation(function() {
      return {
        load: vi.fn(function(path, onLoad, onProgress, onError) {
          if (path === 'fail.gltf') {
            if (onError) onError(new Error('Load failed'));
          } else {
            const mockScene = new THREE.Group();
            const mockMesh = new THREE.Mesh(
              new THREE.BoxGeometry(),
              new THREE.MeshStandardMaterial()
            );
            mockMesh.isMesh = true;
            mockScene.add(mockMesh);
            onLoad({ scene: mockScene });
          }
        }),
      };
    }),
  };
});

describe('loadModel helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('successfully loads a model and applies transforms', async () => {
    const pos = new THREE.Vector3(10, 20, 30);
    const rot = new THREE.Euler(0, Math.PI, 0);
    const scale = 2.5;

    const model = await loadModel('test.gltf', pos, scale, rot);

    expect(model).toBeDefined();
    expect(model.position.x).toBe(10);
    expect(model.position.y).toBe(20);
    expect(model.position.z).toBe(30);
    expect(model.scale.x).toBe(2.5);
    expect(model.rotation.y).toBeCloseTo(Math.PI);
  });

  it('traverses the model and modifies mesh materials for emissive glow', async () => {
    const model = await loadModel('test.gltf');
    
    model.traverse((child) => {
      if (child.isMesh) {
        // Verify material properties set in loadModel.js
        expect(child.material.emissive.getHex()).toBe(0x223355);
        expect(child.material.emissiveIntensity).toBe(0.3);
      }
    });
  });

  it('rejects the promise and logs error on failure', async () => {
    // Testing the error path
    await expect(loadModel('fail.gltf')).rejects.toThrow('Load failed');
    expect(console.error).toHaveBeenCalled();
  });
});