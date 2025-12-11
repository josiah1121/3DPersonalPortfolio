// main.js
import * as THREE from 'three';
import { initScene } from './src/scene.js';
import { initShootingStars, updateShootingStars } from './src/stars.js';
import Particles from './src/particles.js';
import { setupCursor } from './src/cursor.js';
import { createPlayer } from './src/player.js';
import { 
  createProjectsArea, 
  PersonalProject, 
  updateTitleLetters 
} from './src/projects.js';

// Correct import — works 100%
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

const {createParticles, updateParticles } = Particles;

const { scene, camera, renderer, controls } = initScene();


const cursor = setupCursor(scene, camera, renderer);

createParticles(scene, "Josiah Clark", {
  onComplete: () => {
    console.log("Particle text fully formed!");
    cursor.activate();
  }
});

initShootingStars(scene, camera);

const player = createPlayer(scene);

// ————————————————————————
// PERSONAL PROJECTS AREA (with falling letters)
// ————————————————————————
const projectsArea = createProjectsArea(scene);

const billboardProjects = [];

function addProject(config, position = new THREE.Vector3()) {
  const proj = new PersonalProject(config, position);
  proj.addTo(projectsArea);
  billboardProjects.push(proj);
}

addProject({
  title: "Neural Music Generator",
  description: "Real-time AI music composition in the browser using WebGPU and a custom RNN.",
  tech: ["TypeScript", "WebGPU", "TensorFlow.js"],
  link: "github.com/josiahclark/neural-music"
}, new THREE.Vector3(-200, 0, 0));

addProject({
  title: "This 3D Portfolio",
  description: "The exact site you're looking at — particle text, falling titles, custom cursor.",
  tech: ["Three.js", "Vite", "CanvasTexture"],
  link: "github.com/josiahclark/3d-portfolio"
}, new THREE.Vector3(0, 0, 0));

addProject({
  title: "Ray Marching Engine",
  description: "144+ fps SDF renderer written from scratch in WebGL2 + Rust/WASM.",
  tech: ["WebGL2", "GLSL", "Rust", "WASM"],
  link: "github.com/josiahclark/ray-marcher"
}, new THREE.Vector3(200, 0, 0, 0));

// ————————————————————————
// ANIMATION LOOP
// ————————————————————————
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  controls.update();
  updateParticles(camera);
  player.update(delta);
  cursor.update();
  updateShootingStars();

  // Falling letters physics + bounce
  updateTitleLetters(delta);
  TWEEN.update();

  // Billboard project screens
  billboardProjects.forEach(p => p.update(camera));

  renderer.render(scene, camera);
}

animate();