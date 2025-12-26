import * as THREE from 'three';
import { mouse } from '../cursor.js'; 

export function createInfoCard(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  // --- HTML OVERLAY SETUP ---
  const overlayContainer = document.createElement('div');
  overlayContainer.id = 'infocard-html-overlay';
  
  overlayContainer.style.cssText = `
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%);
    aspect-ratio: 16 / 9.8; 
    display: none; 
    z-index: 1000; 
    pointer-events: none;
    font-family: 'Segoe UI', Arial, sans-serif;
    transition: opacity 0.3s ease;
    box-sizing: border-box;
  `;
  document.body.appendChild(overlayContainer);

  const contentInner = document.createElement('div');
  contentInner.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `;

  // --- CLOSE BUTTON (REFINED POSITION) ---
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute; 
    /* Moved inward to clear the blue border stroke */
    top: 3.5%; 
    right: 2.5%;
    background: #1a1a1a; 
    border: 2px solid #55aaff;
    color: #55aaff; 
    border-radius: 50%; 
    width: 32px; 
    height: 32px;
    cursor: pointer; 
    pointer-events: auto; 
    font-size: 16px;
    box-shadow: 0 0 15px rgba(85, 170, 255, 0.4);
    display: flex; 
    align-items: center; 
    justify-content: center;
    z-index: 1001;
    transition: all 0.2s ease;
    margin: 0; 
    padding: 0;
  `;
  
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#55aaff";
    closeBtn.style.color = "#1a1a1a";
    closeBtn.style.boxShadow = "0 0 20px rgba(85, 170, 255, 0.6)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#1a1a1a";
    closeBtn.style.color = "#55aaff";
    closeBtn.style.boxShadow = "0 0 15px rgba(85, 170, 255, 0.4)";
  };

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    hide();
  };

  // 1. DIMMING OVERLAY
  const overlayGeo = new THREE.PlaneGeometry(100, 100); 
  const overlayMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthTest: false, 
    depthWrite: false,
  });
  const overlay = new THREE.Mesh(overlayGeo, overlayMat);
  overlay.renderOrder = 998; 
  group.add(overlay);

  // 2. BACKDROP
  const backdropGeo = new THREE.CircleGeometry(10, 64);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: 0x002266,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  });
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.renderOrder = 999;
  group.add(backdrop);

  // 3. CANVAS & CARD
  const canvas = document.createElement('canvas');
  canvas.width = 1800;   
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const cardMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
  });

  const cardGeo = new THREE.PlaneGeometry(16, 9.8); 
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardMesh.renderOrder = 1000; 
  group.add(cardMesh);

  let targetOpacity = 0;
  let currentOpacity = 0;
  let targetScale = 0.8;
  let currentScale = 0.8;

  function drawCard(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(10, 20, 50, 0.95)');
    grad.addColorStop(1, 'rgba(5, 10, 30, 0.98)');
    ctx.fillStyle = grad;
    roundRect(ctx, 20, 20, canvas.width - 40, canvas.height - 40, 60);
    ctx.fill();

    ctx.strokeStyle = '#55aaff';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 120px Arial';
    ctx.fillText(data.title, canvas.width / 2, 200);

    ctx.font = 'italic 70px Arial';
    ctx.fillStyle = '#88ccff';
    ctx.fillText(data.years, canvas.width / 2, 300);

    ctx.font = '55px Arial';
    ctx.fillStyle = '#eef6ff';
    const descY = data.title === "DevOps" ? 400 : 450;
    wrapText(ctx, data.description || '', canvas.width / 2, descY, canvas.width * 0.8, 75);

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (!isTouch) {
        const hintY = canvas.height - 110;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#88ccff';
        ctx.strokeStyle = '#88ccff';
        const fontMain = '40px Arial';
        const fontKey = 'bold 30px Arial';
        const text1 = "Press ";
        const text2 = " to dismiss";
        const keyText = "ESC";

        ctx.font = fontMain;
        const w1 = ctx.measureText(text1).width;
        const w2 = ctx.measureText(text2).width;
        const boxW = 100, boxH = 55, spacing = 15;
        const totalW = w1 + boxW + w2 + (spacing * 2);
        let currentX = (canvas.width - totalW) / 2;

        ctx.textAlign = 'left';
        ctx.fillText(text1, currentX, hintY);
        currentX += w1 + spacing;
        roundRect(ctx, currentX, hintY - 38, boxW, boxH, 10);
        ctx.stroke();
        ctx.font = fontKey;
        ctx.textAlign = 'center';
        ctx.fillText(keyText, currentX + boxW / 2, hintY - 3);
        currentX += boxW + spacing;
        ctx.font = fontMain;
        ctx.textAlign = 'left';
        ctx.fillText(text2, currentX, hintY);
        ctx.globalAlpha = 1.0; 
    }
    texture.needsUpdate = true;
  }

  function showDevOpsUI() {
    contentInner.style.pointerEvents = 'auto';
    overlayContainer.onpointermove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    contentInner.innerHTML = `
      <style>
        @keyframes particleFlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .particle-trail {
          background: linear-gradient(90deg, rgba(128,255,128,0) 0%, rgba(128,255,128,0.8) 50%, rgba(128,255,128,0) 100%);
          background-size: 200% 100%;
          animation: particleFlow 1.5s linear infinite;
          box-shadow: 0 0 15px #80ff80;
        }
      </style>
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 20px;">
        <button id="triggerAction" style="
          padding: 16px 30px; font-size: 20px; cursor: pointer; 
          background: transparent; color: #55aaff; border: 2px solid #55aaff; 
          border-radius: 12px; font-weight: bold; transition: all 0.3s;
          box-shadow: 0 0 15px rgba(85, 170, 255, 0.3); pointer-events: auto;
        ">🚀 Trigger GitHub CI/CD</button>
        <div id="pipeline" style="margin-top: 30px; display: none; width: 100%; flex-direction: column; align-items: center;">
          <div style="position: relative; width: 85%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 25px;">
            <div id="progress-fill" class="particle-trail" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            <div style="position: absolute; width: 100%; display: flex; justify-content: space-between; top: -10px;">
              <div id="node-1" class="node" style="width: 24px; height: 24px; border-radius: 50%; background: #1a1a1a; border: 2px solid #333;"></div>
              <div id="node-2" class="node" style="width: 24px; height: 24px; border-radius: 50%; background: #1a1a1a; border: 2px solid #333;"></div>
              <div id="node-3" class="node" style="width: 24px; height: 24px; border-radius: 50%; background: #1a1a1a; border: 2px solid #333;"></div>
              <div id="node-4" class="node" style="width: 24px; height: 24px; border-radius: 50%; background: #1a1a1a; border: 2px solid #333;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; width: 90%; color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 15px; font-weight: 500; text-transform: uppercase;">
            <span id="label-1">Code</span><span id="label-2">Lint</span><span id="label-3">Test</span><span id="label-4">Deploy</span>
          </div>
          <div id="status-text" style="color: #88ccff; font-style: italic; font-size: 16px; letter-spacing: 0.5px;">Ready...</div>
        </div>
      </div>
    `;
  
    const btn = document.getElementById('triggerAction');
    const pipeline = document.getElementById('pipeline');
    const fill = document.getElementById('progress-fill');
    const statusText = document.getElementById('status-text');
  
    btn.onclick = async (e) => {
      e.stopPropagation();
      btn.style.display = 'none';
      pipeline.style.display = 'flex';
      const stages = [
        { node: 'node-1', label: 'label-1', text: 'Checking out code...', percent: '0%' },
        { node: 'node-2', label: 'label-2', text: 'Running Vitest suite...', percent: '33%' },
        { node: 'node-3', label: 'label-3', text: 'Verifying environment...', percent: '66%' },
        { node: 'node-4', label: 'label-4', text: 'Finalizing deployment...', percent: '100%' }
      ];
      for (let s of stages) {
        const nodeEl = document.getElementById(s.node);
        const labelEl = document.getElementById(s.label);
        statusText.innerHTML = s.text;
        fill.style.width = s.percent;
        nodeEl.style.border = '2px solid #55aaff';
        nodeEl.style.boxShadow = '0 0 15px rgba(85, 170, 255, 0.6)';
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
        nodeEl.innerHTML = '<span style="font-size: 12px;">🚀</span>';
        nodeEl.style.background = '#0d2b0d';
        nodeEl.style.border = '2px solid #80ff80';
        labelEl.style.color = '#80ff80';
      }
      statusText.innerHTML = "Success! 🚀";
      statusText.style.color = "#80ff80";
    };
  }
  
  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (context.measureText(testLine).width > maxWidth && n > 0) {
        context.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else { line = testLine; }
    }
    context.fillText(line.trim(), x, currentY);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function show(cardData) {
    drawCard(cardData);
    group.visible = true;
    targetOpacity = 1;
    targetScale = 1.0;
    overlayContainer.style.display = 'block'; 

    overlayContainer.innerHTML = '';
    overlayContainer.appendChild(closeBtn);
    overlayContainer.appendChild(contentInner);
    contentInner.innerHTML = ''; 
    if (cardData.title === "DevOps") showDevOpsUI(); 
  }

  function hide() {
    targetOpacity = 0;
    targetScale = 0.9;
    overlayContainer.style.display = 'none';
  }

  function update() {
    currentOpacity += (targetOpacity - currentOpacity) * 0.12;
    currentScale += (targetScale - currentScale) * 0.12;

    const dist = 10; 
    group.position.copy(camera.position);
    group.quaternion.copy(camera.quaternion);
    group.translateZ(-dist);

    overlay.scale.set(5, 5, 1); 
    overlayMat.opacity = currentOpacity * 0.85; 
    backdropMat.opacity = currentOpacity * 0.5;
    cardMat.opacity = currentOpacity;
    
    cardMesh.scale.setScalar(currentScale);
    backdrop.scale.setScalar(currentScale * 1.5);

    // --- REFINED: DYNAMIC HTML SYNC ---
    if (group.visible) {
      const vFOV = THREE.MathUtils.degToRad(camera.fov);
      const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
      const visibleWidth = visibleHeight * camera.aspect;
      
      // Use 15.9 to sit just inside the actual mesh boundary for better UI fit
      const cardPxWidth = (15.95 * currentScale / visibleWidth) * window.innerWidth;
      overlayContainer.style.width = `${cardPxWidth}px`;
    }

    overlayContainer.style.opacity = currentOpacity;

    if (group.visible) {
      const cursorGroup = scene.getObjectByName('cursorGroup');
      if (cursorGroup) {
        cursorGroup.renderOrder = 9999; 
        cursorGroup.children.forEach(child => {
          if (child.material) {
            child.material.depthTest = false;
            child.material.depthWrite = false;
          }
        });
      }
    }

    if (currentOpacity < 0.01 && targetOpacity === 0) group.visible = false;
  }

  const escListener = (e) => { if (e.key === 'Escape') hide(); };
  window.addEventListener('keydown', escListener);

  return {
    group, show, hide, update,
    dispose: () => {
      window.removeEventListener('keydown', escListener);
      if (document.body.contains(overlayContainer)) document.body.removeChild(overlayContainer);
      [overlayGeo, overlayMat, backdropGeo, backdropMat, cardGeo, cardMat, texture].forEach(r => r.dispose());
      scene.remove(group);
    }
  };
}