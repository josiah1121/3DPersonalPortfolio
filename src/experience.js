// src/experience.js — Experience timeline with two holographic cards
import * as THREE from 'three';

let expGroup = null;

export function createExperienceArea(scene) {
  expGroup = new THREE.Group();
  expGroup.position.set(0, 10, -2200); // Back area
  expGroup.rotation.y = THREE.MathUtils.degToRad(0);
  scene.add(expGroup);

  const jobs = [
    {
      title: "Collins Aerospace",
      role: "Software Engineer II (DevOps)",
      date: "Apr 2025 – Present",
      desc: "• Implementing new DevOps infrastructure for CI/CD pipelines\n• Maintaining and optimizing existing systems\n• Enhancing efficiency and scalability",
      location: "St. Petersburg, FL"
    },
    {
      title: "Raytheon Technologies",
      role: "Software Engineer I",
      date: "Aug 2023 – Apr 2025",
      desc: "• Supported codebase testing with complex systems\n• Interfaced via multiple communication protocols\n• Utilized Objective-C for complex problem solving",
      location: "Tucson, AZ"
    }
  ];

  jobs.forEach((job, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1408;
    canvas.height = 1056;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(8, 15, 35, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 20;
    ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);
    ctx.lineWidth = 12;
    ctx.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 90px "Arial Black"';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 25;
    ctx.fillText(job.title, canvas.width / 2, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = '60px Arial';
    ctx.fillText(job.role, canvas.width / 2, 260);

    ctx.font = '48px Arial';
    ctx.fillStyle = '#88ffff';
    ctx.fillText(job.date + " • " + job.location, canvas.width / 2, 340);

    ctx.font = '48px Arial';
    ctx.fillStyle = '#aaffff';
    ctx.shadowBlur = 15;
    const lines = job.desc.split('\n');
    lines.forEach((line, j) => ctx.fillText(line, canvas.width / 2, 460 + j * 80));

    ctx.shadowBlur = 0;

    requestAnimationFrame(() => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
      });
      const card = new THREE.Mesh(new THREE.PlaneGeometry(570, 427.5), mat);
      card.position.set((i - 0.5) * 700, 250, 0);
      expGroup.add(card);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 457.5),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })
      );
      glow.position.copy(card.position);
      glow.position.z = -12;
      expGroup.add(glow);

      // Base + pillar
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(90, 120, 25, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
      );
      base.position.set(card.position.x, -10, card.position.z);
      expGroup.add(base);

      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(40, 80, 40),
        new THREE.MeshBasicMaterial({ color: 0x0f1a33 })
      );
      pillar.position.set(card.position.x, 30, card.position.z + 12);
      expGroup.add(pillar);
    });
  });

  return expGroup;
}