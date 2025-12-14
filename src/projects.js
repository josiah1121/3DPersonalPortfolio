// src/projects.js — FINAL FIX: Stands behind screens → no text occlusion
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

let titleGroup = null;
const fontLoader = new FontLoader();
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/fonts/helvetiker_bold.typeface.json';

export function createProjectsArea(scene) {
  titleGroup = new THREE.Group();
  titleGroup.position.set(1500, 10, -150);
  titleGroup.rotation.y = THREE.MathUtils.degToRad(-30);
  titleGroup.rotation.x = 0;
  scene.add(titleGroup);

  fontLoader.load(fontURL, (font) => {
    const text = "PERSONAL PROJECTS";
    const letters = text.split('');
    const totalWidth = 1500;
    const validCount = letters.filter(c => c !== ' ').length;
    
    const letterSpacingFactor = 0.75;
    const spacing = (totalWidth / (validCount + 1)) * letterSpacingFactor;
    
    let i = 0;
    const forwardOffset = 300;

    letters.forEach(char => {
      if (char === ' ') return;

      const geo = new TextGeometry(char, {
        font,
        size: 48,
        depth: 18,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 5,
        bevelSize: 3,
        bevelSegments: 8
      });

      geo.computeBoundingBox();
      const offset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
      geo.translate(offset, 0, 0);

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2.0,
        metalness: 0.8,
        roughness: 0.1
      });

      const letter = new THREE.Mesh(geo, material);

      letter.position.x = 100 + (-totalWidth / 2 + (i + 1) * spacing);
      letter.position.y = 300 + Math.random() * 250;
      letter.position.z = forwardOffset + (Math.random() - 0.5) * 100;

      letter.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      letter.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          -180 - Math.random() * 180,
          (Math.random() - 0.5) * 80
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        landed: false,
        targetY: -80,
        targetZ: forwardOffset,
        targetX: letter.position.x
      };

      titleGroup.add(letter);
      i++;
    });

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(400, 600, 64),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -79.9;
    glow.position.z = forwardOffset;
    titleGroup.add(glow);
  });

  return titleGroup;
}

export function updateTitleLetters(delta) {
  if (!titleGroup) return;

  titleGroup.children.forEach(obj => {
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
      obj.rotation.set(0, 0, 0);
      u.landed = true;

      obj.material.emissiveIntensity = 4.0;
      new TWEEN.Tween(obj.scale)
        .to({ x: 1.6, y: 1.6, z: 1.6 }, 180)
        .easing(TWEEN.Easing.Elastic.Out)
        .yoyo(true)
        .repeat(1)
        .start()
        .onComplete(() => obj.material.emissiveIntensity = 2.0);
    }
  });
}

// PersonalProject class — Added optional spacing control + increased default gap feel
export class PersonalProject {
  constructor({ title, description, tech = [], link = "" }, pos = new THREE.Vector3(), spacingMultiplier = 1.0) {
    this.group = new THREE.Group();
    this.group.position.copy(pos);

    // You can scale the entire object if needed for denser/looser layouts
    this.group.scale.set(spacingMultiplier, spacingMultiplier, spacingMultiplier);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a1422';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px "Arial Black", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 100);

    ctx.font = '30px Arial';
    this._wrapText(ctx, description, canvas.width / 2, 170, 560, 38);

    if (tech.length) {
      ctx.font = '26px Arial';
      ctx.fillText("Tech: " + tech.join(' • '), canvas.width / 2, 380);
    }

    if (link) {
      ctx.fillStyle = '#88ffaa';
      ctx.font = 'italic 28px Arial';
      ctx.fillText(link, canvas.width / 2, 430);
    }

    requestAnimationFrame(() => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(260, 195),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      );
      screen.position.y = 97.5;
      this.group.add(screen);
    });

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(60, 140, 20),
      new THREE.MeshBasicMaterial({ color: 0x444444 })
    );
    stand.position.y = 30;
    stand.position.z = -15;  // Behind screen
    this.group.add(stand);
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        line = word + ' ';
        cy += lineHeight;
      } else line = test;
    }
    ctx.fillText(line, x, cy);
  }

  addTo(area) {
    area.add(this.group);
    return this;
  }

  update(camera) {
    this.group.lookAt(camera.position);
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
  }
}