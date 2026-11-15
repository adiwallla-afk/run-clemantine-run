// ═══════════════════════════════════════════════════════════════
// PAC-SHAWGI — maze mode. Shawgi eats clementines, chased by the
// same four cast members (and their real sprites) from the runner:
// Forelli (forklift), Felix (run-cycle), Sahar (biker), Helicopter
// (free-flying, ignores walls — same as in the runner).
// Movement model: integer col/row + travel fraction (0..1) between
// cell centers — avoids the rounding-based "stuck" bug entirely.
// ═══════════════════════════════════════════════════════════════

// ── GRID ──────────────────────────────────────────────────────
const PCELL = 26;
const PCOLS = 27, PROWS = 13;
const PTUNNEL_ROW = 6;
const POFFX = Math.floor((W - PCOLS * PCELL) / 2);
const POFFY = 38;
const PHOUSE = { col: 13, row: 6 };

function buildMazeTemplate() {
  const g = [];
  for (let r = 0; r < PROWS; r++) g.push(new Array(PCOLS).fill('.'));
  for (let c = 0; c < PCOLS; c++) { g[0][c] = '#'; g[PROWS - 1][c] = '#'; }
  for (let r = 0; r < PROWS; r++) { g[r][0] = '#'; g[r][PCOLS - 1] = '#'; }
  g[PTUNNEL_ROW][0] = ' '; g[PTUNNEL_ROW][PCOLS - 1] = ' ';
  for (let c = 12; c <= 14; c++) { g[5][c] = '#'; g[7][c] = '#'; }
  g[6][12] = '#'; g[6][14] = '#';
  g[5][13] = ' '; g[6][13] = ' ';
  const mirrorC = c => (PCOLS - 1) - c;
  const mirrorR = r => (PROWS - 1) - r;
  function pillar(r0, c0, r1, c1) {
    [[r0, c0, r1, c1], [r0, mirrorC(c1), r1, mirrorC(c0)],
     [mirrorR(r1), c0, mirrorR(r0), c1], [mirrorR(r1), mirrorC(c1), mirrorR(r0), mirrorC(c0)]]
      .forEach(([ra, ca, rb, cb]) => { for (let r = ra; r <= rb; r++) for (let c = ca; c <= cb; c++) g[r][c] = '#'; });
  }
  pillar(1, 2, 2, 3);
  pillar(1, 9, 2, 10);
  pillar(3, 5, 4, 6);
  [[1, 1], [1, PCOLS - 2], [PROWS - 2, 1], [PROWS - 2, PCOLS - 2]].forEach(([r, c]) => { g[r][c] = 'o'; });
  g[10][13] = ' ';
  return g;
}
const PAC_TEMPLATE = buildMazeTemplate();
let MAZE = [];

function pacCanStep(col, row, dir) {
  const nr = row + dir.dy;
  let nc = col + dir.dx;
  if (nr < 0 || nr >= PROWS) return false;
  if (row === PTUNNEL_ROW || nr === PTUNNEL_ROW) { if (nc < 0) nc += PCOLS; else if (nc >= PCOLS) nc -= PCOLS; }
  else if (nc < 0 || nc >= PCOLS) return false;
  return MAZE[nr][nc] !== '#';
}
function pacCX(col) { return POFFX + col * PCELL + PCELL / 2; }
function pacCY(row) { return POFFY + row * PCELL + PCELL / 2; }

const PDIR = { U: { dx: 0, dy: -1 }, D: { dx: 0, dy: 1 }, L: { dx: -1, dy: 0 }, R: { dx: 1, dy: 0 } };
function pacOpposite(d) { return d ? { dx: -d.dx, dy: -d.dy } : null; }

