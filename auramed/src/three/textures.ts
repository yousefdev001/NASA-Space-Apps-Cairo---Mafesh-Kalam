import * as THREE from 'three';

export interface ProceduralTextureSet {
  chestDisplay: THREE.CanvasTexture;
  suitBump: THREE.CanvasTexture;
  solarPanel: THREE.CanvasTexture;
  hullPanel: THREE.CanvasTexture;
  earthSurface: THREE.CanvasTexture;
  moonSurface: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));

  // 1. Chest DCM Telemetry Screen + Mission Patch
  const chestCanvas = document.createElement('canvas');
  chestCanvas.width = 512;
  chestCanvas.height = 512;
  const cCtx = chestCanvas.getContext('2d')!;
  cCtx.fillStyle = '#09090B';
  cCtx.fillRect(0, 0, 512, 512);

  cCtx.strokeStyle = '#FF4D00';
  cCtx.lineWidth = 10;
  cCtx.strokeRect(18, 18, 476, 476);

  cCtx.fillStyle = '#FF4D00';
  cCtx.fillRect(18, 18, 476, 64);
  cCtx.fillStyle = '#000000';
  cCtx.font = 'bold 34px monospace';
  cCtx.fillText('AURAMED // DCM-01', 36, 62);

  cCtx.strokeStyle = 'rgba(255,255,255,0.16)';
  cCtx.lineWidth = 2;
  for (let y = 130; y < 310; y += 45) {
    cCtx.beginPath();
    cCtx.moveTo(36, y);
    cCtx.lineTo(476, y);
    cCtx.stroke();
  }

  cCtx.strokeStyle = '#FF4D00';
  cCtx.lineWidth = 7;
  cCtx.beginPath();
  cCtx.moveTo(36, 220);
  cCtx.lineTo(130, 220);
  cCtx.lineTo(155, 195);
  cCtx.lineTo(175, 220);
  cCtx.lineTo(195, 250);
  cCtx.lineTo(220, 120);
  cCtx.lineTo(245, 280);
  cCtx.lineTo(268, 220);
  cCtx.lineTo(315, 185);
  cCtx.lineTo(355, 220);
  cCtx.lineTo(476, 220);
  cCtx.stroke();

  cCtx.fillStyle = '#FFFFFF';
  cCtx.font = 'bold 30px monospace';
  cCtx.fillText('HR 68 BPM   SPO2 98.6%', 36, 355);
  cCtx.fillStyle = '#FF4D00';
  cCtx.fillText('SUIT 29.6 KPA · NOMINAL', 36, 405);

  cCtx.fillStyle = '#1E293B';
  cCtx.fillRect(36, 432, 130, 38);
  cCtx.fillStyle = '#FF4D00';
  cCtx.fillRect(190, 432, 130, 38);
  cCtx.fillStyle = '#FFFFFF';
  cCtx.fillRect(344, 432, 130, 38);

  const chestDisplay = new THREE.CanvasTexture(chestCanvas);
  chestDisplay.colorSpace = THREE.SRGBColorSpace;
  chestDisplay.anisotropy = anisotropy;

  // 2. Beta-Cloth Ripstop Bump Map (Linear)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      bCtx.fillStyle = (x + y) % 16 === 0 ? '#9C9C9C' : '#6A6A6A';
      bCtx.fillRect(x, y, 6, 6);
    }
  }
  const suitBump = new THREE.CanvasTexture(bumpCanvas);
  suitBump.wrapS = THREE.RepeatWrapping;
  suitBump.wrapT = THREE.RepeatWrapping;
  suitBump.repeat.set(6, 6);
  suitBump.anisotropy = anisotropy;

  // 3. Photovoltaic Solar Panel Array
  const solarCanvas = document.createElement('canvas');
  solarCanvas.width = 512;
  solarCanvas.height = 512;
  const sCtx = solarCanvas.getContext('2d')!;
  sCtx.fillStyle = '#09152E';
  sCtx.fillRect(0, 0, 512, 512);
  const cols = 8;
  const rows = 16;
  const cellW = 512 / cols;
  const cellH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      sCtx.fillStyle = (r + c) % 2 === 0 ? '#0E244D' : '#112A59';
      sCtx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
      sCtx.fillStyle = 'rgba(210, 225, 255, 0.32)';
      sCtx.fillRect(c * cellW + cellW * 0.48, r * cellH + 3, 2, cellH - 6);
    }
  }
  sCtx.strokeStyle = '#D97706';
  sCtx.lineWidth = 8;
  sCtx.strokeRect(4, 4, 504, 504);

  const solarPanel = new THREE.CanvasTexture(solarCanvas);
  solarPanel.colorSpace = THREE.SRGBColorSpace;
  solarPanel.wrapS = THREE.RepeatWrapping;
  solarPanel.wrapT = THREE.RepeatWrapping;
  solarPanel.repeat.set(2, 1);
  solarPanel.anisotropy = anisotropy;

  // 4. NASA-Style Orbital Hull Plating
  const hullCanvas = document.createElement('canvas');
  hullCanvas.width = 512;
  hullCanvas.height = 512;
  const hCtx = hullCanvas.getContext('2d')!;
  hCtx.fillStyle = '#E6E8EC';
  hCtx.fillRect(0, 0, 512, 512);

  hCtx.strokeStyle = '#94A3B8';
  hCtx.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) {
    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.lineTo(512, y);
    hCtx.stroke();
  }
  for (let x = 0; x <= 512; x += 128) {
    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.lineTo(x, 512);
    hCtx.stroke();
  }

  hCtx.fillStyle = '#FF4D00';
  hCtx.fillRect(0, 200, 512, 46);
  hCtx.fillStyle = '#000000';
  hCtx.fillRect(0, 246, 512, 14);
  hCtx.fillStyle = '#000000';
  hCtx.font = 'bold 28px monospace';
  hCtx.fillText('NASA // AURAMED HAB-01', 28, 232);

  // Subtle NASA blue insignia roundel accent
  hCtx.fillStyle = '#0B3D91';
  hCtx.beginPath();
  hCtx.arc(430, 118, 34, 0, Math.PI * 2);
  hCtx.fill();
  hCtx.strokeStyle = '#FF4D00';
  hCtx.lineWidth = 4;
  hCtx.beginPath();
  hCtx.moveTo(395, 130);
  hCtx.lineTo(432, 95);
  hCtx.lineTo(465, 130);
  hCtx.stroke();

  const hullPanel = new THREE.CanvasTexture(hullCanvas);
  hullPanel.colorSpace = THREE.SRGBColorSpace;
  hullPanel.wrapS = THREE.RepeatWrapping;
  hullPanel.wrapT = THREE.RepeatWrapping;
  hullPanel.anisotropy = anisotropy;

  // 5. Orbital Earth Surface with Oceans, Continents, Clouds & Night-Side Lights
  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 1024;
  earthCanvas.height = 512;
  const eCtx = earthCanvas.getContext('2d')!;
  const oceanGrad = eCtx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#071B3B');
  oceanGrad.addColorStop(0.5, '#0F3D75');
  oceanGrad.addColorStop(1, '#071732');
  eCtx.fillStyle = oceanGrad;
  eCtx.fillRect(0, 0, 1024, 512);

  eCtx.fillStyle = '#1E5146';
  const landmasses: [number, number, number, number, number][] = [
    [190, 180, 120, 62, 0.2],
    [290, 290, 75, 95, -0.3],
    [540, 175, 160, 72, -0.1],
    [590, 285, 88, 92, 0.25],
    [780, 210, 110, 58, 0.15],
    [830, 345, 70, 42, -0.2],
  ];
  for (const [cx, cy, rx, ry, rot] of landmasses) {
    eCtx.beginPath();
    eCtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    eCtx.fill();
  }

  // City light clusters on landmasses
  eCtx.fillStyle = 'rgba(255, 168, 76, 0.72)';
  for (let i = 0; i < 65; i++) {
    const cx = 140 + ((i * 89) % 760);
    const cy = 140 + ((i * 47) % 230);
    eCtx.fillRect(cx, cy, 3, 3);
  }

  eCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 32; i++) {
    const cx = (i * 137) % 1024;
    const cy = 50 + ((i * 73) % 412);
    const w = 90 + ((i * 31) % 140);
    const h = 10 + ((i * 11) % 18);
    eCtx.beginPath();
    eCtx.ellipse(cx, cy, w, h, (i % 5) * 0.08 - 0.16, 0, Math.PI * 2);
    eCtx.fill();
  }

  const earthSurface = new THREE.CanvasTexture(earthCanvas);
  earthSurface.colorSpace = THREE.SRGBColorSpace;
  earthSurface.anisotropy = anisotropy;

  // 6. Lunar Regolith & Crater Surface
  const moonCanvas = document.createElement('canvas');
  moonCanvas.width = 512;
  moonCanvas.height = 256;
  const mCtx = moonCanvas.getContext('2d')!;
  mCtx.fillStyle = '#94A3B8';
  mCtx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 42; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 256;
    const r = 6 + (i % 18);
    mCtx.fillStyle = i % 2 === 0 ? '#7C8BA1' : '#64748B';
    mCtx.beginPath();
    mCtx.arc(x, y, r, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.strokeStyle = '#CBD5E1';
    mCtx.lineWidth = 1.5;
    mCtx.stroke();
  }
  const moonSurface = new THREE.CanvasTexture(moonCanvas);
  moonSurface.colorSpace = THREE.SRGBColorSpace;
  moonSurface.anisotropy = anisotropy;

  return {
    chestDisplay,
    suitBump,
    solarPanel,
    hullPanel,
    earthSurface,
    moonSurface,
    dispose: () => {
      chestDisplay.dispose();
      suitBump.dispose();
      solarPanel.dispose();
      hullPanel.dispose();
      earthSurface.dispose();
      moonSurface.dispose();
    },
  };
}
