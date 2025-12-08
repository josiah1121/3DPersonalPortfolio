import * as THREE from 'three';
import { initScene } from './src/scene.js';
import { setupMouse, createParticles, updateParticles } from './src/particles.js';
import { createPlayer } from './src/player.js';

const { scene, camera, renderer, controls } = initScene();
setupMouse(renderer);
createParticles(scene, "Josiah Clark");

const player = createPlayer(scene);
const clock = new THREE.Clock();   // ← make sure this line exists before animate()

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  controls.update();           // OrbitControls
  updateParticles(camera);     // particle physics
  player.update(delta);        // ← this now actually moves the character

  renderer.render(scene, camera);
}
animate();