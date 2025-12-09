// scene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000); // increased far plane
  // Better starting position for ground-placed, tilted text
  camera.position.set(0, 350, 960);  // higher and farther back

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.6;

  // Make OrbitControls look at the center of the text (on the ground)
  // This matches the groundY = -80 we used in particles.js
  controls.target.set(0, -35, 0);    // already correct thanks to auto-centering
  controls.update();
  
  // Keep the recenter function in case you regenerate text later
  window.recenterCameraOnText = () => {
    if (window.particleTextCenter) {
      controls.target.copy(window.particleTextCenter);
      controls.update();
    }
  };

  // Optional: add a subtle ground plane so the text visibly sits on something
  const groundGeometry = new THREE.PlaneGeometry(3000, 3000);
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x112233,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // lay flat on XZ plane
  ground.position.y = -80;          // same level as the text base
  scene.add(ground);

  // Optional: faint grid helper for extra spatial reference (remove if you don't like it)
  const gridHelper = new THREE.GridHelper(2000, 50, 0x223344, 0x112233);
  gridHelper.position.y = -80;
  scene.add(gridHelper);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}