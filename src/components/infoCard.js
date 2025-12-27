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

  // --- RESTORED: CLOSE BUTTON (MOBILE OPTIMIZED) ---
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute; 
    top: 3.5%; 
    right: 2.5%;
    background: #1a1a1a; 
    border: 2px solid #55aaff;
    color: #55aaff; 
    border-radius: 50%; 
    width: ${isTouch ? '44px' : '34px'}; 
    height: ${isTouch ? '44px' : '34px'};
    cursor: pointer; 
    pointer-events: auto; 
    font-size: ${isTouch ? '20px' : '16px'};
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
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#1a1a1a";
    closeBtn.style.color = "#55aaff";
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

    const isMobile = window.innerWidth < 768;

    // EXCLUSIVE POSITIONING: 
    // Desktop: 15% from bottom (clears ESC)
    // Mobile: 35px from bottom (keeps it at the very base of the card)
    const bottomPos = isMobile ? '35px' : '15%';

    contentInner.innerHTML = `
      <style>
        @keyframes particleFlow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .particle-trail {
          background: linear-gradient(90deg, rgba(128,255,128,0) 0%, rgba(128,255,128,0.8) 50%, rgba(128,255,128,0) 100%);
          background-size: 200% 100%;
          animation: particleFlow 1.5s linear infinite;
        }
        .node-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: ${isMobile ? '25px' : '75px'};
        }
      </style>
      
      <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center;">
        
        <div style="position: absolute; bottom: ${bottomPos}; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;">
          
          <div id="btn-wrap" style="display: flex; justify-content: center; width: 100%;">
            <button id="triggerAction" style="
              padding: ${isMobile ? '4px 10px' : '12px 28px'}; 
              font-size: ${isMobile ? '9px' : '16px'}; 
              cursor: pointer; 
              background: rgba(0, 0, 0, 0.9); color: #55aaff; border: 1px solid #55aaff; 
              border-radius: 6px; font-weight: bold; transition: all 0.3s;
              box-shadow: 0 0 10px rgba(85, 170, 255, 0.2); pointer-events: auto;
            ">🚀 Trigger GitHub CI/CD</button>
          </div>

          <div id="pipeline" style="display: none; width: 90%; max-width: 550px; flex-direction: column; align-items: center;">
            <div style="position: relative; width: 100%; height: ${isMobile ? '2px' : '4px'}; background: rgba(255,255,255,0.1); border-radius: 2px;">
              <div id="progress-fill" class="particle-trail" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; border-radius: 2px; transition: width 0.8s ease-in-out;"></div>
              
              <div style="position: absolute; width: 100%; display: flex; justify-content: space-between; top: ${isMobile ? '-5px' : '-9px'};">
                ${[1, 2, 3, 4].map(i => `
                  <div class="node-container">
                    <div id="node-${i}" style="width: ${isMobile ? '12px' : '22px'}; height: ${isMobile ? '12px' : '22px'}; border-radius: 50%; background: #000; border: 1px solid #444; display:flex; align-items:center; justify-content:center; transition: all 0.4s;"></div>
                    <span id="label-${i}" style="color: rgba(255,255,255,0.4); font-size: ${isMobile ? '6px' : '10px'}; margin-top: ${isMobile ? '4px' : '8px'}; font-weight: 600; text-transform: uppercase;">
                      ${['Code', 'Lint', 'Test', 'Deploy'][i-1]}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div id="status-text" style="color: #88ccff; font-style: italic; font-size: ${isMobile ? '8px' : '13px'}; margin-top: ${isMobile ? '20px' : '40px'}; letter-spacing: 0.5px;">Ready...</div>
          </div>

        </div>
      </div>
    `;
  
    const btnWrap = document.getElementById('btn-wrap');
    const btn = document.getElementById('triggerAction');
    const pipeline = document.getElementById('pipeline');
    const fill = document.getElementById('progress-fill');
    const statusText = document.getElementById('status-text');
  
    btn.onclick = async (e) => {
      e.stopPropagation();
      btnWrap.style.display = 'none'; 
      pipeline.style.display = 'flex';
      
      const stages = [
        { node: 'node-1', label: 'label-1', text: 'Fetching...', percent: '0%' },
        { node: 'node-2', label: 'label-2', text: 'Linting...', percent: '33%' },
        { node: 'node-3', label: 'label-3', text: 'Testing...', percent: '66%' },
        { node: 'node-4', label: 'label-4', text: 'Deploying...', percent: '100%' }
      ];

      for (let s of stages) {
        const nodeEl = document.getElementById(s.node);
        const labelEl = document.getElementById(s.label);
        statusText.innerHTML = s.text;
        fill.style.width = s.percent;
        nodeEl.style.border = '1px solid #55aaff';
        
        await new Promise(r => setTimeout(r, 700));
        
        nodeEl.innerHTML = `<span style="font-size: ${isMobile ? '7px' : '11px'};">🚀</span>`;
        nodeEl.style.background = '#0d2b0d';
        nodeEl.style.border = '1px solid #80ff80';
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

    // --- RESTORED: RESPONSIVE CAMERA LOGIC ---
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect;
    let dist = 10; 
    if (aspect < 1.6) {
        const cardWidthWithMargin = 16 * 1.25; 
        const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * aspect);
        dist = cardWidthWithMargin / (2 * Math.tan(hFOV / 2));
    }

    group.position.copy(camera.position);
    group.quaternion.copy(camera.quaternion);
    group.translateZ(-dist);

    overlay.scale.set(100, 100, 1); 
    overlayMat.opacity = currentOpacity * 0.85; 
    backdropMat.opacity = currentOpacity * 0.5;
    cardMat.opacity = currentOpacity;
    
    cardMesh.scale.setScalar(currentScale);
    backdrop.scale.setScalar(currentScale * 1.5);

    if (group.visible) {
      const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
      const visibleWidth = visibleHeight * aspect;
      const cardPxWidth = (16 * currentScale / visibleWidth) * window.innerWidth;
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