// main.js — Very tight and close arc around PERSONAL PROJECTS title
import * as THREE from 'three';
import { initScene } from './src/scene.js';
import { initShootingStars, updateShootingStars } from './src/stars.js';
import Particles from './src/particles.js';
import { setupCursor } from './src/cursor.js';
import { createPlayer } from './src/player.js';
import { initDust, updateDust } from './src/dust.js';
import { createAboutArea, updateAboutLetters } from './src/about.js';
import { createExperienceArea } from './src/experience.js';
import { createSkillsArea, updateSkills } from './src/skills.js';
import { createContactArea } from './src/contact.js';

import { 
  createProjectsArea, 
  PersonalProject, 
  updateTitleLetters 
} from './src/projects.js';

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
initDust(scene, camera);
const player = createPlayer(scene);

// ————————————————————————
// PERSONAL PROJECTS AUTHOR (with falling letters)
// ————————————————————————
const projectsArea = createProjectsArea(scene);

const billboardProjects = [];

// Extremely tight and close arc
const radius = 1500;           // Very small radius → tight grouping
const height = 0;
const zOffset = 1000;         // Strongly negative → much closer to title/camera
const numProjects = 5;
const angleStep = Math.PI / (numProjects + 2); // Tighter angular spread for compact feel

function addProject(config, index) {
  const angle = (index - Math.floor(numProjects / 2)) * angleStep;

  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius + zOffset;  // Upside-down U, pulled close

  const position = new THREE.Vector3(x, height, z);

  const proj = new PersonalProject(config, position, 1.0); // Uniform size
  proj.addTo(projectsArea);
  billboardProjects.push(proj);
}

// Your 5 projects — now tightly clustered in front of the title
addProject({
  title: "Baseball Team Manager App",
  description: "iOS app allowing users to schedule games, manage teams, and make data-driven decisions via player stats and analytics.",
  tech: ["Swift", "Xcode", "MongoDB", "TypeScript", "Firebase"],
  link: "github.com/josiah1121/baseball-app"
}, 0);

addProject({
  title: "Dynamic Island Ollama Client",
  description: "macOS app with a custom Dynamic Island widget for sending prompts to a local Llama 3 model via Ollama API.",
  tech: ["SwiftUI", "Xcode", "Ollama API"],
  link: "github.com/josiah1121/ollama-dynamic-island"
}, 1);

addProject({
  title: "Alexa Kroger Grocery Skill",
  description: "Voice-enabled Alexa skill using AWS and Kroger API to add items directly to your shopping cart.",
  tech: ["Python", "AWS Lambda", "Alexa SDK", "Kroger API"],
  link: "github.com/josiah1121/alexa-kroger"
}, 2); // Center

addProject({
  title: "Web Scraper & Excel Exporter",
  description: "Python tool that scrapes web data and exports it to Excel for analysis or automated crawling.",
  tech: ["Python", "Requests", "BeautifulSoup", "pandas"],
  link: "github.com/josiah1121/web-scraper"
}, 3);

addProject({
  title: "Arduino Temperature Fan",
  description: "Proportional control fan on Arduino receiving temperature commands via serial communication.",
  tech: ["C++", "Arduino IDE", "Visual Studio"],
  link: "github.com/josiah1121/arduino-fan"
}, 4);

//const aboutArea = createAboutArea(scene);
//const experienceArea = createExperienceArea(scene);
const skillsArea = createSkillsArea(scene);
//const contactArea = createContactArea(scene);

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
  updateDust();
  updateShootingStars();

  updateTitleLetters(delta);
  TWEEN.update();

  billboardProjects.forEach(p => p.update(camera));

  renderer.render(scene, camera);

  //updateAboutLetters(delta);
  // Add these after your other const declarations
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(); // We'll sync this with cursor's mouse

  // Listen for mouse move to keep our local mouse in sync
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });
  updateSkills(camera, mouse, raycaster);
}

animate();