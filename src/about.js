// src/about.js — Futuristic About Me area with falling letters and holographic bio panel
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

let aboutGroup = null;
const fontLoader = new FontLoader();
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/fonts/helvetiker_bold.typeface.json';

export function createAboutArea(scene) {
  aboutGroup = new THREE.Group();
  aboutGroup.position.set(-1800, 10, 0); // Left side of space
  aboutGroup.rotation.y = THREE.MathUtils.degToRad(20);
  scene.add(aboutGroup);

  fontLoader.load(fontURL, (font) => {
    const text = "ABOUT ME";
    const letters = text.split('');
    const totalWidth = 1200;
    const validCount = letters.filter(c => c !== ' ').length;
    const spacing = (totalWidth / (validCount + 1)) * 0.75;
    let i = 0;
    const forwardOffset = 200;

    letters.forEach(char => {
      if (char === ' ') return;

      const geo = new TextGeometry(char, {
        font, size: 42, depth: 16, bevelEnabled: true,
        bevelThickness: 4, bevelSize: 2.5, bevelSegments: 8
      });
      geo.computeBoundingBox();
      const offset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
      geo.translate(offset, 0, 0);

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 2.0,
        metalness: 0.8, roughness: 0.1
      });

      const letter = new THREE.Mesh(geo, material);
      letter.position.x = (-totalWidth / 2 + (i + 1) * spacing);
      letter.position.y = 300 + Math.random() * 200;
      letter.position.z = forwardOffset + (Math.random() - 0.5) * 80;
      letter.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

      letter.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * 80, -160 - Math.random() * 160, (Math.random() - 0.5) * 80),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
        landed: false, targetY: -60, targetZ: forwardOffset, targetX: letter.position.x
      };

      aboutGroup.add(letter);
      i++;
    });

    // Glow ring
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(300, 500, 64),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -59.9;
    glow.position.z = forwardOffset;
    aboutGroup.add(glow);
  });

  // Bio panel (reuse PersonalProject style but larger text)
  const bioCanvas = document.createElement('canvas');
  bioCanvas.width = 1408;
  bioCanvas.height = 1056;
  const ctx = bioCanvas.getContext('2d');

  ctx.fillStyle = 'rgba(8, 15, 35, 0.85)';
  ctx.fillRect(0, 0, bioCanvas.width, bioCanvas.height);

  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 20;
  ctx.strokeRect(45, 45, bioCanvas.width - 90, bioCanvas.height - 90);
  ctx.lineWidth = 12;
  ctx.strokeRect(70, 70, bioCanvas.width - 140, bioCanvas.height - 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px "Arial Black", Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.fillText("Josiah Clark", bioCanvas.width / 2, 200);

  ctx.font = '56px Arial';
  ctx.fillStyle = '#aaffff';
  ctx.shadowBlur = 18;
  const bioLines = [
    "Software Engineer II (DevOps) @ Collins Aerospace",
    "B.S. Computer Science • Campbellsville University '23",
    "Former Raytheon • Active Secret Clearance",
    "Passionate about iOS, AWS, AI, and 3D Web Experiences"
  ];
  bioLines.forEach((line, i) => {
    ctx.fillText(line, bioCanvas.width / 2, 380 + i * 90);
  });

  ctx.shadowBlur = 0;

  requestAnimationFrame(() => {
    const tex = new THREE.CanvasTexture(bioCanvas);
    tex.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(570, 427.5), material);
    panel.position.set(0, 250, 0);
    aboutGroup.add(panel);

    const glowBack = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 457.5),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })
    );
    glowBack.position.set(0, 250, -12);
    aboutGroup.add(glowBack);

    // Short pillar + base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(90, 120, 25, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    base.position.y = -10;
    aboutGroup.add(base);

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(40, 80, 40),
      new THREE.MeshBasicMaterial({ color: 0x0f1a33 })
    );
    pillar.position.y = 30;
    pillar.position.z = 12;
    aboutGroup.add(pillar);
  });

  return aboutGroup;
}

export function updateAboutLetters(delta) {
  if (!aboutGroup) return;
  aboutGroup.children.forEach(obj => {
    if (!obj.userData.velocity) return;
    const u = obj.userData;
    if (u.landed) return;

    u.velocity.y -= 1600 * delta;
    obj.position.addScaledVector(u.velocity, delta);
    obj.rotation.x += u.rotVel.x;
    obj.rotation.y += u.rotVel.y;
    obj.rotation.z += u.rotVel.z;

    if (obj.position.y <= u.targetY) {
      obj.position.y = u.targetY;
      obj.position.z = u.targetZ;
      obj.position.x = u.targetX;
      obj.rotation.set(THREE.MathUtils.degToRad(-12), 0, 0);
      u.landed = true;
      obj.material.emissiveIntensity = 4.0;
      new TWEEN.Tween(obj.scale).to({ x: 1.6, y: 1.6, z: 1.6 }, 180)
        .easing(TWEEN.Easing.Elastic.Out).yoyo(true).repeat(1).start()
        .onComplete(() => obj.material.emissiveIntensity = 2.0);
    }
  });
}