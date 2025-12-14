// src/projects.js — All billboards uniform size (large enough for longest content)
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

let titleGroup = null;
const fontLoader = new FontLoader();
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/fonts/helvetiker_bold.typeface.json';

export function createProjectsArea(scene) {
  // ... (title code unchanged)
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
  // unchanged
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
      
      obj.rotation.set(THREE.MathUtils.degToRad(-12), 0, 0);
      
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

export class PersonalProject {
  constructor({ title, description, tech = [], link = "" }, pos = new THREE.Vector3(), spacingMultiplier = 1.0) {
    this.group = new THREE.Group();
    this.group.position.copy(pos);
    this.group.scale.set(spacingMultiplier, spacingMultiplier, spacingMultiplier);

    // Uniform large canvas — fits even the longest project perfectly
    const canvas = document.createElement('canvas');
    canvas.width = 1408;
    canvas.height = 1056;
    const ctx = canvas.getContext('2d');

    // Dark holographic background
    ctx.fillStyle = 'rgba(8, 15, 35, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle scanlines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Neon cyan borders
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 20;
    ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);
    ctx.lineWidth = 12;
    ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

    // Title — large and bold
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 104px "Arial Black", Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    this._wrapText(ctx, title, canvas.width / 2, 170, 1240, 120);

    // Description
    ctx.font = '54px Arial';
    ctx.fillStyle = '#aaffff';
    ctx.shadowBlur = 18;
    this._wrapText(ctx, description, canvas.width / 2, 330, 1240, 78);

    // Tech stack
    if (tech.length) {
      ctx.font = '50px Arial';
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 20;
      this._wrapText(ctx, "Tech: " + tech.join(' • '), canvas.width / 2, 700, 1240, 68);
    }

    // GitHub link
    if (link) {
      ctx.fillStyle = '#aaffaa';
      ctx.font = 'italic 52px Arial';
      ctx.shadowBlur = 20;
      this._wrapText(ctx, link, canvas.width / 2, 880, 1240, 68);
    }

    ctx.shadowBlur = 0;

    requestAnimationFrame(() => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;

      const screenMaterial = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(570, 427.5),  // Uniform large size
        screenMaterial
      );
      screen.position.y = 250;
      this.group.add(screen);

      const glowBack = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 457.5),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending
        })
      );
      glowBack.position.y = 250;
      glowBack.position.z = -12;
      this.group.add(glowBack);
    });

    // Glowing base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(90, 120, 25, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      })
    );
    base.position.y = -10;
    this.group.add(base);

    // Short center pillar
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(40, 80, 40),
      new THREE.MeshBasicMaterial({ color: 0x0f1a33 })
    );
    pillar.position.y = 30;
    pillar.position.z = 12;
    this.group.add(pillar);
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cy = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, cy);
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