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
  );

  // Magic position for cinematic feel
  camera.position.set(0, 550, 1600);

  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance" // Hint for mobile devices with dual GPUs
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // MOBILE FIX: Cap pixel ratio. 3x+ on mobile will cause significant lag.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  
  // MOBILE FIX: Adjust rotation speed for touch inputs
  // Touch gestures cover less physical distance than a mouse move
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  controls.rotateSpeed = isTouch ? 0.5 : 0.7; 
  
  // Prevent the camera from going below the ground plane on mobile/desktop
  controls.maxPolarAngle = Math.PI / 2; 

  // Look straight at the base of the text on the horizon
  controls.target.set(0, -70, -500);
  controls.update();

  // Recenter handler
  window.recenterCameraOnText = () => {
    if (window.particleTextCenter) {
      controls.target.copy(window.particleTextCenter);
      controls.target.y = -70;
      controls.update();
    }
  };

  // Infinite ground
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
    
    // Re-verify pixel ratio on resize/orientation change
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  return { scene, camera, renderer, controls };
}