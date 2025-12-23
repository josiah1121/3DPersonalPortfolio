// src/experience.js — Final Fix: Dynamic Text Scaling & Subtle Star-Pulse Idle State
import * as THREE from 'three';

let expGroup = null;
let billboardOrbs = [];
let raycaster = new THREE.Raycaster();
let currentDimLevel = 1.0;
let sceneRef = null;
let projectsBillboards = [];
let skillsGroupRef = null;
let skillsTitleGroupRef = null;

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
    const lineTube = new THREE.TubeGeometry(lineCurve, 32, 8, 8, false);
    const lineMat = new THREE.MeshBasicMaterial({
      color: job.color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    expGroup.add(new THREE.Mesh(lineTube, lineMat));

    const orbGroup = new THREE.Group();
    orbGroup.position.copy(lineEnd);
    orbGroup.userData.job = job;

    const hitbox = new THREE.Mesh(
      new THREE.CircleGeometry(450, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    orbGroup.add(hitbox);

    // === PARTICLE ORB ===
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    
    for (let j = 0; j < particleCount; j++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      // Initial Sphere
      positions[j*3] = 120 * Math.sin(phi) * Math.cos(theta);
      positions[j*3+1] = 120 * Math.sin(phi) * Math.sin(theta);
      positions[j*3+2] = 120 * Math.cos(phi);

      // Hover C-Ring
      const angle = 0.5 + Math.random() * 5.3; 
      targets[j*3] = Math.cos(angle) * 280; 
      targets[j*3+1] = Math.sin(angle) * 280;
      targets[j*3+2] = (Math.random() - 0.5) * 30;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targets, 3));

    const partMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flow: { value: 0 },
        color: { value: new THREE.Color(job.color) }
      },
      vertexShader: `
        attribute vec3 targetPosition;
        uniform float time;
        uniform float flow;
        
        void main() {
          vec3 idlePos = position;
          
          // --- Subtle Star Pulse (Idle State Only) ---
          // Creates a geometric wave based on the sphere's normal direction
          float pulseStrength = 1.0 - flow; // Fade out effect as we hover
          if (pulseStrength > 0.01) {
            vec3 normal = normalize(position);
            // Use abs() to create sharper, star-like peaks
            float wave = abs(sin(normal.x * 3.0 + time)) * abs(cos(normal.y * 3.0 + time));
            idlePos += normal * (wave * 25.0 * pulseStrength);
            
            // Add a slow overall breath
            idlePos *= (1.0 + sin(time * 0.5) * 0.05 * pulseStrength);
          }

          vec3 pos = mix(idlePos, targetPosition, flow);
          
          // --- Hover Rotation (Ring State) ---
          if(flow > 0.1) {
             float r = length(pos.xy);
             float ang = atan(pos.y, pos.x) + time * 1.5;
             pos.x = cos(ang) * r;
             pos.y = sin(ang) * r;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 7.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          // Soften edges slightly for more of a glow
          float alpha = smoothstep(0.5, 0.2, dist);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, partMat);
    orbGroup.add(points);

    // === ENHANCED TEXT PLANE ===
    const canvas = document.createElement('canvas');
    canvas.width = 1200; 
    canvas.height = 512;
    const tex = new THREE.CanvasTexture(canvas);
    
    const textMat = new THREE.MeshBasicMaterial({ 
      map: tex, 
      transparent: true, 
      opacity: 0,
      depthTest: false,
      depthWrite: false
    });
    
    const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 256), textMat);
    textMesh.position.set(0, 0, 15);
    textMesh.renderOrder = 999; 
    orbGroup.add(textMesh);

    orbGroup.userData.particleOrb = points;
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
    const tMat = orb.userData.textMesh.material;
    const ctx = orb.userData.ctx;
    const canvas = orb.userData.canvas;

    pMat.uniforms.time.value = performance.now() * 0.001;
    const targetFlow = isHovered ? 1.0 : 0.0;
    pMat.uniforms.flow.value += (targetFlow - pMat.uniforms.flow.value) * 0.12;

    const targetAlpha = isHovered ? 1.0 : 0.0;
    tMat.opacity += (targetAlpha - tMat.opacity) * 0.15;

    if (tMat.opacity > 0.01) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let fontSize = 100;
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(job.title).width;
      const maxWidth = canvas.width - 120; 
      if (textWidth > maxWidth) {
          fontSize = Math.floor(fontSize * (maxWidth / textWidth));
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(40, 80, canvas.width - 80, 350, 60);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px Arial`; 
      ctx.fillText(job.title, canvas.width / 2, 210);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '64px Arial';
      ctx.fillText(job.years, canvas.width / 2, 330);

      tMat.map.needsUpdate = true;
    }

    const targetScale = isHovered ? 1.25 : 1.0;
    orb.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    orb.lookAt(camera.position);
  });

  if (sceneRef) {
    const targetDim = hoveredOrb ? 0.05 : 1.0;
    currentDimLevel += (targetDim - currentDimLevel) * 0.1;

    sceneRef.traverse(child => {
      if (child.isMesh && !expGroup.getObjectById(child.id)) {
        if (!child.userData.baseOp) child.userData.baseOp = child.material.opacity || 1;
        child.material.transparent = true;
        child.material.opacity = child.userData.baseOp * currentDimLevel;
      }
    });
  }
}