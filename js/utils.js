// ── UTILITY FUNCTIONS ─────────────────────────────────────────

function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

function wrapText(text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  ctx.font = 'bold 12px "Nunito",sans-serif';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function easeOut(t){ return 1-(1-t)*(1-t); }

function triggerShake(durationMs, intensity) {
  if (scene && scene.cameras && scene.cameras.main) {
    scene.cameras.main.shake(durationMs, intensity);
  }
}

// ── PARTICLES ─────────────────────────────────────────────────
const PARTS=[], EXPS=[];
function boom(x,y,n=20,cols=['#FF6600','#FF3300','#FFCC00','#FF9900']){
  if(PARTS.length>80)return; // cap total particles for performance
  EXPS.push({x,y,f:0,size:n*4+40,done:false});
  const count=Math.min(n,10);
  for(let i=0;i<count;i++){
    const a=(Math.PI*2/count)*i+Math.random()*0.5, sp=2+Math.random()*5;
    PARTS.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3,r:3+Math.random()*5,
      c:cols[0|Math.random()*cols.length],life:1,dec:0.03+Math.random()*0.02});
  }
}
// Spawn bike exhaust — left/rear of right-facing bike
function spawnBikeExhaust(x, y, scale=1) {
  if(PARTS.length>120)return;
  for(let i=0;i<2;i++){
    PARTS.push({
      x: x + (Math.random()-0.5)*8, y: y + (Math.random()-0.5)*6,
      vx: -1.2 - Math.random()*2.2,
      vy: -0.4 - Math.random()*0.7,
      r: (5 + Math.random()*6)*scale,
      rMax: (22 + Math.random()*18)*scale,
      c: null,
      life: 1, dec: 0.020 + Math.random()*0.016,
      smoke: true, exhaust: true
    });
  }
}

// Spawn dirt/dust kicked up from road under bike wheels
function spawnBikeDirt(x, y, scale=1, spread=1, symmetric=false, width=56) {
  if(PARTS.length>120)return;
  for(let i=0;i<18;i++){
    const vx = (-1.5 - Math.random()*3.5) * spread;
    PARTS.push({
      x: x + (Math.random()-0.5)*width, y: y,
      vx,
      vy: -0.8 - Math.random()*1.8,
      r: (6 + Math.random()*7)*scale,
      rMax: (18 + Math.random()*14)*scale,
      c: null,
      life: 1, dec: 0.032 + Math.random()*0.022,
      smoke: true, dirt: true
    });
  }
}

// Spawn dust/smoke puff at player feet when jumping
function spawnJumpSmoke(x, y) {
  if(PARTS.length>60)return;
  for(let i=0;i<5;i++){
    const a = Math.PI + (Math.random()-0.5)*Math.PI*0.9; // spread sideways-down
    const sp = 0.6 + Math.random()*2.2;
    PARTS.push({
      x: x + (Math.random()-0.5)*18, y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 0.3,
      r: 7 + Math.random()*9,         // start size
      rMax: 18 + Math.random()*14,    // grow to this
      c: null,                        // null = use smoke sprite
      life: 1, dec: 0.028+Math.random()*0.018,
      smoke: true
    });
  }
}

function updateParts(){
  for(let i=PARTS.length-1;i>=0;i--){
    const p=PARTS[i]; p.x+=p.vx; p.y+=p.vy;
    if(!p.smoke) p.vy+=0.15; // no gravity on smoke
    else { p.vx*=0.92; p.vy*=0.92; p.r+=(p.rMax-p.r)*0.08; } // smoke expands & slows
    p.life-=p.dec;
    if(p.life<=0)PARTS.splice(i,1);
  }
  for(let i=EXPS.length-1;i>=0;i--){
    EXPS[i].f++;
    if(EXPS[i].f>=16)EXPS.splice(i,1);
  }
}
function drawParts(){
  for(const p of PARTS){
    ctx.globalAlpha = p.smoke ? p.life * (p.exhaust ? 0.45 : 0.55) : p.life;
    if(p.smoke && !p.exhaust && VFX.smoke && VFX.smoke.complete){
      ctx.drawImage(VFX.smoke, p.x-p.r, p.y-p.r, p.r*2, p.r*2);
    } else if(p.smoke && p.dirt){
      // Road dirt — tan/brown kicked-up dust
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`rgba(160,120,70,${p.life*0.75})`);
      g.addColorStop(1,`rgba(180,140,90,0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    } else if(p.smoke && p.exhaust){
      // Bike exhaust — dark grey fumes
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`rgba(80,75,70,${p.life*0.7})`);
      g.addColorStop(1,`rgba(140,130,120,0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = p.smoke ? `rgba(210,200,185,${p.life*0.6})` : p.c;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha=1;
  // Sprite explosions (4×4 grid, 256×256 per frame)
  if(SP.exp && spriteReady(SP.exp)){
    for(const e of EXPS){
      const fi=Math.min(e.f,15);
      const sx=(fi%4)*256, sy=Math.floor(fi/4)*256;
      const alpha=fi<14?1:1-(fi-13)/2;
      ctx.globalAlpha=alpha;
      ctx.globalCompositeOperation='screen';
      ctx.drawImage(SP.exp,sx,sy,256,256, e.x-e.size/2, e.y-e.size/2, e.size, e.size);
      ctx.globalCompositeOperation='source-over';
    }
    ctx.globalAlpha=1;
  }
}

function drawHole(h){
  const spr = SP.obs_hole;
  if(spr && (spr.complete||spr instanceof HTMLCanvasElement) && (spr.naturalWidth>0||spr instanceof HTMLCanvasElement)){
    // Scale sprite so its width is wider than the hole to show the rim
    const sprW = h.w * 1.8;
    const natW = spr.naturalWidth || spr.width;
    const natH = spr.naturalHeight || spr.height;
    const sprH = sprW * (natH / natW);
    const sx = h.x + h.w/2 - sprW/2;
    // Position so ~60% of sprite height is above ground (the rim/opening), 40% below
    const sy = GY - sprH * 0.6 + 20;
    ctx.drawImage(spr, sx, sy, sprW, sprH);
  } else {
    // Canvas fallback
    ctx.fillStyle='#050305';ctx.fillRect(h.x,GY,h.w,80);
    const dg=ctx.createRadialGradient(h.x+h.w/2,GY+40,4,h.x+h.w/2,GY+40,h.w*.7);
    dg.addColorStop(0,'rgba(180,0,0,0.25)'); dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dg; ctx.fillRect(h.x,GY,h.w,80);
    const pulse=0.45+0.3*Math.sin(frame*0.12);
    ctx.shadowColor='#FF2200'; ctx.shadowBlur=14;
    ctx.strokeStyle=`rgba(255,50,0,${pulse})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(h.x,GY); ctx.lineTo(h.x+h.w,GY); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle='#3A3028';
    for(let cx=h.x;cx<h.x+h.w;cx+=9){
      const jh=3+Math.sin(cx*0.7+frame*0.05)*3;
      ctx.fillRect(cx,GY-jh,7,jh+2);
    }
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();
    ctx.ellipse(h.x+h.w/2,GY+12,h.w*.42,9,0,0,Math.PI*2);ctx.fill();
  }
}
