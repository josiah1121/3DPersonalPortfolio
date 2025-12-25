import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { createProjectsArea, updateTitleLetters, PersonalProject } from '../src/projects.js';

describe('projects', () => {
  let scene, camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 500, 1000);
    scene.clear();
    
    // Mock requestAnimationFrame for the PersonalProject class
    vi.stubGlobal('requestAnimationFrame', (cb) => cb());
  });

  describe('createProjectsArea', () => {
    it('initializes the title group in the scene', () => {
      const titleGroup = createProjectsArea(scene);
      expect(scene.children).toContain(titleGroup);
      expect(titleGroup.position.x).toBe(1500);
    });

    it('processes letter physics during updateTitleLetters', () => {
      const titleGroup = createProjectsArea(scene);
      
      // Manually add a mock letter since FontLoader is async
      const mockLetter = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
      mockLetter.userData = {
        velocity: new THREE.Vector3(0, -100, 0),
        rotVel: new THREE.Vector3(0.1, 0.1, 0.1),
        landed: false,
        targetY: -80,
        targetZ: 300,
        targetX: 100
      };
      titleGroup.add(mockLetter);

      const initialY = mockLetter.position.y;
      updateTitleLetters(0.016); // Simulate one frame at 60fps

      expect(mockLetter.position.y).toBeLessThan(initialY);
      expect(mockLetter.rotation.x).not.toBe(0);
    });

    it('stops letter animation and triggers landing state at targetY', () => {
      const titleGroup = createProjectsArea(scene);
      const mockLetter = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
      mockLetter.userData = {
        velocity: new THREE.Vector3(0, -1000, 0),
        rotVel: new THREE.Vector3(0, 0, 0),
        landed: false,
        targetY: -80,
        targetZ: 300,
        targetX: 100
      };
      mockLetter.position.y = -75; // Almost at target
      titleGroup.add(mockLetter);

      updateTitleLetters(0.1); 

      expect(mockLetter.userData.landed).toBe(true);
      expect(mockLetter.position.y).toBe(-80);
    });
  });

  describe('PersonalProject Class', () => {
    const projectData = {
      title: "Test Portfolio",
      description: "A cool 3D site built with Three.js",
      tech: ["Three.js", "Vitest"],
      link: "github.com/user/repo"
    };

    it('creates a group with base, pillar, and screen meshes', () => {
      const project = new PersonalProject(projectData, new THREE.Vector3(0, 0, 0));
      
      // The base and pillar are added immediately. 
      // The screen is added in requestAnimationFrame (which we mocked to run immediately).
      expect(project.group.children.length).toBeGreaterThanOrEqual(3);
    });

    it('correctly uses the wrapText helper to draw on canvas', () => {
      const project = new PersonalProject(projectData, new THREE.Vector3(0, 0, 0));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const fillSpy = vi.spyOn(ctx, 'fillText');

      // Test the helper directly
      project._wrapText(ctx, "This is a very long text that should wrap", 0, 0, 50, 20);

      // Should be called multiple times due to wrapping
      expect(fillSpy.mock.calls.length).toBeGreaterThan(1);
    });

    it('updates its rotation to look at the camera (Billboard behavior)', () => {
      const project = new PersonalProject(projectData, new THREE.Vector3(0, 0, 0));
      const initialRotation = project.group.rotation.y;

      camera.position.set(1000, 0, 1000);
      project.update(camera);

      expect(project.group.rotation.y).not.toBe(initialRotation);
    });
  });
});