// scene.js — Perfect cinematic view, infinite ground + fog
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);

  // Beautiful subtle fog — keeps the infinite feel
  scene.fog = new THREE.FogExp2(0x000011, 0.00025);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  // far enough for the huge ground
  );

  // This is the magic position — exactly what your screenshot uses
  camera.position.set(0, 550, 1600);   // low and close-ish → makes text feel massive

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;

  // Look straight at the base of the text on the horizon
  controls.target.set(0, -70, -500);
  controls.update();

  // Bonus: one-key recenter if you ever move the text
  window.recenterCameraOnText = () => {
    if (window.particleTextCenter) {
      controls.target.copy(window.particleTextCenter);
      controls.target.y = -70; // keep it looking at the base
      controls.update();
    }
  };

  // Infinite ground — same look as before, just way bigger
  const groundGeometry = new THREE.PlaneGeometry(30000, 30000);
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x112233,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
    fog: true
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -80;
  scene.add(ground);

  // Matching infinite grid
  const gridHelper = new THREE.GridHelper(30000, 150, 0x223344, 0x112233);
  gridHelper.position.y = -79.9;
  scene.add(gridHelper);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}