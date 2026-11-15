// ── OBSTACLES ─────────────────────────────────────────────────
const OBS=[], HOLES=[], UAVS=[];
// jump = ground obstacle, player must jump over
// crouch = overhead barrier, player must crouch under
const OB_TYPES=['car','cart','clem_box','clem_rocket','donkey','drone','rocket','wall','sanna'];

function spawnOb(){
  if(Math.random()<0.18){
    HOLES.push({x:W+50,w:70+Math.random()*60});
    return;
  }
  if(phase>=1 && Math.random()<0.25){
    const ob = {t:'crouch',x:W+60,w:58,h:55,y:GY-90};
    OBS.push(ob);
    _attachObBody(ob);
    return;
  }
  if(phase>=2 && Math.random()<0.30){
    spawnUAV();
    return;
  }
  const t=OB_TYPES[0|Math.random()*OB_TYPES.length];
  const dim={crate:[60,50],drone:[90,45],rocket:[80,35],wall:[70,50],sanna:[80,55],
             car:[130,60],cart:[110,52],clem_box:[75,58],clem_rocket:[85,58],donkey:[90,58]};
  const [w,h]=dim[t];
  const ob = {t,x:W+60,w,h,y:GY-h,jump:true};
  OBS.push(ob);
  _attachObBody(ob);
}

function _attachObBody(ob) {
  if (!scene || !scene._obsGroup) return;
  if (ob.t === 'crouch') return; // bees handled manually in checkCol so crouching is respected
  const body = scene._obsGroup.create(ob.x + ob.w/2, ob.y + ob.h/2, '__DEFAULT');
  body.setDisplaySize(ob.w, ob.h).setAlpha(0).setImmovable(true);
  body.body.allowGravity = false;
  ob._body = body;
}

// UAV_Y: flies at a height that hits standing player (top ~GY-80) but clears crouching (top ~GY-44)
const UAV_Y = GY - 110;
const UAV_W = 80, UAV_H = 38;
function spawnHabibi(startX=W+60){
  const ob = {t:'habibi', x:startX, w:100, h:185, y:GY-185, jump:true};
  OBS.push(ob);
  _attachObBody(ob);
}

function spawnUAV(){
  // Slight height variation per wave
  const yOff = (Math.random()<0.5)?0:10;
  UAVS.push({x:W+80, y:UAV_Y+yOff, w:UAV_W, h:UAV_H, rotorT:0});
}

