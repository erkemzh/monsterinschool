import * as THREE from 'three';

// Cache generated canvas textures to maximize performance
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a dual-tone Soviet school wall texture:
 * Bottom 35%: dark teal-green oil paint wainscoting
 * Top 65%: dingy off-white/beige peeling paint with plaster cracks and water stains
 */
export function getSovietWallTexture(): THREE.CanvasTexture {
  if (textureCache.has('wall')) return textureCache.get('wall')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Top plaster (dingy beige-grey)
  ctx.fillStyle = '#b8b4a8';
  ctx.fillRect(0, 0, 512, 330);

  // Bottom wainscoting (Soviet dark teal-green)
  ctx.fillStyle = '#224036';
  ctx.fillRect(0, 330, 512, 182);

  // Separator stripe
  ctx.fillStyle = '#142620';
  ctx.fillRect(0, 328, 512, 4);

  // Plaster texture / grime
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 330;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Water stain streaks
  ctx.fillStyle = 'rgba(70, 60, 45, 0.12)';
  for (let i = 0; i < 6; i++) {
    const sx = 40 + i * 80 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 15, 0);
    ctx.lineTo(sx + 8, 180 + Math.random() * 100);
    ctx.closePath();
    ctx.fill();
  }

  // Cracks in plaster
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 40);
  ctx.lineTo(160, 90);
  ctx.lineTo(150, 140);
  ctx.lineTo(190, 210);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(380, 80);
  ctx.lineTo(410, 140);
  ctx.lineTo(395, 190);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set('wall', texture);
  return texture;
}

/**
 * Creates aged Soviet parquet wood flooring texture with scuffs and wear
 */
export function getParquetFloorTexture(): THREE.CanvasTexture {
  if (textureCache.has('floor')) return textureCache.get('floor')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3424';
  ctx.fillRect(0, 0, 512, 512);

  // Herringbone / parquet blocks
  const tileSize = 64;
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      const shade = 35 + ((x * 13 + y * 19) % 25);
      ctx.fillStyle = `rgb(${shade + 40}, ${shade + 18}, ${shade})`;
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 8 + g * 14);
        ctx.lineTo(x + tileSize - 2, y + 8 + g * 14);
        ctx.stroke();
      }
    }
  }

  // Dirt & grime overlay
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = 'rgba(10, 5, 0, 0.04)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 10);
  textureCache.set('floor', texture);
  return texture;
}

/**
 * Creates a blackboard with creepy chalk writings, formulas and occult diagrams
 */
export function getChalkboardTexture(): THREE.CanvasTexture {
  if (textureCache.has('chalkboard')) return textureCache.get('chalkboard')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark slate-green chalkboard
  ctx.fillStyle = '#1c2822';
  ctx.fillRect(0, 0, 1024, 512);

  // Wooden frame border
  ctx.strokeStyle = '#5a3d28';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 1008, 496);

  // Chalk dust smudges
  for (let i = 0; i < 12; i++) {
    const rx = 100 + Math.random() * 800;
    const ry = 80 + Math.random() * 350;
    const grad = ctx.createRadialGradient(rx, ry, 10, rx, ry, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(rx - 120, ry - 120, 240, 240);
  }

  // Handwritten chalk equations and creepy notes
  ctx.fillStyle = 'rgba(240, 240, 230, 0.85)';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('14.XI.1974 — КЛАССНЫЙ ЧАС', 60, 70);

  ctx.font = '24px monospace';
  ctx.fillText('E = mc² · ΔS ≥ 0 · lim (t→∞) Ψ = 0', 60, 120);
  ctx.fillText('«МЫ НЕ ВЫЙДЕМ ОТСЮДА»', 60, 170);

  // Ominous crossed out names
  ctx.fillStyle = 'rgba(220, 80, 80, 0.8)';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('СПИСОК ДЕЖУРНЫХ:', 60, 230);
  ctx.font = '22px sans-serif';
  ctx.fillText('1. Смирнов А.  [ВЫЧЕРКНУТО]', 80, 270);
  ctx.fillText('2. Васильев Д. [ВЫЧЕРКНУТО]', 80, 310);
  ctx.fillText('3. Кузнецова О. [НЕ НАЙДЕНА]', 80, 350);

  // Occult symbol chalk sketch on the right
  ctx.strokeStyle = 'rgba(255, 230, 200, 0.75)';
  ctx.lineWidth = 4;
  const cx = 820;
  const cy = 256;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Pentagram
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = cx + 130 * Math.cos(angle);
    const py = cy + 130 * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.font = '18px monospace';
  ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
  ctx.fillText('ЗАКЛЯТИЕ ЗАВУЧА', 740, 440);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('chalkboard', texture);
  return texture;
}

/**
 * Creates Mendeleev's Periodic Table poster for Chemistry lab
 */
