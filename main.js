// main.js
import * as THREE from 'three';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

// Imports
import { mouse as cursorMouse } from './src/cursor.js';
import { initScene } from './src/scene.js';
import { initShootingStars, updateShootingStars } from './src/stars.js';
import Particles from './src/particles.js';
import { createGlowText, updateGlowText } from './src/glowText.js';
import { setupCursor } from './src/cursor.js';
import { createPlayer } from './src/player.js';
import { initDust, updateDust } from './src/dust.js';
import { 
  createExperienceArea, 
  updateExperience,
  handlePointerDown as expHandlePointerDown,
  handlePointerUp as expHandlePointerUp
} from './src/experience.js';
import { createSkillsArea, updateSkills, setOrbitControls, setInfoCard } from './src/skills.js';
import { createSkillsTitle, updateSkillsTitle } from './src/skillsTitle.js';
import { createExperienceTitle, updateExperienceTitle } from './src/experienceTitle.js';
import { createNeonTunnel } from './src/neonTunnel.js';
import { createProjectsArea, PersonalProject, updateTitleLetters } from './src/projects.js';
import { createLandingPage } from './src/landing.js';

const { createParticles, updateParticles } = Particles;
const { scene, camera, renderer, controls } = initScene();

// 1. Setup Cursor
const cursor = setupCursor(scene, camera, renderer);

// --- MODIFICATION: ACTIVATE IMMEDIATELY ---
cursor.activate();
window.isStarted = false; 

// ————————————————————————
// INITIAL LANDING SETUP
// ————————————————————————
const landing = createLandingPage(scene, camera, () => {
  window.isStarted = true; 
  
  document.body.style.cursor = 'none';
  
  createParticles(scene, "Josiah Clark", {
    onComplete: () => {
      setTimeout(() => createGlowText(scene), 500);
    }
  });

  // Reveal the world - with safety checks
  if (projectsArea) projectsArea.visible = true;
  if (tunnelGroup) tunnelGroup.visible = true;
  if (experienceArea) experienceArea.visible = true;
  if (skillsArea) skillsArea.visible = true;
});

// ————————————————————————
// WORLD INITIALIZATION (Initially Hidden)
// ————————————————————————
initShootingStars(scene, camera);
initDust(scene, camera);
const player = createPlayer(scene);

const projectsArea = createProjectsArea(scene);
if (projectsArea) projectsArea.visible = false; 

const billboardProjects = [];
const radius = 1500;
const height = 0;
const zOffset = 1000;
const numProjects = 5;
const angleStep = Math.PI / (numProjects + 2);

function addProject(config, index) {
  if (!projectsArea) return; // Prevent crash if projectsArea failed
  const angle = (index - Math.floor(numProjects / 2)) * angleStep;
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius + zOffset;
  const position = new THREE.Vector3(x, height, z);
  const proj = new PersonalProject(config, position, 1.0);
  proj.addTo(projectsArea);
  billboardProjects.push(proj);
}

// Project Definitions
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
}, 2);
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

const { tunnelGroup, updateNeonTunnel } = createNeonTunnel(scene);
if (tunnelGroup) tunnelGroup.visible = false;

// Initialize Skills with Safety
const skillsArea = createSkillsArea(scene);
if (skillsArea) {
  skillsArea.visible = false;
  createSkillsTitle(scene, skillsArea);
}

// Initialize Experience with Safety
const experienceResults = createExperienceArea(scene, camera); 
const experienceArea = experienceResults ? experienceResults.group : null;
if (experienceArea) {
  experienceArea.visible = false;
  createExperienceTitle(scene);
}

if (experienceResults && experienceResults.infoCard) {
  setInfoCard(experienceResults.infoCard);
}

setOrbitControls(controls);

// ————————————————————————
// EVENT LISTENERS
// ————————————————————————
window.addEventListener('pointerdown', (e) => {
  if (window.isStarted) expHandlePointerDown(e, camera);
});
window.addEventListener('pointerup', (e) => {
  if (window.isStarted) expHandlePointerUp(e, camera);
});

// ————————————————————————
// MAIN ANIMATION LOOP
// ————————————————————————
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  TWEEN.update();
  controls.update();
  cursor.update();

  if (!window.isStarted) {
    landing.update(elapsed);
  } else {
    updateParticles(camera);
    updateGlowText(camera);
    updateNeonTunnel(elapsed);
    player.update(delta);
    updateDust();
    updateShootingStars();
    updateTitleLetters(delta);

    billboardProjects.forEach(p => p.update(camera));
    updateExperienceTitle(camera);
    updateExperience(camera, cursorMouse);
    
    if (experienceResults && experienceResults.infoCard) {
      experienceResults.infoCard.update();
    }
    
    // Skills update safety
    if (skillsArea) {
      updateSkills(camera, cursorMouse);
      updateSkillsTitle(camera, delta);
    }
  }

  renderer.render(scene, camera);
}

animate();