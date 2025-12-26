// src/experience.js — Precision Hitboxes & High-Vibrancy
import * as THREE from 'three';
import { createInfoCard } from './components/infoCard.js';

let expGroup = null;
let billboardOrbs = [];
let raycaster = new THREE.Raycaster();
let currentDimLevel = 1.0;
let sceneRef = null;
let infoCard = null;

// Click handling state
let isMouseDown = false;
let mouseDownPos = new THREE.Vector2();

export function createExperienceArea(scene, camera) {
  sceneRef = scene;

  // Create the info card (pass scene and camera)
  infoCard = createInfoCard(scene, camera);

  expGroup = new THREE.Group();
  billboardOrbs = [];

  expGroup.position.set(0, 200, -3000);
  scene.add(expGroup);

  const jobs = [
    { 
      title: "Collins Aerospace", 
      years: "2025 – Present", 
      color: 0x0088ff,
      description: "Leading advanced avionics software development and platform engineering for next-generation aerospace systems. Driving DevOps transformation by architecting automated CI/CD pipelines for mission-critical embedded code, ensuring secure, high-reliability deployments through Infrastructure as Code."
    },
    { 
      title: "Raytheon Technologies", 
      years: "2023 – 2025", 
      color: 0x0088ff,
      description: "Engineered mission-critical Hardware-in-the-Loop (HIL) simulation environments to validate missile flight software and electrical components. Developed sophisticated software interfaces to bridge real-time simulations with physical hardware manifolds, allowing for high-fidelity testing of electrical systems and flight logic against simulated high-dynamic environments."
    }
    // Add more jobs with .description as needed
  ];

  const timelineHeight = 800;
  const nodeSpacing = timelineHeight / (jobs.length + 3);

  const spineGeo = new THREE.CylinderGeometry(10, 10, timelineHeight * 1.3, 16, 1, true);
  const spineMat = new THREE.MeshBasicMaterial({
    color: 0x003366,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.y = timelineHeight / 2 - nodeSpacing;
  expGroup.add(spine);

  jobs.forEach((job, i) => {
    const yPos = timelineHeight - (i + 1) * nodeSpacing;
    const direction = i % 2 === 0 ? -1 : 1;
    const lineEnd = new THREE.Vector3(direction * 650, yPos, 0);

    const lineCurve = new THREE.LineCurve3(new THREE.Vector3(0, yPos, 0), lineEnd);
    const lineTubeGeo = new THREE.TubeGeometry(lineCurve, 32, 8, 8, false);
    const lineMat = new THREE.MeshBasicMaterial({
      color: job.color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const lineMesh = new THREE.Mesh(lineTubeGeo, lineMat);
    expGroup.add(lineMesh);

    const orbGroup = new THREE.Group();
    orbGroup.position.copy(lineEnd);
    orbGroup.userData.job = job;
    orbGroup.userData.connectorLine = lineMesh;

    // Precision hitbox (invisible)
    const hitbox = new THREE.Mesh(
      new THREE.CircleGeometry(150, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    orbGroup.add(hitbox);

    // === PARTICLE ORB ===
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    for (let j = 0; j < particleCount; j++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      positions[j*3] = 120 * Math.sin(phi) * Math.cos(theta);
      positions[j*3+1] = 120 * Math.sin(phi) * Math.sin(theta);
      positions[j*3+2] = 120 * Math.cos(phi);

      const angle = 0.5 + Math.random() * 5.3;
      targets[j*3] = Math.cos(angle) * 280;
      targets[j*3+1] = Math.sin(angle) * 280;
      targets[j*3+2] = (Math.random() - 0.5) * 50;
      phases[j] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const partMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flow: { value: 0 },
        color: { value: new THREE.Color(job.color) }
      },
      vertexShader: `
        attribute vec3 targetPosition;
        attribute float phase;
        uniform float time;
        uniform float flow;
        void main() {
          vec3 idlePos = position;
          float pStr = 1.0 - flow;
          if (pStr > 0.01) {
            vec3 norm = normalize(position);
            float waveA = sin(time * 2.0 + (position.y * 0.03)) * 15.0;
            float waveB = cos(time * 3.5 + (position.x * 0.02)) * 8.0;
            float tension = pow(abs(sin(time * 1.5 + norm.y * 5.0)), 3.0);
            idlePos += norm * (waveA + waveB) * tension * pStr;
            float stretchX = 1.0 + sin(time * 2.5) * 0.2 * pStr;
            float stretchY = 1.0 + cos(time * 2.0) * 0.15 * pStr;
            idlePos.x *= stretchX;
            idlePos.y *= stretchY;
            idlePos.xy += vec2(sin(time + phase), cos(time + phase)) * 6.0 * pStr;
          }
          vec3 pos = mix(idlePos, targetPosition, flow);
          if(flow > 0.1) {
             float r = length(pos.xy);
             float ang = atan(pos.y, pos.x) + time * 2.2;
             pos.x = cos(ang) * r;
             pos.y = sin(ang) * r;
          }
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 8.5 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, dist);
          gl_FragColor = vec4(color, alpha * 0.95);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, partMat);
    orbGroup.add(points);

    // === LIGHTNING BOLT ===
    const boltCount = 1800;
    const boltGeo = new THREE.BufferGeometry();
    const boltPositions = new Float32Array(boltCount * 3);
    const boltPath = [
      new THREE.Vector3(18, 50, 0),
      new THREE.Vector3(-18, 5, 0),
      new THREE.Vector3(12, 5, 0),
      new THREE.Vector3(-12, -50, 0)
    ];

    for (let j = 0; j < boltCount; j++) {
      const segment = Math.floor(Math.random() * (boltPath.length - 1));
      const t = Math.random();
      const v = new THREE.Vector3().lerpVectors(boltPath[segment], boltPath[segment+1], t);
      boltPositions[j*3] = v.x + (Math.random() - 0.5) * 10.0;
      boltPositions[j*3+1] = v.y + (Math.random() - 0.5) * 3.0;
      boltPositions[j*3+2] = v.z + (Math.random() - 0.5) * 5.0;
    }
    boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPositions, 3));

    const boltMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 5.0,
      transparent: true,
      opacity: 1.0,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const boltParticles = new THREE.Points(boltGeo, boltMat);
    orbGroup.add(boltParticles);

    // === TEXT OVERLAY (title/years on hover) ===
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const textMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });

    const textMesh = new THREE.Mesh(new THREE.CircleGeometry(310, 32), textMat);
    textMesh.position.set(0, 0, 20);
    textMesh.userData.isTextOverlay = true;
    orbGroup.add(textMesh);

    orbGroup.userData.particleOrb = points;
    orbGroup.userData.lightning = boltParticles;
    orbGroup.userData.textMesh = textMesh;
    orbGroup.userData.canvas = canvas;
    orbGroup.userData.ctx = canvas.getContext('2d');

    expGroup.add(orbGroup);
    billboardOrbs.push(orbGroup);
  });

  return {
    group: expGroup,
    infoCard: infoCard
  };
}

// Click handlers (call these from your main app)
export function handlePointerDown(event, camera) {
  isMouseDown = true;
  mouseDownPos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseDownPos.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// src/experience.js

export function handlePointerUp(event, camera) {
  if (!isMouseDown) return;
  isMouseDown = false;

  const mouseUpPos = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  if (mouseDownPos.distanceTo(mouseUpPos) < 0.02) {
    raycaster.setFromCamera(mouseUpPos, camera);
    const intersects = raycaster.intersectObjects(billboardOrbs, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.job) obj = obj.parent;
      if (obj && obj.userData.job) {
        infoCard.show(obj.userData.job);
        return; 
      }
    }

    // --- THE FIX IS HERE ---
    // Only hide the card if the camera is actually looking at the Experience section.
    // If camera.position.z is greater than -2000, we assume the user is at Skills or elsewhere.
    if (camera.position.z < -2000) {
      infoCard.hide();
    }
  }
}

export function updateExperience(camera, mouseVec) {
  let hoveredOrb = null;

  if (mouseVec) {
    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(billboardOrbs, true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.job) obj = obj.parent;
      hoveredOrb = obj;
    }
  }

  billboardOrbs.forEach(orb => {
    const isHovered = (orb === hoveredOrb);
    
    // Check if the hover state actually changed to avoid redrawing every frame
    const stateChanged = orb.userData.lastHoverState !== isHovered;
    orb.userData.lastHoverState = isHovered;

    const job = orb.userData.job;
    const pMat = orb.userData.particleOrb.material;
    const lMat = orb.userData.lightning.material;
    const tMat = orb.userData.textMesh.material;
    const cMat = orb.userData.connectorLine.material;
    const ctx = orb.userData.ctx;
    const canvas = orb.userData.canvas;

    const time = performance.now() * 0.001;
    pMat.uniforms.time.value = time;
    pMat.uniforms.flow.value += ((isHovered ? 1.0 : 0.0) - pMat.uniforms.flow.value) * 0.12;

    lMat.opacity += ((isHovered ? 0.0 : 1.0) - lMat.opacity) * 0.15;
    cMat.opacity += ((isHovered ? 0.0 : 0.7) - cMat.opacity) * 0.15;
    tMat.opacity += ((isHovered ? 1.0 : 0.0) - tMat.opacity) * 0.15;

    // Only redraw if the text is visible AND either the state changed OR we need to pulse the hint
    if (tMat.opacity > 0.01) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1. GENTLE BACKDROP: Lower opacity (0.7) lets lightning show through
      ctx.fillStyle = 'rgba(0, 2, 15, 0.7)'; 
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 2. JOB TITLE: Pure White + Double-draw for "Boldness"
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 35;
      ctx.fillStyle = '#ffffff';

      let fontSize = 120;
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(job.title).width;
      const maxWidth = canvas.width * 0.85;
      if (textWidth > maxWidth) fontSize = Math.floor(fontSize * (maxWidth / textWidth));

      ctx.font = `bold ${fontSize}px Arial`;
      // Drawing twice adds weight/brightness in Additive mode
      ctx.fillText(job.title, canvas.width / 2, canvas.height / 2 - 60);
      ctx.fillText(job.title, canvas.width / 2, canvas.height / 2 - 60);

      // 3. YEARS: High-Vibrancy Cyan/White mix
      ctx.shadowBlur = 15;
      ctx.font = '72px Arial';
      ctx.fillStyle = '#e6f7ff'; 
      ctx.fillText(job.years, canvas.width / 2, canvas.height / 2 + 50);

      // 4. CLICK INDICATOR: Neon Cyan (Strong but thin)
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 0;
      ctx.font = 'italic 60px Arial';
      ctx.fillStyle = '#00ffff'; 
      ctx.fillText('<— click to view details —>', canvas.width / 2, canvas.height / 2 + 180);
      ctx.globalAlpha = 1.0;

      tMat.map.needsUpdate = true;
    }

    const s = isHovered ? 1.25 : 1.0;
    orb.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    orb.lookAt(camera.position);
});

  // Dim background when hovering
  if (sceneRef) {
    currentDimLevel += ((hoveredOrb ? 0.1 : 1.0) - currentDimLevel) * 0.1;
    sceneRef.traverse(child => {
      if (child.isMesh && !expGroup.getObjectById(child.id) && !child.userData.isTextOverlay) {
        if (!child.userData.baseOp) child.userData.baseOp = child.material.opacity || 1;
        child.material.transparent = true;
        child.material.opacity = child.userData.baseOp * currentDimLevel;
      }
    });
  }

  // Update info card animation
  if (infoCard) {
    infoCard.update();
  }
}