export function getPeriodicTableTexture(): THREE.CanvasTexture {
  if (textureCache.has('periodic')) return textureCache.get('periodic')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eadecc';
  ctx.fillRect(0, 0, 512, 340);
  ctx.strokeStyle = '#3a2e20';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 332);

  ctx.fillStyle = '#7a1c1c';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ПЕРИОДИЧЕСКАЯ СИСТЕМА ЭЛЕМЕНТОВ', 256, 32);
  ctx.font = '14px sans-serif';
  ctx.fillText('Д. И. МЕНДЕЛЕЕВА (1969 г.)', 256, 52);

  // Grid of chemical elements
  ctx.textAlign = 'left';
  const elements = [
    'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Fe', 'Cu', 'Zn', 'Br', 'Ag', 'Sn', 'I', 'Ba', 'Au', 'Hg', 'Pb'
  ];

  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1;
  const cols = 8;
  const cellW = 54;
  const cellH = 30;
  elements.forEach((sym, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = 36 + col * cellW;
    const y = 70 + row * cellH;

    ctx.fillStyle = idx % 2 === 0 ? '#f5eedd' : '#ebdfc8';
    ctx.fillRect(x, y, cellW - 2, cellH - 2);
    ctx.strokeRect(x, y, cellW - 2, cellH - 2);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(sym, x + 16, y + 19);
  });

  // Creepy blood smudge across elements
  ctx.fillStyle = 'rgba(120, 20, 20, 0.45)';
  ctx.beginPath();
  ctx.arc(320, 160, 45, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('periodic', texture);
  return texture;
}

/**
 * Creates Soviet school safety & motivational poster
 */
export function getSovietPosterTexture(title: string, sub: string): THREE.CanvasTexture {
  const key = `poster_${title}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Vintage paper
  ctx.fillStyle = '#ded3be';
  ctx.fillRect(0, 0, 380, 512);

  // Red banner
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(16, 16, 348, 64);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 190, 56);

  // Graphic illustration area (e.g. fire extinguisher or book)
  ctx.fillStyle = '#ece4d4';
  ctx.fillRect(24, 100, 332, 280);
  ctx.strokeStyle = '#b8a994';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 100, 332, 280);

  // Flame / symbol
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(190, 240, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(190, 250, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#262626';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(sub, 190, 420);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#525252';
  ctx.fillText('МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ СССР', 190, 470);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates metallic locker doors texture with ventilation louvers and rust
 */
export function getLockerTexture(): THREE.CanvasTexture {
  if (textureCache.has('locker')) return textureCache.get('locker')!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Soviet olive/green painted metal
  ctx.fillStyle = '#2d3f35';
  ctx.fillRect(0, 0, 256, 512);

  // Bevel border
  ctx.strokeStyle = '#1a2820';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 504);

  // Vent louvers
  ctx.fillStyle = '#111b15';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(40, 50 + i * 14, 176, 5);
    ctx.fillRect(40, 380 + i * 14, 176, 5);
  }

  // Handle & Keyhole
  ctx.fillStyle = '#8a8578';
  ctx.fillRect(200, 240, 16, 50);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(205, 260, 6, 12);

  // Stenciled number
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('104', 128, 200);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('locker', texture);
  return texture;
}

/**
 * Creates bookshelf texture filled with vintage cloth-bound books
 */
export function getBookshelfTexture(): THREE.CanvasTexture {
  if (textureCache.has('bookshelf')) return textureCache.get('bookshelf')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark oak wood background
  ctx.fillStyle = '#26170d';
  ctx.fillRect(0, 0, 512, 512);

  const shelves = 4;
  const shelfH = 512 / shelves;

  const bookColors = ['#5a1818', '#1a3326', '#1a2538', '#42331c', '#2c1933', '#474747'];

  for (let s = 0; s < shelves; s++) {
    const yShelf = s * shelfH;

    // Shelf board
    ctx.fillStyle = '#422818';
    ctx.fillRect(0, yShelf + shelfH - 12, 512, 12);

    // Row of books
    let x = 16;
    while (x < 490) {
      const bookW = 12 + Math.floor(Math.random() * 18);
      const bookH = shelfH - 24 - Math.floor(Math.random() * 20);
      const color = bookColors[Math.floor(Math.random() * bookColors.length)];

      ctx.fillStyle = color;
      ctx.fillRect(x, yShelf + (shelfH - 12 - bookH), bookW, bookH);

      // Gold embossing line on spine
      ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.fillRect(x + 2, yShelf + (shelfH - 24), bookW - 4, 3);

      x += bookW + 2;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('bookshelf', texture);
  return texture;
}

/**
 * Creates Occult Altar Pentagram texture for the boiler room
 */
export function getOccultAltarTexture(): THREE.CanvasTexture {
  if (textureCache.has('altar')) return textureCache.get('altar')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // Outer circles
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 230, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  // Inscribed Pentagram
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = 256 + 210 * Math.cos(angle);
    const y = 256 + 210 * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Ancient runes between circles
  ctx.font = '16px monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  for (let i = 0; i < 16; i++) {
    const angle = (i * 2 * Math.PI) / 16;
    const x = 256 + 220 * Math.cos(angle);
    const y = 256 + 220 * Math.sin(angle);
    ctx.fillText('ᚦ', x, y + 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('altar', texture);
  return texture;
}
