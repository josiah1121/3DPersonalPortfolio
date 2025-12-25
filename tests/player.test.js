import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createPlayer } from '../src/player.js';

describe('Player', () => {
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    // Mock window global for text position
    window.particleTextPosition = new THREE.Vector3(0, 180, -450);
    // Clear any previous event listeners or scene data
    vi.restoreAllMocks();
  });

  it('correctly assembles the player mesh group', () => {
    const { group } = createPlayer(scene);

    // Group should contain: Body (1), Head (1), Eyes (2) = 4 children
    expect(group.children.length).toBe(4);
    
    const body = group.children.find(c => c.geometry instanceof THREE.CapsuleGeometry);
    const head = group.children.find(c => c.geometry instanceof THREE.SphereGeometry && c.position.y === 1.7);
    
    expect(body).toBeDefined();
    expect(head).toBeDefined();
  });

  it('sets the starting position relative to the text position', () => {
    const textPos = window.particleTextPosition;
    const { group } = createPlayer(scene);

    // Expected: x=0, y=180-100=80, z=-450+180=-270
    expect(group.position.x).toBe(textPos.x);
    expect(group.position.y).toBeCloseTo(80, 1);
    expect(group.position.z).toBe(textPos.z + 180);
  });

  it('updates position when keys are pressed', () => {
    const { group, update } = createPlayer(scene);
    const initialZ = group.position.z;

    // Simulate pressing 'W' (Move forward / -Z)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

    // Update with a delta of 0.1s (speed 120 * 0.1 = 12 units)
    update(0.1);

    expect(group.position.z).toBeLessThan(initialZ);
    expect(group.position.z).toBeCloseTo(initialZ - 12, 1);
    
    // Cleanup key
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
  });

  it('handles diagonal movement normalization', () => {
    const { group, update } = createPlayer(scene);
    
    // Capture horizontal start position
    const startX = group.position.x;
    const startZ = group.position.z;

    // Press 'W' and 'D' (Diagonal)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    update(0.1);

    // Calculate horizontal distance (ignoring Y-axis floating/snapping)
    const dx = group.position.x - startX;
    const dz = group.position.z - startZ;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    // Should be exactly 'speed * delta' (12), proving .normalize() works
    expect(horizontalDistance).toBeCloseTo(12, 1);

    // Cleanup keys
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
  });

  it('applies gentle floating animation based on time', () => {
    const { group, update } = createPlayer(scene);
    
    // Mock Date.now to control the Sine wave
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
    update(0.016);
    const pos1 = group.position.y;

    dateSpy.mockReturnValue(2000);
    update(0.016);
    const pos2 = group.position.y;

    // Check that Y changed, confirming floating logic is active
    expect(pos1).not.toBe(pos2);
    dateSpy.mockRestore();
  });
});