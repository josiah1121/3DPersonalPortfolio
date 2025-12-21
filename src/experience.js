// src/experience.js — "Skills" particle title NOW DIMS correctly with everything else
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

    // Coin
    const coinGroup = new THREE.Group();
    coinGroup.position.copy(lineEnd);
    coinGroup.userData.job = job;
    coinGroup.userData.hovered = false;

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

    const halo = new THREE.Mesh(baseRing, ringMat.clone());
    halo.scale.set(1.6, 1.6, 1.6);
    halo.material.opacity = 0.25;
    coinGroup.add(halo);

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

  // Update hover labels (unchanged)
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

        ctx.fillStyle = `rgba(15, 35, 80, ${currentOpacity * 0.9})`;
        ctx.fillRect(0, 0, item.canvas.width, item.canvas.height);

        ctx.strokeStyle = `rgba(0, 255, 255, ${currentOpacity * 0.9})`;
        ctx.lineWidth = 14;
        ctx.strokeRect(40, 40, item.canvas.width - 80, item.canvas.height - 80);

        ctx.strokeStyle = `rgba(0, 255, 255, ${currentOpacity * 0.4})`;
        ctx.lineWidth = 20;
        ctx.strokeRect(60, 60, item.canvas.width - 120, item.canvas.height - 120);

        const job = child.userData.job;

        ctx.font = 'bold 135px Arial';
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 100 * currentOpacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(job.title, item.canvas.width / 2, 170);

        ctx.font = '80px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#88ffff';
        ctx.shadowBlur = 80 * currentOpacity;
        ctx.fillText(job.years, item.canvas.width / 2, 320);

        item.mesh.material.map.needsUpdate = true;
      }
    }
  });

  if (sceneRef) {
    projectsBillboards = [];

    // Find skillsGroup once
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

    // Find "Skills" particle title group once
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

    // Cache originals
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

    // Dim projects
    projectsBillboards.forEach(obj => {
      obj.material.opacity = obj.userData.originalOpacity * currentDimLevel;
    });

    // Dim skills dome + contents
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

    // === DIM "SKILLS" PARTICLE TITLE — now correctly dims while preserving animation ===
    if (skillsTitleGroupRef) {
      const points = skillsTitleGroupRef.children.find(c => c instanceof THREE.Points);
      if (points && points.geometry.attributes.alpha) {
        const alphaAttr = points.geometry.attributes.alpha;
        // Cache original animated alphas on first run
        if (!points.userData.originalAlphas) {
          points.userData.originalAlphas = alphaAttr.array.slice();
        }
        // Apply global dim on top of current animated values
        for (let i = 0; i < alphaAttr.count; i++) {
          alphaAttr.array[i] = points.userData.originalAlphas[i] * currentDimLevel;
        }
        alphaAttr.needsUpdate = true;
      }
    }

    // Restore experience area
    expGroup.traverse(child => {
      if (child.material && child.userData.originalOpacity !== undefined && !hoverLabels.includes(child)) {
        child.material.opacity = child.userData.originalOpacity;
      }
    });
  }

  // Coin effects
  billboardCoins.forEach(coin => {
    coin.lookAt(camera.position);
    coin.rotation.z += coin.userData.baseRotation;
    const targetScale = coin.userData.hovered ? 1.2 : 1.0;
    coin.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
  });
}