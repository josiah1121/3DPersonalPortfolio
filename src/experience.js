// src/experience.js — with moving gas-filled plasma orb (nebula/cloud style)
import * as THREE from 'three';

let expGroup = null;
let billboardCoins = [];
let hoverLabels = [];
let raycaster = new THREE.Raycaster();
let currentDimLevel = 1.0;
let sceneRef = null;
let projectsBillboards = [];
let skillsGroupRef = null;
let skillsTitleGroupRef = null;

export function createExperienceArea(scene) {
  sceneRef = scene;
  expGroup = new THREE.Group();
  billboardCoins = [];
  hoverLabels = [];
  projectsBillboards = [];

  expGroup.position.set(0, 200, -3000);
  scene.add(expGroup);

  const jobs = [
    { title: "Collins Aerospace", years: "2025 – Present", color: 0x00ffff },
    { title: "Raytheon Technologies", years: "2023 – 2025", color: 0x00ffff }
  ];

  const timelineHeight = 800;
  const nodeSpacing = timelineHeight / (jobs.length + 3);

  // Central spine
  const spineGeo = new THREE.CylinderGeometry(10, 10, timelineHeight * 1.3, 16, 1, true);
  const spineMat = new THREE.MeshBasicMaterial({
    color: 0x004488,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.y = timelineHeight / 2 - nodeSpacing;
  expGroup.add(spine);

  const spineGlow = spine.clone();
  spineGlow.scale.set(2.2, 1.4, 2.2);
  spineGlow.material = spineGlow.material.clone();
  spineGlow.material.opacity = 0.15;
  expGroup.add(spineGlow);

  jobs.forEach((job, i) => {
    const yPos = timelineHeight - (i + 1) * nodeSpacing;

    const lineLength = 650;
    const direction = i % 2 === 0 ? -1 : 1;
    const lineEnd = new THREE.Vector3(direction * lineLength, yPos, 0);

    const lineCurve = new THREE.LineCurve3(new THREE.Vector3(0, yPos, 0), lineEnd);
    const lineTube = new THREE.TubeGeometry(lineCurve, 32, 8, 8, false);
    const lineMat = new THREE.MeshBasicMaterial({
      color: job.color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const horizontalLine = new THREE.Mesh(lineTube, lineMat);
    expGroup.add(horizontalLine);

    // Coin Group
    const coinGroup = new THREE.Group();
    coinGroup.position.copy(lineEnd);
    coinGroup.userData.job = job;
    coinGroup.userData.hovered = false;

    // Invisible hitbox
    const hitboxGeometry = new THREE.CircleGeometry(180, 32);
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    coinGroup.add(new THREE.Mesh(hitboxGeometry, hitboxMaterial));

    // Visual rings
    const baseRing = new THREE.RingGeometry(110, 150, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: job.color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    coinGroup.add(new THREE.Mesh(baseRing, ringMat));
    coinGroup.add(new THREE.Mesh(new THREE.RingGeometry(80, 110, 48), ringMat.clone()));

    const coreMat = ringMat.clone();
    coreMat.color = new THREE.Color(job.color).multiplyScalar(2.2);
    coinGroup.add(new THREE.Mesh(new THREE.RingGeometry(50, 70, 32), coreMat));

    // Outer halo
    const halo = new THREE.Mesh(baseRing, ringMat.clone());
    halo.scale.set(1.6, 1.6, 1.6);
    halo.material.opacity = 0.25;
    coinGroup.add(halo);

    // === MOVING GAS-FILLED PLASMA ORB ===
    const particleCount = 12000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      let x, y, z, distSq;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        distSq = x * x + y * y + z * z;
      } while (distSq >= 1.0);

      const radius = 48;
      positions[i * 3]     = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;
    }

    const orbGeometry = new THREE.BufferGeometry();
    orbGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const orbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(0xaa22ff) },       // Deep purple core
        highlightColor: { value: new THREE.Color(0xff66ff) },  // Bright pink/magenta highlights
        // For electric blue version, uncomment below and comment above:
        // baseColor: { value: new THREE.Color(0x0088ff) },
        // highlightColor: { value: new THREE.Color(0x00ffff) },
        intensity: { value: 1.0 },
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float intensity;
        varying vec3 vPos;
        void main() {
          vPos = position;
          vec3 pos = position;
          
          // Gentle breathing
          float breath = 1.0 + sin(time * 0.5) * 0.04;
          pos *= breath;
          
          // Swirling internal gas motion
          float turb = sin(time * 0.7 + length(position) * 0.15) * 5.0;
          pos += normalize(position) * turb;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 5.8 * intensity * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 highlightColor;
        uniform float intensity;
        varying vec3 vPos;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.05, dist);
          
          // Strong volumetric center glow
          float centerDist = length(vPos) / 48.0;
          float density = pow(1.0 - centerDist, 3.5);
          
          // Color gradient: pink highlights on edges, purple in core
          vec3 color = mix(highlightColor, baseColor, centerDist);
          
          gl_FragColor = vec4(color * 2.4, alpha * density * intensity * 1.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const plasmaOrb = new THREE.Points(orbGeometry, orbMaterial);
    coinGroup.add(plasmaOrb);

    coinGroup.userData.plasmaOrb = plasmaOrb;
    coinGroup.userData.baseRotation = 0.003 + Math.random() * 0.003;

    expGroup.add(coinGroup);
    billboardCoins.push(coinGroup);

    // Hover label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1600;
    labelCanvas.height = 500;
    const ctx = labelCanvas.getContext('2d');

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1150, 300), labelMat);
    labelMesh.position.set(lineEnd.x, yPos - 170, 10);
    expGroup.add(labelMesh);

    coinGroup.userData.label = { mesh: labelMesh, canvas: labelCanvas, ctx };
    hoverLabels.push(labelMesh);
  });

  return expGroup;
}

export function updateExperience(camera, mouseVec) {
  let isAnyCoinHovered = false;

  billboardCoins.forEach(coin => coin.userData.hovered = false);

  if (mouseVec) {
    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(billboardCoins, true);
    if (intersects.length > 0) {
      const hoveredCoin = intersects[0].object.parent;
      if (hoveredCoin.userData.job) {
        hoveredCoin.userData.hovered = true;
        isAnyCoinHovered = true;
      }
    }
  }

  // Update hover labels
  expGroup.traverse(child => {
    if (child.userData.label) {
      const item = child.userData.label;
      const targetOpacity = child.userData.hovered ? 1.0 : 0.0;
      let currentOpacity = item.mesh.material.opacity;
      currentOpacity += (targetOpacity - currentOpacity) * 0.15;

      item.mesh.material.opacity = currentOpacity;
      item.mesh.visible = currentOpacity > 0.01;

      if (currentOpacity > 0.01) {
        const ctx = item.ctx;
        ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);

        ctx.fillStyle = 'rgba(5, 15, 40, 1.0)';
        ctx.fillRect(0, 0, item.canvas.width, item.canvas.height);

        ctx.strokeStyle = `rgba(0, 255, 255, ${currentOpacity})`;
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, item.canvas.width - 80, item.canvas.height - 80);

        ctx.strokeStyle = `rgba(0, 255, 255, ${currentOpacity * 0.6})`;
        ctx.lineWidth = 30;
        ctx.strokeRect(70, 70, item.canvas.width - 140, item.canvas.height - 140);

        const job = child.userData.job;

        ctx.font = 'bold 135px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.strokeText(job.title, item.canvas.width / 2, 170);

        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 140 * currentOpacity;
        ctx.fillText(job.title, item.canvas.width / 2, 170);

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        ctx.font = '80px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 6;
        ctx.strokeText(job.years, item.canvas.width / 2, 320);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#88ffff';
        ctx.shadowBlur = 100 * currentOpacity;
        ctx.fillText(job.years, item.canvas.width / 2, 320);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        item.mesh.material.map.needsUpdate = true;
      }
    }
  });

  if (sceneRef) {
    projectsBillboards = [];

    if (!skillsGroupRef) {
      sceneRef.traverse(child => {
        if (
          child instanceof THREE.Group &&
          Math.abs(child.position.x + 1100) < 50 &&
          Math.abs(child.position.y - 400) < 50 &&
          Math.abs(child.position.z + 800) < 50
        ) {
          skillsGroupRef = child;
        }
      });
    }

    if (!skillsTitleGroupRef) {
      sceneRef.traverse(child => {
        if (
          child instanceof THREE.Group &&
          child.rotation.x === -Math.PI / 2 &&
          Math.abs(child.position.x + 1070) < 100 &&
          Math.abs(child.position.y - 50) < 50 &&
          Math.abs(child.position.z + 620) < 100 &&
          child.children.some(c => c instanceof THREE.Points && c.geometry.attributes.alpha)
        ) {
          skillsTitleGroupRef = child;
        }
      });
    }

    sceneRef.traverse(child => {
      if (child.material) {
        const mat = child.material;
        if (mat.opacity !== undefined && child.userData.originalOpacity === undefined) {
          child.userData.originalOpacity = mat.opacity;
        }
        if (mat.uniforms?.uOpacity && child.userData.originalUniformOpacity === undefined) {
          child.userData.originalUniformOpacity = mat.uniforms.uOpacity.value;
        }
      }

      if (
        child.material?.map?.isCanvasTexture &&
        child.geometry?.type === 'PlaneGeometry' &&
        child.parent !== expGroup &&
        Math.abs(child.position.y - 250) < 10
      ) {
        projectsBillboards.push(child);
      }
    });

    const time = performance.now() * 0.001;
    const targetDim = isAnyCoinHovered ? 0.001 : 1.0;
    currentDimLevel += (targetDim - currentDimLevel) * 0.12;

    // === PLASMA ORB ANIMATION ===
    billboardCoins.forEach(coin => {
      if (coin.userData.plasmaOrb) {
        const material = coin.userData.plasmaOrb.material;
        material.uniforms.time.value = time;

        const targetIntensity = coin.userData.hovered ? 0.3 : 1.0;
        material.uniforms.intensity.value += 
          (targetIntensity - material.uniforms.intensity.value) * 0.12;
      }

      const targetScale = coin.userData.hovered ? 1.2 : 1.0;
      coin.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
    });

    projectsBillboards.forEach(obj => {
      obj.material.opacity = obj.userData.originalOpacity * currentDimLevel;
    });

    if (skillsGroupRef) {
      skillsGroupRef.traverse(child => {
        if (!child.material) return;

        if (child.material.opacity !== undefined) {
          if (child.userData?.isGroundRing) {
            const pulse = 0.35 + Math.sin(time * 1.5) * 0.2;
            child.material.opacity = child.userData.baseOpacity * pulse * currentDimLevel;
            const scalePulse = 0.98 + Math.sin(time * 1.7 + 1) * 0.04;
            child.scale.setScalar(child.userData.baseScale * scalePulse);
          } else {
            child.material.opacity = (child.userData.originalOpacity ?? child.material.opacity) * currentDimLevel;
          }
        }

        if (child.material.uniforms?.uOpacity) {
          child.material.uniforms.uOpacity.value = (child.userData.originalUniformOpacity ?? child.material.uniforms.uOpacity.value) * currentDimLevel;
        }

        if (child.userData?.isUpwardLights && child.geometry?.attributes?.alpha) {
          const alphaAttr = child.geometry.attributes.alpha;
          if (!child.userData.originalAlphas) {
            child.userData.originalAlphas = alphaAttr.array.slice();
          }
          const intensityPulse = 0.7 + Math.sin(time * 1.8) * 0.3;
          for (let i = 0; i < alphaAttr.count; i++) {
            alphaAttr.array[i] = child.userData.originalAlphas[i] * intensityPulse * currentDimLevel;
          }
          alphaAttr.needsUpdate = true;
        }

        if (child.userData?.isDome && child.userData.lineMaterial) {
          const lineMat = child.userData.lineMaterial;
          if (lineMat.userData?.originalOpacity === undefined) {
            lineMat.userData.originalOpacity = 0.5;
          }
          const pulse = 0.4 + Math.sin(time * 2) * 0.15;
          lineMat.opacity = lineMat.userData.originalOpacity * pulse * currentDimLevel;
        }
      });
    }

    if (skillsTitleGroupRef) {
      const points = skillsTitleGroupRef.children.find(c => c instanceof THREE.Points);
      if (points && points.geometry.attributes.alpha) {
        const alphaAttr = points.geometry.attributes.alpha;
        if (!points.userData.originalAlphas) {
          points.userData.originalAlphas = alphaAttr.array.slice();
        }
        for (let i = 0; i < alphaAttr.count; i++) {
          alphaAttr.array[i] = points.userData.originalAlphas[i] * currentDimLevel;
        }
        alphaAttr.needsUpdate = true;
      }
    }

    expGroup.traverse(child => {
      if (child.material && child.userData.originalOpacity !== undefined && !hoverLabels.includes(child)) {
        child.material.opacity = child.userData.originalOpacity;
      }
    });
  }

  billboardCoins.forEach(coin => {
    coin.lookAt(camera.position);
    coin.rotation.z += coin.userData.baseRotation;
  });
}