function drawUAV(u){
  ctx.save();
  ctx.translate(u.x + u.w/2, u.y + u.h/2);
  // Body
  ctx.fillStyle='#2255AA';
  ctx.beginPath();ctx.roundRect(-u.w/2+8,-8,u.w-16,16,5);ctx.fill();
  ctx.fillStyle='#3377CC';
  ctx.beginPath();ctx.roundRect(-u.w/2+14,-5,u.w-28,10,3);ctx.fill();
  // Wings
  ctx.fillStyle='#1A3E7A';
  ctx.fillRect(-u.w/2,-4,u.w,8);
  // Rotors (4 spinning discs)
  ctx.fillStyle='rgba(180,220,255,0.55)';
  const rx=[-u.w/2+4, u.w/2-4, -u.w/2+4, u.w/2-4];
  const ry=[-u.h/2+4, -u.h/2+4, u.h/2-4, u.h/2-4];
  for(let i=0;i<4;i++){
    ctx.save();ctx.translate(rx[i],ry[i]);ctx.rotate(u.rotorT*(i%2===0?1:-1));
    ctx.beginPath();ctx.ellipse(0,0,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Camera/lens dot
  ctx.fillStyle='#FF3333';
  ctx.beginPath();ctx.arc(0,10,4,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Warning flash underneath
  const flash=Math.floor(u.rotorT*3)%4<2;
  if(flash){
    ctx.fillStyle='rgba(255,60,60,0.18)';
    ctx.beginPath();ctx.ellipse(u.x+u.w/2,GY-2,u.w*.4,8,0,0,Math.PI*2);ctx.fill();
  }
}

function drawObstacleShadow(x,y,w){
  ctx.fillStyle='rgba(0,0,0,0.28)';
  ctx.beginPath();ctx.ellipse(x+w/2,y+4,w*.45,5,0,0,Math.PI*2);ctx.fill();
}
function drawCrate(x,y,w,h){
  drawObstacleShadow(x,y+h,w);
  ctx.fillStyle='#C8860A';ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();
  ctx.strokeStyle='#7A5000';ctx.lineWidth=2;
  ctx.strokeRect(x+2,y+2,w-4,h-4);
  ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);
  ctx.moveTo(x,y+h/2);ctx.lineTo(x+w,y+h/2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+w-4,y+h-4);
  ctx.moveTo(x+w-4,y+4);ctx.lineTo(x+4,y+h-4);ctx.stroke();
}
function drawRock(x,y,w,h){
  drawObstacleShadow(x,y+h,w);
  ctx.fillStyle='#7A7A7A';ctx.beginPath();
  ctx.moveTo(x+w*.2,y+h);ctx.lineTo(x,y+h*.6);ctx.lineTo(x+w*.1,y+h*.2);
  ctx.lineTo(x+w*.4,y);ctx.lineTo(x+w*.7,y);ctx.lineTo(x+w,y+h*.3);
  ctx.lineTo(x+w*.9,y+h*.7);ctx.lineTo(x+w*.8,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#AAA';ctx.beginPath();ctx.ellipse(x+w*.35,y+h*.3,w*.15,h*.1,-0.3,0,Math.PI*2);ctx.fill();
}
function drawFence(x,y,w,h){
  drawObstacleShadow(x,y+h,w);
  ctx.strokeStyle='#6B3A1A';ctx.lineWidth=3;
  for(let i=0;i<=2;i++){const px=x+(w/2)*i;ctx.beginPath();ctx.moveTo(px,y+h);ctx.lineTo(px,y);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x,y+h*.3);ctx.lineTo(x+w,y+h*.3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+h*.65);ctx.lineTo(x+w,y+h*.65);ctx.stroke();
  ctx.strokeStyle='#AAA';ctx.lineWidth=1;ctx.beginPath();
  let wx=x;ctx.moveTo(wx,y+h*.3);
  while(wx<x+w){ctx.lineTo(wx+8,y+h*.48);ctx.lineTo(wx+16,y+h*.3);wx+=16;}
  ctx.stroke();
}
function drawDebris(x,y,w,h){
  ctx.fillStyle='#666';
  for(let i=0;i<4;i++){
    ctx.save();ctx.translate(x+w*.22*i+4,y+h*.5);ctx.rotate(.3*i);
    ctx.fillRect(-6,-3,11+i*2,5);ctx.restore();
  }
}

// ── MISSILES & BULLETS ────────────────────────────────────────
const MISS=[], BULLS=[];

function spawnMissileWave(){
  const n=3+0|Math.random()*4;
  const ys=[GY-40,GY-45,GY-50]; // all in crouch-to-dodge zone (hits standing, clears crouching)
  for(let i=0;i<n;i++){
    MISS.push({x:W+60+i*110,y:ys[0|Math.random()*ys.length],spd:spd+3,trail:[],rt:0|Math.random()*3});
  }
  playMissileSound();
  playAmberAlert();
  warnText='!!! IRANIAN MISSILES INCOMING !!!';warnTimer=90;
}
function spawnBullet(){
  const y = GY - 55; // medium height — ducking clears it, standing gets hit
  BULLS.push({x:BK.x+60,y,spd:spd+8});
}
function drawMissile(m){
  // Flame trail
  if(m.trail.length>1){
    ctx.strokeStyle='rgba(255,140,0,.45)';ctx.lineWidth=4;ctx.beginPath();
    ctx.moveTo(m.trail[0].x,m.trail[0].y);
    for(let i=1;i<m.trail.length;i++)ctx.lineTo(m.trail[i].x,m.trail[i].y);
    ctx.stroke();
  }
  const imgs=[SP.r1,SP.r2,SP.r3];
  const img=imgs[m.rt||0];
  ctx.save();
  ctx.translate(m.x,m.y);
  if(spriteReady(img)){
    // Rocket image is vertical (nose UP). Rotate -90° so nose points LEFT (direction of travel).
    ctx.rotate(-Math.PI/2);
    ctx.globalCompositeOperation='screen'; // strips black background
    ctx.drawImage(img,-11,-24,22,48);      // 22px tall, 48px long in screen space
    ctx.globalCompositeOperation='source-over';
  } else {
    // Canvas fallback
    ctx.fillStyle='#CCC';ctx.beginPath();ctx.roundRect(-20,-6,30,12,3);ctx.fill();
    ctx.fillStyle='#FF4400';ctx.beginPath();ctx.moveTo(10,-6);ctx.lineTo(22,0);ctx.lineTo(10,6);ctx.fill();
    ctx.fillStyle='#FF6600';ctx.beginPath();ctx.ellipse(-26,0,8,4,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function drawBullet(b){
  ctx.save();ctx.translate(b.x,b.y);
  if(b.ltr){
    // Left-to-right bullet — red tracer with tail pointing left
    ctx.fillStyle='#FF2200';ctx.beginPath();ctx.ellipse(0,0,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,80,0,.4)';ctx.beginPath();ctx.ellipse(-10,0,14,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FF8800';ctx.beginPath();ctx.ellipse(4,0,4,2,0,0,Math.PI*2);ctx.fill();
  } else {
    ctx.fillStyle='#FFD700';ctx.beginPath();ctx.ellipse(0,0,8,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFF';ctx.beginPath();ctx.ellipse(4,0,3,2,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// ── CHECKPOINT BUILDING  (sprite_checkpoint_building) ────────
function drawCPBldg(b){
  const x=b.x, ph=b.ph;
  if(ph===3 && spriteReady(SP.cp_sanna)){
    const spr=SP.cp_sanna;
    const drawH=260, drawW=drawH*(spr.naturalWidth/spr.naturalHeight);
    ctx.drawImage(spr, x, GY-drawH, drawW, drawH);
    return;
  }
  const cols=['#FF8C00','#CC3300','#6600CC','#FF0044'];
  const col=cols[ph]||'#888';
  const dark=col.replace('#','');
  // Wide industrial complex — two towers + arch bridge
  // Left tower
  ctx.fillStyle='#2A2A3A';ctx.fillRect(x,GY-220,60,220);
  // Right tower
  ctx.fillStyle='#2A2A3A';ctx.fillRect(x+140,GY-220,60,220);
  // Arch bridge connecting them
  ctx.fillStyle='#1A1A2A';ctx.fillRect(x+60,GY-160,80,40);
  // Arch opening (player runs under)
  ctx.fillStyle=col;ctx.fillRect(x+58,GY-122,84,6);
  // Phase colour accent strips on towers
  ctx.fillStyle=col;
  ctx.fillRect(x,GY-224,60,12);
  ctx.fillRect(x+140,GY-224,60,12);
  // Pit / hole in the gap between towers
  const pitGrad=ctx.createLinearGradient(x+60,GY,x+60,GY+60);
  pitGrad.addColorStop(0,'#000');pitGrad.addColorStop(1,'#111');
  ctx.fillStyle=pitGrad;ctx.fillRect(x+60,GY,80,60);
  ctx.fillStyle='#000';ctx.fillRect(x+62,GY-2,76,8); // dark lip at ground level
  // Pit edge shadow lines
  ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+60,GY);ctx.lineTo(x+60,GY+55);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+140,GY);ctx.lineTo(x+140,GY+55);ctx.stroke();
  // Windows on towers
  ctx.fillStyle='rgba(255,240,120,.5)';
  [[x+8,GY-210],[x+28,GY-210],[x+8,GY-190],[x+28,GY-190],
   [x+8,GY-170],[x+28,GY-170],[x+8,GY-150],[x+28,GY-150],
   [x+148,GY-210],[x+168,GY-210],[x+148,GY-190],[x+168,GY-190],
   [x+148,GY-170],[x+168,GY-170],[x+148,GY-150],[x+168,GY-150]].forEach(([wx,wy])=>{
    ctx.fillRect(wx,wy,14,10);
  });
  // Flashing beacon on each tower top
  if(frame%40<20){
    ctx.fillStyle=col;
    ctx.beginPath();ctx.arc(x+30,GY-228,5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+170,GY-228,5,0,Math.PI*2);ctx.fill();
  }
}

// ── CLEMENTINES  (sprite_clementine_pickup / sprite_clementine_thrown) ──
const CLEM_FRAMES=[()=>SP.c1,()=>SP.c2,()=>SP.c3];
function drawClem(x,y,r=13){
  // Animate through 3 frames at ~8fps
  const img=CLEM_FRAMES[Math.floor(frame/8)%3]();
  if(spriteReady(img)){
    ctx.drawImage(img,x-r,y-r,r*2,r*2);
  } else {
    // Canvas fallback
    ctx.fillStyle='#FF8800';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#3A7A00';ctx.lineWidth=1.8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+2,y-r-6);ctx.stroke();
    ctx.fillStyle='#44AA00';ctx.beginPath();ctx.ellipse(x+4,y-r-5,5,3,.6,0,Math.PI*2);ctx.fill();
  }
}
function drawThrownClem(tc){
  // Orange motion trail
  for(let i=3;i>=1;i--){
    ctx.globalAlpha=0.1*i;ctx.fillStyle='#FF8800';
    ctx.beginPath();ctx.arc(tc.x-i*13,tc.y,9-i*1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // Pick frame from spin position
  const img=CLEM_FRAMES[Math.floor(Math.abs(tc.spin)/(Math.PI*2/3))%3]();
  ctx.save();ctx.translate(tc.x,tc.y);ctx.rotate(tc.spin);
  if(spriteReady(img)){
    ctx.drawImage(img,-13,-13,26,26);
  } else {
    ctx.fillStyle='#FF8800';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// ── BACKGROUND ────────────────────────────────────────────────
let clouds=[], trees=[], bldgs=[];
function initBG(){
  clouds=[];for(let i=0;i<9;i++)clouds.push({x:Math.random()*W,y:25+Math.random()*80,w:55+Math.random()*80,sp:.3+Math.random()*.3});
  trees=[];for(let i=0;i<18;i++)trees.push({x:Math.random()*W*2,h:40+Math.random()*65,type:0|Math.random()*3,layer:1+(0|Math.random()*2)});
  bldgs=[];for(let i=0;i<7;i++)bldgs.push({x:Math.random()*W*2,h:80+Math.random()*120,w:38+Math.random()*55,lit:[]});
  // Pre-bake window lit states
  for(const b of bldgs){
    const rows=Math.floor(b.h/20)-1,cols=Math.floor(b.w/16)-1;
    b.lit=Array.from({length:rows*cols},()=>Math.random()<.55);
  }
}
function getTheme(){return BG_THEMES[Math.floor(dist/1000)%BG_THEMES.length];}
function getThemeIdx(){return Math.floor(dist/1000)%BG_THEMES.length;}

function drawBG(){
  const th=getTheme(), ti=getThemeIdx();
  const bgImg = (!scene || !scene._bgTile) && SP.bgs && SP.bgs[0] && spriteReady(SP.bgs[0]) ? SP.bgs[0] : null;
  if(bgImg && spriteReady(bgImg)){
    const iw=bgImg.naturalWidth||800, ih=bgImg.naturalHeight||320;
    const dh=GY;
    const dw=Math.round(dh*iw/ih);
    const scrollX=((dist*0.4)%dw+dw)%dw;
    for(let ox=-scrollX;ox<W;ox+=dw) ctx.drawImage(bgImg,0,0,iw,ih,ox,0,dw,dh);
  } else {
    // Canvas fallback: gradient sky + sun/moon + clouds + trees
    const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,th.sky1);g.addColorStop(1,th.sky2);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,GY);
    if(ti===1){
      ctx.fillStyle='#DDD';ctx.beginPath();ctx.arc(680,50,26,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=th.sky1;ctx.beginPath();ctx.arc(690,44,23,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#FFF';[[100,28],[200,55],[360,18],[500,42],[620,12],[720,68]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx,sy,1.5,0,Math.PI*2);ctx.fill();});
    } else {
      ctx.fillStyle=ti===3?'#FF4400':'#FFD700';ctx.beginPath();ctx.arc(680,60,30,0,Math.PI*2);ctx.fill();
      if(ti!==3){ctx.fillStyle='rgba(255,220,0,.25)';ctx.beginPath();ctx.arc(680,60,50,0,Math.PI*2);ctx.fill();}
    }
    ctx.fillStyle=ti===1?'rgba(80,60,100,.4)':'rgba(255,255,255,.7)';
    for(const c of clouds){
      c.x-=c.sp*gs*.3;if(c.x+c.w<0)c.x=W+c.w;
      ctx.beginPath();ctx.ellipse(c.x,c.y,c.w*.5,18,0,0,Math.PI*2);
      ctx.ellipse(c.x-c.w*.2,c.y+5,c.w*.32,13,0,0,Math.PI*2);
      ctx.ellipse(c.x+c.w*.2,c.y+3,c.w*.32,13,0,0,Math.PI*2);ctx.fill();
    }
    if(ti>=4)for(const b of bldgs){b.x-=gs*.5;if(b.x<-b.w)b.x=W+b.w;drawBldg(b);}
    for(const t of trees){if(t.layer===2){t.x-=gs*.38;if(t.x<-70)t.x=W+70;drawTree(t,th);}}
    for(const t of trees){if(t.layer===1){t.x-=gs*.7;if(t.x<-70)t.x=W+70;drawTree(t,th);}}
  }
  // ── Floor sprite (looping) ─────────────────────────────────────
  const floorReady = SP.floor && SP.floor.complete && SP.floor.naturalWidth > 0;
  const floorY = GY - 75;
  // drawFloorStrip: called again after player draw to overlay floor on top when falling into hole
  window.drawFloorStrip = function(){
    if(floorReady){
      const fw=SP.floor.naturalWidth, fh=SP.floor.naturalHeight;
      const drawH=H-floorY;
      const drawW=Math.round(fw*drawH/fh);
      const scrollX=(((dist/0.08)%drawW)+drawW)%drawW;
      for(let ox=-scrollX;ox<W;ox+=drawW) ctx.drawImage(SP.floor,ox,floorY,drawW,drawH);
    } else {
      ctx.fillStyle='#5C3A0A'; ctx.fillRect(0,floorY,W,H-floorY);
      ctx.fillStyle='#4FA518'; ctx.fillRect(0,floorY,W,8);
    }
  };
  if(floorReady){
    const fw=SP.floor.naturalWidth, fh=SP.floor.naturalHeight;
    const drawH=H-floorY;
    const drawW=Math.round(fw*drawH/fh);
    const scrollX=(((dist/0.08)%drawW)+drawW)%drawW;
    for(let ox=-scrollX;ox<W;ox+=drawW) ctx.drawImage(SP.floor,ox,floorY,drawW,drawH);
  } else {
    ctx.fillStyle='#5C3A0A'; ctx.fillRect(0,floorY,W,H-floorY);
    ctx.fillStyle='#4FA518'; ctx.fillRect(0,floorY,W,8);
  }
  // Fire flickers (theme 3)
  if(ti===3)for(let i=0;i<3;i++){const fx=(frame*3+i*180)%W;ctx.fillStyle=`rgba(255,${60+0|Math.random()*100},0,.7)`;ctx.beginPath();ctx.arc(fx,GY-8-Math.random()*20,5+Math.random()*9,0,Math.PI*2);ctx.fill();}
}
function drawTree(t,th){
  const x=t.x,h=t.h;ctx.fillStyle=th.tc;
  if(t.type===0){ctx.beginPath();ctx.arc(x,GY-h*.6,h*.35,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5A3A0A';ctx.fillRect(x-5,GY-h*.3,10,h*.3);}
  else if(t.type===1){
    ctx.beginPath();ctx.arc(x,GY-h*.6,h*.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FF6600';for(let i=0;i<5;i++){const a=(Math.PI*2/5)*i,r=h*.26;ctx.beginPath();ctx.arc(x+Math.cos(a)*r,GY-h*.6+Math.sin(a)*r,5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#5A3A0A';ctx.fillRect(x-5,GY-h*.3,10,h*.3);
  } else {
    ctx.beginPath();ctx.moveTo(x,GY-h);ctx.lineTo(x-h*.35,GY-h*.1);ctx.lineTo(x+h*.35,GY-h*.1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#5A3A0A';ctx.fillRect(x-5,GY-h*.1,10,h*.1);
  }
}
function drawBldg(b){
  ctx.fillStyle='#3A4455';ctx.fillRect(b.x,GY-b.h,b.w,b.h);
  ctx.strokeStyle='#556677';ctx.lineWidth=1;ctx.strokeRect(b.x,GY-b.h,b.w,b.h);
  const rows=Math.floor(b.h/20)-1,cols=Math.floor(b.w/16)-1;
  ctx.fillStyle='rgba(255,240,140,.6)';
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(b.lit[r*cols+c])ctx.fillRect(b.x+6+c*16,GY-b.h+8+r*20,8,10);}
}

function checkHoles(){
  if(P.dead||megaActive)return;
  // Once committed to falling, kill when far enough down
  if(P.fallingInHole){
    if(P.y>GY+50){
      P.dead=true;
      if(score>best)best=score;
      stopBgMusic(); playDeath();
      setTimeout(()=>{ pickDeathLine(); S='gameover'; },400);
    }
    return;
  }
  const hb=P.hb;
  let inHole=false;
  for(const h of HOLES){
    if(P.y>=GY-2&&hb.x+hb.w>h.x&&hb.x<h.x+h.w){ inHole=true; break; }
  }
  if(!inHole){ P.holeGrace=0; return; }
  if(P.holeGrace===0) P.holeGrace=10;
  P.holeGrace--;
  if(P.holeGrace<=0) P.fallingInHole=true;
}

function throwClem(){
  if(P.dead)return;
  P.throwT=25;
  THROWN.push({x:P.x+20, y:P.y-38, spd:15, spin:0});
}
function healWithClems(){
  if(clemCount<5||lives>=3||P.dead)return;
  clemCount-=5;
  lives=Math.min(3,lives+1);
  boom(P.x,P.y-40,18,['#FF4466','#FF88AA','#FFFFFF','#FF2255']);

}
function activateMegaBoost(){
  if(clemCount<CLEM_MAX||megaActive||P.dead)return;
  clemCount=0; megaActive=true; megaTimer=MEGA_DUR;
  PBUBBLE.text="HIIIIIYA BELIEREEEEEEEE THAT!"; PBUBBLE.timer=90; PBUBBLE.delay=0;
  // Destroy every obstacle, missile, and bullet on screen
  for(const o of OBS) boom(o.x+o.w/2, o.y+o.h/2, 12, ['#FF6600','#FFCC00','#FF3300']);
  for(const m of MISS) boom(m.x, m.y, 10, ['#FF6600','#FFAA00']);
  OBS.length=0; MISS.length=0; BULLS.length=0; HOLES.length=0;
  // Reset lives to 3
  lives=3;
  boom(P.x,P.y-30,50,['#FF8800','#FFCC00','#FF4400','#FFEEAA','#FFFFFF']);

  warnText='MEGA BOOST! EVERYTHING DESTROYED!'; warnTimer=120;
}
