// src/loadModel.js — Simple GLTF loader helper
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function loadModel(path, position = new THREE.Vector3(), scale = 1, rotation = new THREE.Euler()) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.scale.setScalar(scale);
        model.rotation.copy(rotation);
        
        // Optional: make it glow a little
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.material) {
              child.material = child.material.clone();
              child.material.emissive = new THREE.Color(0x223355);
              child.material.emissiveIntensity = 0.3;
            }
          }
        });

        resolve(model);
      },
      undefined,
      (err) => {
        console.error('Failed to load model:', path, err);
        reject(err);
      }
    );
  });
}