// Integer col/row + frac (0..1 progress toward the next cell) — no
// rounding-based "current cell" guesswork, so no resonance/stuck bug.
function pacMove(e) {
  if (e.frac === 0) {
    if (e.nextDir && pacCanStep(e.col, e.row, e.nextDir)) e.dir = e.nextDir;
  }
  if (!e.dir || !pacCanStep(e.col, e.row, e.dir)) {
    e.x = pacCX(e.col); e.y = pacCY(e.row);
    return;
  }
  e.frac += e.speed / PCELL;
  if (e.frac >= 1) {
    e.frac -= 1;
    let nc = e.col + e.dir.dx, nr = e.row + e.dir.dy;
    if (e.row === PTUNNEL_ROW) { if (nc < 0) nc += PCOLS; else if (nc >= PCOLS) nc -= PCOLS; }
    e.col = nc; e.row = nr;
    if (e.nextDir && pacCanStep(e.col, e.row, e.nextDir)) e.dir = e.nextDir;
    if (!pacCanStep(e.col, e.row, e.dir)) e.frac = 0;
  }
  const cx1 = pacCX(e.col), cy1 = pacCY(e.row);
  const cx2 = pacCX(e.col + e.dir.dx), cy2 = pacCY(e.row + e.dir.dy);
  e.x = cx1 + (cx2 - cx1) * e.frac;
  e.y = cy1 + (cy2 - cy1) * e.frac;
}

// ── PLAYER ────────────────────────────────────────────────────
const pacPlayer = { col: 13, row: 10, frac: 0, dir: null, nextDir: null, speed: 2.3, x: 0, y: 0, facingLeft: false, runT: 0 };

// ── GHOSTS ────────────────────────────────────────────────────
function pacDist2(c1, r1, c2, r2) { const dc = c1 - c2, dr = r1 - r2; return dc * dc + dr * dr; }

const PAC_GHOSTS = [
  { name: 'FORELLI', color: '#FF8C00', kind: 'forklift', home: { col: 25, row: 1 }, baseSpeed: 1.9,
    getTarget() { return { col: pacPlayer.col, row: pacPlayer.row }; } },
  { name: 'FELIX', color: '#CC3300', kind: 'felix', home: { col: 1, row: 1 }, baseSpeed: 1.9,
    getTarget() {
      const d = pacPlayer.dir || PDIR.L;
      return { col: pacPlayer.col + d.dx * 4, row: pacPlayer.row + d.dy * 4 };
    } },
  { name: 'SAHAR', color: '#AA44FF', kind: 'biker', home: { col: 25, row: 11 }, baseSpeed: 1.85,
    getTarget() {
      if (pacDist2(pacPlayer.col, pacPlayer.row, this.col, this.row) < 36) return this.home;
      return { col: pacPlayer.col, row: pacPlayer.row };
    } },
].map((g, i) => Object.assign(g, {
  col: PHOUSE.col, row: PHOUSE.row, frac: 0, dir: null, nextDir: null,
  x: 0, y: 0, speed: g.baseSpeed, state: 'house', releaseAt: i * 180,
}));

// Helicopter: free-flying, ignores the grid entirely — same as the runner.
const PAC_HELI = { name: 'HELICOPTER', color: '#2244AA', x: 0, y: 0, bobT: 0, rotor: 0, speed: 1.6, active: false, releaseAt: 540 };

function pacChooseGhostDir(g) {
  const opts = [PDIR.U, PDIR.L, PDIR.D, PDIR.R].filter(d => pacCanStep(g.col, g.row, d));
  if (opts.length === 0) return;
  const rev = pacOpposite(g.dir);
  let pool = opts.filter(d => !(rev && d.dx === rev.dx && d.dy === rev.dy));
  if (pool.length === 0) pool = opts;
  const target = g.state === 'frightened' ? { col: pacPlayer.col, row: pacPlayer.row }
    : g.state === 'eaten' ? { col: PHOUSE.col, row: PHOUSE.row }
    : g.getTarget();
  let best = pool[0], bestScore = g.state === 'frightened' ? -Infinity : Infinity;
  for (const d of pool) {
    const nc = g.col + d.dx, nr = g.row + d.dy;
    const sc = pacDist2(nc, nr, target.col, target.row);
    if (g.state === 'frightened') { if (sc > bestScore) { bestScore = sc; best = d; } }
    else if (sc < bestScore) { bestScore = sc; best = d; }
  }
  g.nextDir = best;
}

