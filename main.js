// main.js (only the parts that changed are commented)

import * as THREE from 'three';
import { initScene } from './src/scene.js';
import Particles from './src/particles.js';
import { setupCursor } from './src/cursor.js';        // ← already there
import { createPlayer } from './src/player.js';

const { setupMouse, createParticles, updateParticles } = Particles;

const { scene, camera, renderer, controls } = initScene();

setupMouse(renderer);

// ← Now setupCursor returns both update and activate
const cursor = setupCursor(scene, camera, renderer);

createParticles(scene, "Josiah Clark", {
  onComplete: () => {
    console.log("✨ Particle text fully formed!");

    // ← ACTIVATE THE MINIMAL CURSOR ONLY AFTER TEXT IS READY
    cursor.activate();

    // Optional: you can now safely enable controls if you want
    // controls.enabled = true;
  }
});

const player = createPlayer(scene);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  controls.update();
  updateParticles(camera);
  player.update(delta);

  // This will do nothing until activate() is called
  cursor.update();

  renderer.render(scene, camera);
}

animate();