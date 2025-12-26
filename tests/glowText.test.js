// tests/glowText.test.js
import { createGlowText } from '../src/glowText.js';
import * as THREE from 'three';

test('createGlowText adds subtitle particles', () => {
  const scene = new THREE.Scene();
  createGlowText(scene);

  const subtitle = scene.children.find(c => c instanceof THREE.Points);
  expect(subtitle).toBeDefined();
  expect(subtitle.geometry.attributes.position.count).toBeGreaterThan(200);
});