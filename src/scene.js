// scene.js — Updated for a further back desktop FOV

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Fog density remains low for visibility at distance
    scene.fog = new THREE.FogExp2(0x000011, 0.0001);

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        30000 
    );

    // Initial position (will be overridden by the resize handler immediately)
    camera.position.set(0, 650, 2200);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    controls.rotateSpeed = isTouch ? 0.5 : 0.7;
    controls.maxPolarAngle = Math.PI / 2;

    controls.target.set(0, -70, -500);
    controls.update();

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
    const gridHelper = new THREE.GridHelper(30000, 150, 0x334455, 0x112233);
    gridHelper.position.y = -79.9;
    scene.add(gridHelper);

    // Resize handler
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;

        camera.aspect = width / height;

        // MOBILE PORTRAIT
        if (!isLandscape && isTouch) {
            camera.fov = 80;
            camera.position.set(0, 1200, 4500);
        }
        // MOBILE LANDSCAPE
        else if (isLandscape && height < 500) {
            camera.fov = 50;
            camera.position.set(0, 400, 2000);
        }
        // DESKTOP VIEW - UPDATED
        else {
            // Lower FOV (45) + Higher Z (2200) creates a "pulled back" feel 
            // without edge distortion.
            camera.fov = isLandscape ? 45 : 55;
            camera.position.set(0, 650, 2200);
        }

        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    // Execute on load to apply the desktop/mobile positions immediately
    window.dispatchEvent(new Event('resize'));

    return { scene, camera, renderer, controls };
}