// ── STATE ─────────────────────────────────────────────────────
let pacScore = 0, pacBest = Number(localStorage.getItem('pac_best') || 0);
let pacLives = 3, pacLevel = 1, pacDotsLeft = 0, pacCombo = 0, pacFrightTimer = 0;
let pacState = 'ready'; // ready|playing|dead|levelclear|over
let pacFrame = 0, pacLevelTimer = 0, pacDeathLine = '';
const PAC_PARTS = [];

function pacBoom(x, y, n, cols) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
    PAC_PARTS.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 3 + Math.random() * 3, c: cols[0 | Math.random() * cols.length], life: 1 });
  }
}
function pacUpdateParts() {
  for (let i = PAC_PARTS.length - 1; i >= 0; i--) {
    const p = PAC_PARTS[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
    if (p.life <= 0) PAC_PARTS.splice(i, 1);
  }
}
function pacDrawParts() {
  for (const p of PAC_PARTS) { ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
}

function pacCountDots() {
  let n = 0;
  for (let r = 0; r < PROWS; r++) for (let c = 0; c < PCOLS; c++) if (MAZE[r][c] === '.' || MAZE[r][c] === 'o') n++;
  return n;
}

function playPacMusic() {
  SFX.bg.loop = true; SFX.bg.volume = 0.22; SFX.bg.currentTime = 0;
  SFX.bg.play().catch(() => {});
}
function stopPacMusic() { SFX.bg.pause(); }

function startPacGame() {
  MAZE = PAC_TEMPLATE.map(row => row.slice());
  pacScore = 0; pacLives = 3; pacLevel = 1; pacCombo = 0; pacFrightTimer = 0;
  pacState = 'ready'; pacFrame = 0; PAC_PARTS.length = 0;
  pacResetPositions();
  pacDotsLeft = pacCountDots();
  playPacMusic();
}
function pacNextLevel() {
  MAZE = PAC_TEMPLATE.map(row => row.slice());
  pacLevel++; pacCombo = 0; pacFrightTimer = 0;
  pacResetPositions();
  pacDotsLeft = pacCountDots();
  pacState = 'ready';
}
function pacResetPositions() {
  pacPlayer.col = 13; pacPlayer.row = 10; pacPlayer.frac = 0; pacPlayer.dir = null; pacPlayer.nextDir = null;
  pacPlayer.x = pacCX(13); pacPlayer.y = pacCY(10);
  PAC_GHOSTS.forEach((g, i) => {
    g.col = PHOUSE.col; g.row = PHOUSE.row; g.frac = 0; g.dir = null; g.nextDir = null;
    g.x = pacCX(g.col); g.y = pacCY(g.row);
    g.state = 'house'; g.releaseAt = i * 180;
    g.activeSpeed = g.baseSpeed + (pacLevel - 1) * 0.12;
    g.speed = g.activeSpeed;
  });
  PAC_HELI.active = false; PAC_HELI.releaseAt = 540; PAC_HELI.x = W + 60; PAC_HELI.y = POFFY + 20; PAC_HELI.bobT = 0;
}

function pacLoseLife() {
  pacLives--;
  pacBoom(pacPlayer.x, pacPlayer.y, 16, ['#FFDAB9', '#CC2200', '#FF6600']);
  if (pacLives <= 0) {
    if (pacScore > pacBest) { pacBest = pacScore; localStorage.setItem('pac_best', String(pacBest)); }
    pacDeathLine = DEATH_LINES[0 | Math.random() * DEATH_LINES.length];
    stopPacMusic(); playDeath();
    pacState = 'dead';
    setTimeout(() => { pacState = 'over'; }, 1200);
  } else {
    pacResetPositions();
    pacState = 'ready';
  }
}

function pacEatAtPlayer() {
  const { col, row } = pacPlayer;
  const cell = MAZE[row] && MAZE[row][col];
  if (cell === '.') {
    MAZE[row][col] = ' '; pacDotsLeft--; pacScore += 10;
    pacBoom(pacPlayer.x, pacPlayer.y, 3, ['#FF8800', '#FFCC00']);
  } else if (cell === 'o') {
    MAZE[row][col] = ' '; pacDotsLeft--; pacScore += 50;
    pacFrightTimer = 360; pacCombo = 0;
    pacBoom(pacPlayer.x, pacPlayer.y, 10, ['#FF8800', '#FFCC00', '#FF4400']);
    PAC_GHOSTS.forEach(g => { if (g.state === 'active') g.state = 'frightened'; });
  }
}

function pacCheckCollisions() {
  for (const g of PAC_GHOSTS) {
    if (g.state === 'house') continue;
    if (Math.abs(g.x - pacPlayer.x) < 22 && Math.abs(g.y - pacPlayer.y) < 22) {
      if (g.state === 'frightened') {
        g.state = 'eaten';
        pacCombo = Math.min(pacCombo + 1, 4);
        pacScore += 200 * Math.pow(2, pacCombo - 1);
        pacBoom(g.x, g.y, 14, ['#FFFFFF', '#88CCFF', g.color]);
      } else if (g.state !== 'eaten') {
        pacLoseLife();
        return;
      }
    }
  }
  if (PAC_HELI.active && Math.abs(PAC_HELI.x - pacPlayer.x) < 34 && Math.abs(PAC_HELI.y - pacPlayer.y) < 30) {
    pacLoseLife();
  }
}

// ── UPDATE ────────────────────────────────────────────────────
function pacUpdate() {
  if (pacState === 'ready' || pacState === 'dead' || pacState === 'over') { pacFrame++; return; }
  if (pacState === 'levelclear') {
    pacFrame++; pacLevelTimer--;
    if (pacLevelTimer <= 0) pacNextLevel();
    return;
  }
  pacFrame++;

  if (pacPlayer.nextDir) { if (pacPlayer.nextDir.dx < 0) pacPlayer.facingLeft = true; else if (pacPlayer.nextDir.dx > 0) pacPlayer.facingLeft = false; }
  pacMove(pacPlayer);
  if (pacPlayer.dir) pacPlayer.runT += 0.22;
  pacEatAtPlayer();

  for (const g of PAC_GHOSTS) {
    if (g.state === 'house') { if (pacFrame >= g.releaseAt) g.state = 'active'; continue; }
    if (g.state === 'eaten' && g.col === PHOUSE.col && g.row === PHOUSE.row && g.frac === 0) { g.state = 'house'; g.releaseAt = pacFrame + 40; continue; }
    // Always derive from the immutable per-level baseline (g.activeSpeed) —
    // never from g.speed itself, so a frightened/eaten dip can't "stick"
    // once the ghost returns to its normal active state.
    g.speed = g.state === 'frightened' ? g.activeSpeed * 0.55 : g.state === 'eaten' ? g.activeSpeed * 2.4 : g.activeSpeed;
    pacChooseGhostDir(g);
    pacMove(g);
  }

  if (!PAC_HELI.active && pacFrame >= PAC_HELI.releaseAt) PAC_HELI.active = true;
  if (PAC_HELI.active) {
    PAC_HELI.bobT += 0.05; PAC_HELI.rotor += 0.3;
    const targetX = pacPlayer.x, targetY = POFFY + 20 + Math.sin(PAC_HELI.bobT) * 10;
    PAC_HELI.x += (targetX - PAC_HELI.x) * 0.02;
    PAC_HELI.y += (targetY - PAC_HELI.y) * 0.04;
  }

  if (pacFrightTimer > 0) {
    pacFrightTimer--;
    if (pacFrightTimer === 0) { PAC_GHOSTS.forEach(g => { if (g.state === 'frightened') g.state = 'active'; }); pacCombo = 0; }
  }
  pacCheckCollisions();
  pacUpdateParts();
  if (pacDotsLeft <= 0) { pacState = 'levelclear'; pacLevelTimer = 140; pacScore += 500; }
}

// ── DRAW ──────────────────────────────────────────────────────
function pacDrawMaze() {
  ctx.fillStyle = '#120A02'; ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < PROWS; r++) {
    for (let c = 0; c < PCOLS; c++) {
      const cell = MAZE[r][c];
      const x = POFFX + c * PCELL, y = POFFY + r * PCELL;
      if (cell === '#') {
        ctx.fillStyle = '#7A5000'; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, PCELL - 2, PCELL - 2, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,180,80,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, PCELL - 2, PCELL - 2, 4); ctx.stroke();
      } else if (cell === '.') {
        ctx.fillStyle = '#FF8800'; ctx.beginPath(); ctx.arc(x + PCELL / 2, y + PCELL / 2, 3, 0, Math.PI * 2); ctx.fill();
      } else if (cell === 'o') {
        const pulse = 0.6 + 0.4 * Math.sin(pacFrame * 0.15);
        ctx.fillStyle = `rgba(255,136,0,${pulse})`; ctx.beginPath(); ctx.arc(x + PCELL / 2, y + PCELL / 2, 7, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function pacDrawPlayer() {
  const p = pacPlayer;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.facingLeft) ctx.scale(-1, 1);
  const fi = Math.floor(p.runT * 2) % 25;
  const img = SP.run && SP.run[fi];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, 256, 256, -26, -26, 52, 52);
  } else {
    ctx.fillStyle = '#CC2200'; ctx.beginPath(); ctx.arc(0, 0, 18, 0.25, Math.PI * 2 - 0.25); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function pacDrawGhost(g) {
  if (g.state === 'house' && pacFrame < g.releaseAt - 160) return;
  ctx.save();
  ctx.translate(g.x, g.y);
  const facingLeft = g.dir === PDIR.L;
  if (g.state === 'eaten') {
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(-6, -3, 5, 0, Math.PI * 2); ctx.arc(6, -3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  if (g.state === 'frightened') {
    const flashing = pacFrightTimer < 100 && Math.floor(pacFrightTimer / 8) % 2 === 0;
    ctx.fillStyle = flashing ? '#FFFFFF' : '#5555EE';
    ctx.beginPath(); ctx.arc(0, -3, 16, Math.PI, 0); ctx.lineTo(16, 14);
    for (let i = 0; i < 3; i++) ctx.lineTo(16 - (i + 1) * (32 / 3), i % 2 === 0 ? 14 : 6);
    ctx.lineTo(-16, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-3, -6); ctx.moveTo(3, -6); ctx.lineTo(9, -6); ctx.stroke();
    ctx.restore();
    if (g !== PAC_HELI) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '9px "Nunito",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(g.name, g.x, g.y + 32); }
    return;
  }
  if (facingLeft) ctx.scale(-1, 1);
  if (g.kind === 'forklift' && spriteReady(SP.fkSprite)) {
    const img = SP.fkSprite;
    const sw = img instanceof HTMLCanvasElement ? img.width : (img.naturalWidth || 256);
    const sh = img instanceof HTMLCanvasElement ? img.height : (img.naturalHeight || 256);
    ctx.drawImage(img, 0, 0, sw, sh, -29, -24, 58, 46);
  } else if (g.kind === 'felix' && SP.felix && SP.felix.length) {
    const fi = Math.floor(pacFrame * 0.3) % 25;
    const img = SP.felix[fi];
    if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, -29, -51, 58, 56);
    else { ctx.fillStyle = g.color; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); }
  } else if (g.kind === 'biker') {
    const spr = spriteReady(SP.sahar) ? SP.sahar : (spriteReady(SP.bk) ? SP.bk : null);
    if (spr) ctx.drawImage(spr, -29, -41, 68, 54);
    else { ctx.fillStyle = g.color; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = g.color; ctx.beginPath(); ctx.arc(0, -3, 16, Math.PI, 0); ctx.lineTo(16, 14);
    for (let i = 0; i < 3; i++) ctx.lineTo(16 - (i + 1) * (32 / 3), i % 2 === 0 ? 14 : 6);
    ctx.lineTo(-16, 14); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '9px "Nunito",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y + 32);
}

function pacDrawHeli() {
  if (!PAC_HELI.active) return;
  const x = PAC_HELI.x, y = PAC_HELI.y;
  ctx.save();
  ctx.fillStyle = '#2244AA'; ctx.beginPath(); ctx.ellipse(x, y, 27, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#77CCFF'; ctx.beginPath(); ctx.ellipse(x + 12, y - 2, 10, 7.5, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1A3399'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 44, y - 8); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 12); ctx.rotate(PAC_HELI.rotor);
  ctx.strokeStyle = 'rgba(100,130,220,.65)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '9px "Nunito",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('HELICOPTER', x, y + 27);
}

function pacDrawHUD() {
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,.48)'; ctx.beginPath(); ctx.roundRect(10, 8, 130, 30, 6); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 18px "Fredoka One",cursive'; ctx.fillText(pacScore, 16, 29);
  ctx.fillStyle = '#FFD700'; ctx.font = '9px "Nunito",sans-serif'; ctx.fillText('BEST ' + pacBest, 80, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 13px "Fredoka One",cursive'; ctx.fillText('PAC-SHAWGI  ·  LVL ' + pacLevel, W / 2, 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FF2244'; ctx.font = 'bold 14px "Fredoka One",cursive';
  ctx.fillText('♥'.repeat(Math.max(0, pacLives)), W - 14, 26);
  ctx.textAlign = 'left';
}

function pacRender() {
  ctx.clearRect(0, 0, W, H);
  pacDrawMaze();
  for (const g of PAC_GHOSTS) pacDrawGhost(g);
  pacDrawHeli();
  pacDrawPlayer();
  pacDrawParts();
  pacDrawHUD();

  if (pacState === 'ready') {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px "Fredoka One",cursive';
    ctx.shadowColor = 'rgba(255,140,0,.7)'; ctx.shadowBlur = 20;
    ctx.fillText('PAC-SHAWGI', W / 2, H / 2 - 20);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF'; ctx.font = '14px "Nunito",sans-serif';
    ctx.fillText('Arrows/WASD to move  ·  SPACE to run  ·  ESC for menu', W / 2, H / 2 + 14);
  } else if (pacState === 'levelclear') {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px "Fredoka One",cursive';
    ctx.fillText('ORCHARD CLEARED!', W / 2, H / 2);
    ctx.fillStyle = '#FFF'; ctx.font = '14px "Nunito",sans-serif';
    ctx.fillText('Level ' + (pacLevel + 1) + ' incoming...', W / 2, H / 2 + 26);
  } else if (pacState === 'over') {
    ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#660000'; ctx.shadowBlur = 24;
    ctx.fillStyle = '#8B0000'; ctx.font = 'bold 60px "Fredoka One",cursive';
    ctx.fillText('CAUGHT', W / 2, H / 2 - 50);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(200,160,160,.9)'; ctx.font = '13px "Nunito",sans-serif';
    pacDeathLine.split('\n').forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 - 16 + i * 18));
    ctx.fillStyle = '#FFF'; ctx.font = '18px "Nunito",sans-serif'; ctx.fillText('Score: ' + pacScore, W / 2, H / 2 + 40);
    ctx.fillStyle = '#FFD700'; ctx.fillText('Best: ' + pacBest, W / 2, H / 2 + 62);
    const pulse = 0.84 + 0.16 * Math.sin(pacFrame * 0.12);
    ctx.save(); ctx.translate(W / 2, H * 0.86); ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.roundRect(-130, -22, 260, 46, 23); ctx.fill();
    ctx.fillStyle = '#8B0000'; ctx.font = 'bold 17px "Fredoka One",cursive'; ctx.fillText('R TO RESTART · ESC MENU', 0, 7);
    ctx.restore();
  }
}
