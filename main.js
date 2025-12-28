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
// Added setupProjectNavigation import
import { createProjectsArea, PersonalProject, updateTitleLetters, setupProjectNavigation } from './src/projects.js';
import { createLandingPage } from './src/landing.js';

const { createParticles, updateParticles } = Particles;
const { scene, camera, renderer, controls } = initScene();

const cursor = setupCursor(scene, camera, renderer);
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

  if (projectsArea) projectsArea.visible = true;
  if (tunnelGroup) tunnelGroup.visible = true;
  if (experienceArea) experienceArea.visible = true;
  if (skillsArea) skillsArea.visible = true;
});

// ————————————————————————
// WORLD INITIALIZATION
// ————————————————————————
initShootingStars(scene, camera);
initDust(scene, camera);
const player = createPlayer(scene);

const projectsArea = createProjectsArea(scene);
if (projectsArea) projectsArea.visible = false; 

// --- LANDSCAPE OPTIMIZED PROJECT SETUP ---
let billboardProjects = [];
const projectConfigs = [
  { title: "Baseball Team Manager App", description: "iOS app allowing users to schedule games, manage teams, and make data-driven decisions via player stats and analytics.", tech: ["Swift", "Xcode", "MongoDB", "TypeScript", "Firebase"], link: "github.com/josiah1121/baseball-app" },
  { title: "Dynamic Island Ollama Client", description: "macOS app with a custom Dynamic Island widget for sending prompts to a local Llama 3 model via Ollama API.", tech: ["SwiftUI", "Xcode", "Ollama API"], link: "github.com/josiah1121/ollama-dynamic-island" },
  { title: "Alexa Kroger Grocery Skill", description: "Voice-enabled Alexa skill using AWS and Kroger API to add items directly to your shopping cart.", tech: ["Python", "AWS Lambda", "Alexa SDK", "Kroger API"], link: "github.com/josiah1121/alexa-kroger" },
  { title: "Web Scraper & Excel Exporter", description: "Python tool that scrapes web data and exports it to Excel for analysis or automated crawling.", tech: ["Python", "Requests", "BeautifulSoup", "pandas"], link: "github.com/josiah1121/web-scraper" },
  { title: "Arduino Temperature Fan", description: "Proportional control fan on Arduino receiving temperature commands via serial communication.", tech: ["C++", "Arduino IDE", "Visual Studio"], link: "github.com/josiah1121/arduino-fan" }
];

function rebuildProjects() {
  if (!projectsArea) return;
  
  // Clean up existing projects
  billboardProjects.forEach(p => projectsArea.remove(p.mesh || p.group || p)); 
  billboardProjects = [];

  const isLandscape = window.innerWidth > window.innerHeight;
  const isSmallMobile = window.innerHeight < 500;

  // Adaptive Math for Landscape
  const radius = isLandscape ? 1800 : 1500; // Wider radius in landscape
  const zOffset = isLandscape ? 1200 : 1000;
  const angleStep = isLandscape ? Math.PI / 8 : Math.PI / 7;
  const billboardScale = (isLandscape && isSmallMobile) ? 0.75 : 1.0;

  projectConfigs.forEach((config, index) => {
    const angle = (index - Math.floor(projectConfigs.length / 2)) * angleStep;
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius + zOffset;
    
    const proj = new PersonalProject(config, new THREE.Vector3(x, 0, z), billboardScale);
    proj.addTo(projectsArea);
    billboardProjects.push(proj);
  });

  // Re-initialize navigation with the newly built projects
  setupProjectNavigation(camera, controls, billboardProjects);
}

// Initial build
rebuildProjects();

// Handle Orientation/Resize Re-calculation
window.addEventListener('resize', rebuildProjects);

// --- OTHER AREAS ---
const { tunnelGroup, updateNeonTunnel } = createNeonTunnel(scene);
if (tunnelGroup) tunnelGroup.visible = false;

const skillsArea = createSkillsArea(scene);
if (skillsArea) {
  skillsArea.visible = false;
  createSkillsTitle(scene, skillsArea);
}

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
    
    if (skillsArea) {
      updateSkills(camera, cursorMouse);
      updateSkillsTitle(camera, delta);
    }
  }

  renderer.render(scene, camera);
}

animate();