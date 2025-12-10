// src/projects.js
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

let titleGroup = null;
const fontLoader = new FontLoader();
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/fonts/helvetiker_bold.typeface.json';

export function createProjectsArea(scene) {
  titleGroup = new THREE.Group();
  // In front and slightly right of your name
  titleGroup.position.set(420, 10, 400);
  scene.add(titleGroup);

  fontLoader.load(fontURL, (font) => {
    const text = "PERSONAL PROJECTS";
    const letters = text.split('');
    const totalWidth = 1000;
    const validCount = letters.filter(c => c !== ' ').length;
    const spacing = totalWidth / (validCount + 1);
    let index = 0;

    letters.forEach(char => {
      if (char === ' ') return;

      const geo = new TextGeometry(char, {
        font: font,
        size: 45,
        depth: 16,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 4,
        bevelSize: 2.5,
        bevelSegments: 6
      });

      geo.computeBoundingBox();
      const offset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
      geo.translate(offset, 0, 0);

      const hue = index / validCount;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6);

      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5,
        metalness: 0.9,
        roughness: 0.15
      });

      const letter = new THREE.Mesh(geo, material);

      letter.position.x = -totalWidth / 2 + (index + 1) * spacing;
      letter.position.y = 300 + Math.random() * 250;
      letter.position.z = (Math.random() - 0.5) * 100;

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
        targetY: -80
      };

      titleGroup.add(letter);
      index++;
    });

    // Soft glow under the text
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(400, 600, 64),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -79.9;
    titleGroup.add(glow);
  });

  return titleGroup;
}

export function updateTitleLetters(delta) {
  if (!titleGroup) return;

  titleGroup.children.forEach(obj => {
    if (!obj.userData.velocity) return; // skip glow ring

    const u = obj.userData;
    if (u.landed) return;

    u.velocity.y -= 1600 * delta;

    obj.position.addScaledVector(u.velocity, delta);
    obj.rotation.x += u.rotVel.x;
    obj.rotation.y += u.rotVel.y;
    obj.rotation.z += u.rotVel.z;

    if (obj.position.y <= u.targetY) {
      obj.position.y = u.targetY;
      obj.rotation.set(0, 0, 0);
      u.landed = true;

      obj.material.emissiveIntensity = 3.0;

      new TWEEN.Tween(obj.scale)
        .to({ x: 1.6, y: 1.6, z: 1.6 }, 180)
        .easing(TWEEN.Easing.Elastic.Out)
        .yoyo(true)
        .repeat(1)
        .start()
        .onComplete(() => obj.material.emissiveIntensity = 1.5);
    }
  });
}

// Fixed PersonalProject class — no more undefined error
export class PersonalProject {
  constructor({ title, description, tech = [], link = "" }, pos = new THREE.Vector3()) {
    this.group = new THREE.Group();
    this.group.position.copy(pos);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 480);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 624, 464);
    ctx.fillStyle = '#0a1422';
    ctx.fillRect(30, 30, 580, 420);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 320, 90);

    ctx.fillStyle = '#eeeeee';
    ctx.font = '26px Arial';
    this._wrapText(ctx, description, 320, 150, 560, 36);

    if (tech.length) {
      ctx.fillStyle = '#00ffaa';
      ctx.font = '24px Arial';
      ctx.fillText("Tech: " + tech.join(' • '), 320, 380);
    }
    if (link) {
      ctx.fillStyle = '#ffff66';
      ctx.font = 'italic 26px Arial';
      ctx.fillText(link, 320, 430);
    }

    requestAnimationFrame(() => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 180),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      );
      screen.position.y = 10;
      this.group.add(screen);
    });

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(80, 110, 30),
      new THREE.MeshBasicMaterial({ color: 0x888888 })
    );
    stand.position.y = 35;
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
    // Fixed: use this.group, not this.rotation
    this.group.lookAt(camera.position);
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
  }
}