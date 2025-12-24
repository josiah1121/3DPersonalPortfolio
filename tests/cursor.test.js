// tests/cursor.test.js
import { setupCursor, mouse } from '../src/cursor.js';
import * as THREE from 'three';

describe('cursor', () => {
  let scene, camera, renderer;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    renderer = { domElement: document.createElement('canvas') };
  });

  it('hides native cursor and creates sprite group', () => {
    setupCursor(scene, camera, renderer);
    expect(renderer.domElement.style.cursor).toBe('none');

    const cursorGroup = scene.children.find(g => g instanceof THREE.Group && g.children.length === 2);
    expect(cursorGroup).toBeDefined();
    expect(cursorGroup.visible).toBe(false); // starts hidden
  });
});