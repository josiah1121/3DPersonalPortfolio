// src/experience.js — High-Vibrancy Experience Orbs
import * as THREE from 'three';

let expGroup = null;
let billboardOrbs = [];
let raycaster = new THREE.Raycaster();
let currentDimLevel = 1.0;
let sceneRef = null;

export function createExperienceArea(scene) {
  sceneRef = scene;
  expGroup = new THREE.Group();
  billboardOrbs = [];

  expGroup.position.set(0, 200, -3000);
  scene.add(expGroup);

  const jobs = [
    { title: "Collins Aerospace", years: "2025 – Present", color: 0x0088ff },
    { title: "Raytheon Technologies", years: "2023 – 2025", color: 0x0088ff }
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

    const hitbox = new THREE.Mesh(
      new THREE.CircleGeometry(450, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    orbGroup.add(hitbox);

    // === 1. PARTICLE ORB (Outer Jelly) ===
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

    // === 2. LIGHTNING BOLT ===
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

    // === 3. TEXT CANVAS (VIBRANCY FIX) ===
    const canvas = document.createElement('canvas');
    canvas.width = 1024; 
    canvas.height = 1024;
    
    const tex = new THREE.CanvasTexture(canvas);
    // FIX: Set Color Space for vibrancy in modern Three.js
    tex.colorSpace = THREE.SRGBColorSpace; 
    
    const textMat = new THREE.MeshBasicMaterial({ 
      map: tex, 
      transparent: true, 
      opacity: 0, 
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff // Force material to pure white
    });
    
    const textMesh = new THREE.Mesh(new THREE.CircleGeometry(310, 32), textMat);
    textMesh.position.set(0, 0, 20); // Moved slightly forward
    
    // Tag this mesh so the global dimming logic ignores it
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

  return expGroup;
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
    const job = orb.userData.job;
    const pMat = orb.userData.particleOrb.material;
    const lMat = orb.userData.lightning.material;
    const tMat = orb.userData.textMesh.material;
    const cMat = orb.userData.connectorLine.material;
    const ctx = orb.userData.ctx;
    const canvas = orb.userData.canvas;

    pMat.uniforms.time.value = performance.now() * 0.001;
    pMat.uniforms.flow.value += ((isHovered ? 1.0 : 0.0) - pMat.uniforms.flow.value) * 0.12;
    
    lMat.opacity += ((isHovered ? 0.0 : 1.0) - lMat.opacity) * 0.15;
    cMat.opacity += ((isHovered ? 0.0 : 0.7) - cMat.opacity) * 0.15;
    tMat.opacity += ((isHovered ? 1.0 : 0.0) - tMat.opacity) * 0.15;

    if (tMat.opacity > 0.01) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Slightly deeper background for more contrast
      ctx.fillStyle = 'rgba(0, 2, 15, 0.99)'; 
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Increased glow intensity
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 40; 
      ctx.fillStyle = '#ffffff'; 

      let fontSize = 120;
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(job.title).width;
      const maxWidth = canvas.width * 0.9; 
      if (textWidth > maxWidth) fontSize = Math.floor(fontSize * (maxWidth / textWidth));
      
      ctx.font = `bold ${fontSize}px Arial`; 
      ctx.fillText(job.title, canvas.width / 2, canvas.height / 2 - 45);

      ctx.shadowBlur = 15;
      ctx.font = '72px Arial';
      ctx.fillText(job.years, canvas.width / 2, canvas.height / 2 + 85);
      
      tMat.map.needsUpdate = true;
    }

    const s = isHovered ? 1.25 : 1.0;
    orb.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    orb.lookAt(camera.position);
  });

  if (sceneRef) {
    currentDimLevel += ((hoveredOrb ? 0.1 : 1.0) - currentDimLevel) * 0.1;
    sceneRef.traverse(child => {
      // FIX: Ensure the text mesh doesn't get dimmed by the global traverse
      if (child.isMesh && !expGroup.getObjectById(child.id) && !child.userData.isTextOverlay) {
        if (!child.userData.baseOp) child.userData.baseOp = child.material.opacity || 1;
        child.material.transparent = true;
        child.material.opacity = child.userData.baseOp * currentDimLevel;
      }
    });
  }
}