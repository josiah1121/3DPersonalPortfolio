import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { initShootingStars, updateShootingStars } from '../src/stars.js';

describe('stars', () => {
  let scene, camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    // Clear the scene and ensure all global mocks are reset
    scene.clear();
    vi.restoreAllMocks();
  });

  it('initializes the static starfield with 16000 points', () => {
    initShootingStars(scene, camera);
    const starfield = scene.children.find(
      child => child instanceof THREE.Points && 
      child.geometry.attributes.position.count === 16000
    );
    expect(starfield).toBeDefined();
  });

  it('creates 24 meteor objects (points and sprites) in the scene', () => {
    initShootingStars(scene, camera);
    const pointsCount = scene.children.filter(c => c instanceof THREE.Points).length;
    const spritesCount = scene.children.filter(c => c instanceof THREE.Sprite).length;
    expect(pointsCount).toBe(25); // 24 meteors + starfield
    expect(spritesCount).toBe(24);
  });

  it('activates a meteor and assigns HSL colors after update cycles', () => {
    // 1. Mock random BEFORE init so all 24 meteors get delay = 0
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    
    initShootingStars(scene, camera);
    updateShootingStars(); // This should trigger resetMeteor immediately

    const activeHead = scene.children.find(c => c instanceof THREE.Sprite && c.visible === true);
    
    expect(activeHead).toBeDefined();
    
    const hsl = { h: 0, s: 0, l: 0 };
    activeHead.material.color.getHSL(hsl);
    
    // Since mock was 0, it should hit the "Fiery" HSL (0.1) path
    expect(Math.abs(hsl.h - 0.1)).toBeLessThan(0.05);
    
    randomSpy.mockRestore();
  });

  it('fades out the head sprite when isFading is triggered', () => {
    // Force delay=0 and life=100
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    
    initShootingStars(scene, camera);
    updateShootingStars(); 

    const activeHead = scene.children.find(c => c instanceof THREE.Sprite && c.visible === true);
    
    // Advance 90 frames (starts fading at 80)
    for (let i = 0; i < 95; i++) {
      updateShootingStars();
    }

    expect(activeHead.material.opacity).toBeLessThan(1.0);
    expect(activeHead.material.opacity).toBeGreaterThan(0);
    
    randomSpy.mockRestore();
  });

  it('rotates the static starfield very slowly', () => {
    initShootingStars(scene, camera);
    const starfield = scene.children.find(c => c.geometry.attributes.position.count === 16000);
    const initialRotation = starfield.rotation.y;
    updateShootingStars();
    expect(starfield.rotation.y).toBeGreaterThan(initialRotation);
  });
});