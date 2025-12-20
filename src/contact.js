// src/contact.js — Interactive contact console
import * as THREE from 'three';

let contactGroup = null;

export function createContactArea(scene) {
  contactGroup = new THREE.Group();
  contactGroup.position.set(0, 10, 2000); // Front area
  scene.add(contactGroup);

  const canvas = document.createElement('canvas');
  canvas.width = 1408;
  canvas.height = 1056;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(8, 15, 35, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 20;
  ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 120px "Arial Black"';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 40;
  ctx.fillText("CONNECT", canvas.width / 2, 200);

  ctx.font = '60px Arial';
  ctx.fillStyle = '#aaffff';
  ctx.shadowBlur = 20;
  ctx.fillText("josiah1121@gmail.com", canvas.width / 2, 400);
  ctx.fillText("github.com/josiah1121", canvas.width / 2, 520);
  ctx.fillText("linkedin.com/in/josiahclark", canvas.width / 2, 640);
  ctx.fillText("Resume PDF ↓", canvas.width / 2, 800);

  ctx.shadowBlur = 0;

  requestAnimationFrame(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(570, 427.5), mat);
    panel.position.y = 250;
    contactGroup.add(panel);

    // Glow + stand
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 457.5),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
    );
    glow.position.y = 250;
    glow.position.z = -12;
    contactGroup.add(glow);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(90, 120, 25, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    base.position.y = -10;
    contactGroup.add(base);

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(40, 80, 40),
      new THREE.MeshBasicMaterial({ color: 0x0f1a33 })
    );
    pillar.position.y = 30;
    pillar.position.z = 12;
    contactGroup.add(pillar);
  });

  return contactGroup;
}