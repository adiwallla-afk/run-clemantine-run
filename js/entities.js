// ── PLAYER ────────────────────────────────────────────────────
const P={
  x:PX,y:GY,vy:0,jumping:false,jumpsLeft:2,crouching:false,dead:false,
  run:0,deathT:0,invincT:0,throwT:0,fallingInHole:false,holeGrace:0,
  get hb(){
    const h=this.crouching?26:52;
    return{x:this.x-10,y:this.y-h,w:20,h:h};
  },
  doJump(){
    if(!this.crouching&&!this.dead&&this.jumpsLeft>0){
      // Phaser arcade physics: -13px/frame * 60fps = -780 px/s; second jump -600 px/s
      if(scene && scene._playerPhys) scene._playerPhys.setVelocityY(this.jumpsLeft===2 ? -780 : -600);
      spawnJumpSmoke(this.x, this.y);
      stopRunningAudio();
      playJump();
      this.jumping=true;
      this.jumpsLeft--;
      if(this.jumpsLeft===0) boom(this.x,this.y-30,10,['#88CCFF','#FFFFFF','#AADDFF','#CCFFFF']);
    }
  },
  update(){
    if(this.dead){this.deathT++;return;}
    if(this.invincT>0)this.invincT--;
    if(this.throwT>0)this.throwT--;
    this.run+=0.18;
    // Shift right when biker (Sahar) is chasing
    const tx = phase===2 ? PX+55 : PX;
    this.x += (tx - this.x) * 0.04;
    if(scene && scene._playerPhys) scene._playerPhys.setX(this.x);
    // Physics y is handled by Phaser Arcade (see MainScene); P.y is synced each frame
  },
  draw(){
    // Death animation — show dead.png with a tumble effect, stays on screen
    if(this.dead){
      ctx.save();
      ctx.globalAlpha = 1;
      const dropY = Math.min(30, this.deathT*0.7);
      ctx.translate(this.x, this.y - 40 + dropY);
      if(spriteReady(SP.dead)){
        ctx.drawImage(SP.dead, 0,0,SP.dead.width||256,SP.dead.height||256, -40,-40, 80,80);
      } else {
        // Canvas fallback: red X
        ctx.strokeStyle='#FF2244'; ctx.lineWidth=8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-20,-20); ctx.lineTo(20,20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20,-20); ctx.lineTo(-20,20); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha=1;
      return;
    }
    const sy=this.crouching?0.55:1;
    // Invincibility flash
    if(this.invincT>0&&Math.floor(this.invincT/5)%2===0) ctx.globalAlpha=0.3;
    ctx.save();
    // Mega boost aura (drawn before sprite so it sits behind)
    if(megaActive){
      const pulse=0.5+0.4*Math.sin(frame*.18);
      ctx.fillStyle=`rgba(255,150,0,${pulse*.55})`;
      ctx.beginPath();ctx.arc(this.x,this.y-38,42,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(255,220,50,${pulse*.9})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(this.x,this.y-38,42,0,Math.PI*2);ctx.stroke();
    }
    // Pick frame + source image
    let sImg=null, sx=0, ssy=0, sw=256, sh=256;
    const dw=80, dh=this.crouching?44:80; // crouch sprite is naturally lower
    const dx=this.x-40, dy=this.y-dh+12;
    if(CP3_SCENE.active && !CP3_SCENE.waiting && spriteReady(SP.idle)){
      ctx.drawImage(SP.idle, 0,0,256,256, dx, dy, dw, dh);
      ctx.restore(); ctx.globalAlpha=1; return;
    }
    if(this.crouching && SP.crouch && SP.crouch.length){
      const fi=Math.floor(this.run*2)%25;
      const img=SP.crouch[fi];
      if(spriteReady(img)) sImg=img;
    } else if(this.throwT>0 && spriteReady(SP.throw)){
      // Throw sheet: 5×5 grid, 256×256 per frame, plays frames 0→24 over 25 ticks
      const fi=Math.min(24, 25-this.throwT);
      sx=(fi%5)*256; ssy=Math.floor(fi/5)*256;
      sImg=SP.throw;
    } else if(this.jumping && SP.jump && SP.jump.length){
      // Jump: pick frame based on position in arc (0=launch, 13=land)
      const progress=Math.min(1, Math.max(0, (this.vy+13)/26));
      const fi=Math.min(13, Math.floor(progress*14));
      const img=SP.jump[fi];
      if(spriteReady(img)) sImg=img;
    } else if(SP.run && SP.run.length){
      // Run: cycle 25 frames
      const fi=Math.floor(this.run*2)%25;
      const img=SP.run[fi];
      if(spriteReady(img)) sImg=img;
    }
    if(sImg){
      ctx.drawImage(sImg, sx, ssy, sw, sh, dx, dy, dw, dh);
    } else {
      // Canvas fallback
      ctx.translate(this.x, this.y); ctx.scale(1,sy);
      const t=this.run, ls=Math.sin(t)*18;
      ctx.strokeStyle='#1A1A2E';ctx.lineWidth=7;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5+ls*.5,22);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5-ls*.5,22);ctx.stroke();
      ctx.fillStyle='#111';
      ctx.beginPath();ctx.ellipse(-5+ls*.5,24,8,4,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(5-ls*.5,24,8,4,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#CC2200';ctx.beginPath();ctx.roundRect(-13,-44,26,32,5);ctx.fill();
      const as=Math.sin(t+Math.PI)*25;
      ctx.strokeStyle='#CC2200';ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(-8,-36);ctx.lineTo(-22,-36+as*.4);ctx.stroke();
      ctx.beginPath();ctx.moveTo(8,-36);ctx.lineTo(22,-36-as*.4);ctx.stroke();
      ctx.fillStyle='#FFDAB9';ctx.beginPath();ctx.arc(0,-54,13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1A1A2E';ctx.beginPath();ctx.ellipse(0,-62,12,6,0,Math.PI,0);ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha=1;
  }
};

// ── FORKLIFT ──────────────────────────────────────────────────
const FL={
  x:-250,active:false,dying:false,dyT:0,dyVx:0,dyY:0,dyVy:0,exhaust:[],exT:0,fFrame:0,fTick:0,
  reset(){this.x=-250;this.active=true;this.dying=false;this.dyT=0;this.dyVx=0;this.dyY=0;this.dyVy=0;this.fFrame=0;this.fTick=0;},
  update(){
    if(!this.active)return;
    if(this.dying){
      this.dyT++;
      this.x+=this.dyVx; this.dyVx=Math.max(0,this.dyVx*0.88);
      this.dyVy+=2.4; this.dyY+=this.dyVy;
      if(this.dyT===8){boom(this.x+60,GY-10,25);}
      if(this.dyY>220){this.active=false;}
      return;
    }
    this.x+=(PX-158-this.x)*.04;
    spawnBikeExhaust(this.x + 10, GY - 30, 0.55);
    spawnBikeDirt(this.x + 60, GY + 10, 0.95, 1.8, false, 120);
    if(++this.fTick>=3){this.fTick=0;this.fFrame=(this.fFrame+1)%(SP.fk&&SP.fk.length?SP.fk.length:1);}
  },
  die(){this.dying=true;this.dyVx=5;this.dyVy=0;this.dyY=0;},
  drawSprite(x){
    if(spriteReady(SP.fkSprite)){
      const img=SP.fkSprite;
      const sw=(img instanceof HTMLCanvasElement)?img.width:(img.naturalWidth||256);
      const sh=(img instanceof HTMLCanvasElement)?img.height:(img.naturalHeight||256);
      ctx.drawImage(img, 0,0,sw,sh, x-10, GY-83, 120, 95);
      return true;
    }
    return false;
  },
  draw(){
    if(!this.active)return;
    const x=this.x;
    const dyY=this.dyY||0;
    ctx.save();
    ctx.translate(0, dyY);
    if(!this.drawSprite(x)){
      // Canvas fallback
      [[x+20,GY-13],[x+90,GY-13]].forEach(([wx,wy])=>{
        ctx.fillStyle='#1A1A1A';ctx.beginPath();ctx.arc(wx,wy,14,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#555';ctx.beginPath();ctx.arc(wx,wy,5,0,Math.PI*2);ctx.fill();
      });
      ctx.fillStyle='#FF8C00';ctx.beginPath();ctx.roundRect(x+8,GY-58,92,46,5);ctx.fill();
      ctx.fillStyle='#E07000';ctx.beginPath();ctx.roundRect(x+55,GY-82,45,34,[5,5,0,0]);ctx.fill();
      ctx.fillStyle='#99DDFF';ctx.beginPath();ctx.roundRect(x+62,GY-76,30,20,3);ctx.fill();
      ctx.fillStyle='#777';ctx.fillRect(x-32,GY-36,46,6);ctx.fillRect(x-32,GY-23,46,6);
      ctx.fillStyle='#555';ctx.fillRect(x+85,GY-88,6,22);
    }
    ctx.globalAlpha=1;
    ctx.restore();
    drawTaunt(x+70, GY-120, 'FORKLIFT');
  }
};

// ── AXE MAN ───────────────────────────────────────────────────
const AX={
  x:-250,active:false,dying:false,dyT:0,dyY:0,dyVy:0,run:0,
  reset(){this.x=-250;this.active=true;this.dying=false;this.dyT=0;this.dyY=0;this.dyVy=0;},
  update(){
    if(!this.active)return;
    if(this.dying){
      this.dyT++;
      this.x+=6;
      this.dyVy+=2.8; this.dyY+=this.dyVy;
      if(this.dyT===5){boom(this.x+20,GY-10,14);}
      if(this.dyY>160){this.active=false;}
      return;
    }
    this.run+=0.2;
    this.x+=(PX-138-this.x)*.055;
    spawnBikeDirt(this.x + 0, GY + 5, 0.5, 1.0, false, 60);
  },
  die(){this.dying=true;this.dyVy=0;this.dyY=0;},
  draw(){
    if(!this.active)return;
    ctx.save();
    ctx.translate(this.x+20, GY+12+(this.dyY||0));
    const fi=Math.floor(this.run)%25;
    const img=SP.felix&&SP.felix[fi];
    if(img&&img.complete&&img.naturalWidth>0){
      ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,-70,-115,140,136);
    } else {
      // Canvas fallback
      const t=this.run,ls=Math.sin(t)*20;
      ctx.strokeStyle='#1A1A2E';ctx.lineWidth=8;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-6+ls*.5,22);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6-ls*.5,22);ctx.stroke();
      ctx.fillStyle='#111';
      ctx.beginPath();ctx.ellipse(-6+ls*.5,24,9,4,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(6-ls*.5,24,9,4,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2A2A3A';ctx.beginPath();ctx.roundRect(-13,-46,26,34,4);ctx.fill();
      ctx.fillStyle='#FFDAB9';ctx.beginPath();ctx.arc(0,-58,13,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    drawTaunt(this.x+20, GY-90, 'AXE MAN');
  }
};

// ── BIKER ─────────────────────────────────────────────────────
const BK={
  x:-250,active:false,dying:false,dyT:0,dyVx:0,dyY:0,dyVy:0,dyRot:0,muzzle:0,aimT:0,whl:0,trailF:0,
  reset(){this.x=-250;this.active=true;this.dying=false;this.dyT=0;this.dyVx=0;this.dyY=0;this.dyVy=0;this.dyRot=0;this.aimT=0;this.muzzle=0;this.trailF=0;},
  update(){
    if(!this.active)return;
    if(this.dying){
      this.dyT++;
      this.x+=this.dyVx; this.dyVx=Math.max(0,this.dyVx*0.88);
      this.dyRot+=0.28;
      this.dyVy+=2.2; this.dyY+=this.dyVy;
      if(this.dyT===12){boom(this.x+60,GY-10,28);}
      if(this.dyY>220){this.active=false;}
      return;
    }
    this.x+=(PX-152-this.x)*.05;
    this.whl+=0.15;
    spawnBikeExhaust(this.x + 10, GY - 58); // exhaust
    spawnBikeDirt(this.x + 62, GY + 17, 1, 1, false, 130);   // dirt trail
    if(this.muzzle>0)this.muzzle--;
  },
  die(){this.dying=true;this.dyVx=5;this.dyVy=0;this.dyY=0;this.dyRot=0;},
  tryFire(){if(this.aimT===0)this.aimT=45;},
  draw(){
    if(!this.active)return;
    const x=this.x;
    ctx.save();
    ctx.translate(0, this.dyY||0);
    const saharSpr = spriteReady(SP.sahar) ? SP.sahar : (spriteReady(SP.bk) ? SP.bk : null);
    if(saharSpr){
      // Sahar biker sprite
      ctx.drawImage(saharSpr, x-20, GY-110, 165, 135);
      // Gun muzzle flash on top of sprite
      if(this.muzzle>0){ctx.fillStyle='#FFFF00';ctx.beginPath();ctx.arc(x+108,GY-78,10,0,Math.PI*2);ctx.fill();}
    } else {
      // Canvas fallback
      const drawWheel=(wx,wy)=>{
        ctx.fillStyle='#1A1A1A';ctx.beginPath();ctx.arc(wx,wy,18,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#444';ctx.lineWidth=2;ctx.beginPath();ctx.arc(wx,wy,18,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#555';ctx.beginPath();ctx.arc(wx,wy,6,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#777';ctx.lineWidth=2;
        for(let i=0;i<6;i++){const a=this.whl+(Math.PI/3)*i;ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx+Math.cos(a)*15,wy+Math.sin(a)*15);ctx.stroke();}
      };
      drawWheel(x+20,GY-18);drawWheel(x+100,GY-18);
      ctx.strokeStyle='#333';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(x+20,GY-18);ctx.lineTo(x+42,GY-52);ctx.lineTo(x+78,GY-52);ctx.lineTo(x+100,GY-18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+42,GY-52);ctx.lineTo(x+62,GY-32);ctx.lineTo(x+78,GY-52);ctx.stroke();
      ctx.fillStyle='#1A1A1A';ctx.beginPath();ctx.roundRect(x+47,GY-63,35,8,3);ctx.fill();
      ctx.save();ctx.translate(x+62,GY-62);
      ctx.fillStyle='#6600CC';ctx.beginPath();ctx.roundRect(-12,-38,24,30,4);ctx.fill();
      ctx.fillStyle='#440088';ctx.beginPath();ctx.arc(0,-50,14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#88AAFF';ctx.beginPath();ctx.arc(0,-50,8,0,Math.PI,true);ctx.fill();
      const aimA=this.aimT>0?-0.4:-0.1;
      ctx.save();ctx.translate(-12,-26);ctx.rotate(aimA);
      ctx.strokeStyle='#6600CC';ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-32,0);ctx.stroke();
      ctx.fillStyle='#222';ctx.fillRect(-45,-5,18,10);
      if(this.muzzle>0){ctx.fillStyle='#FFFF00';ctx.beginPath();ctx.arc(-47,0,9,0,Math.PI*2);ctx.fill();}
      ctx.restore();ctx.restore();
    }
    ctx.globalAlpha=1;
    drawTaunt(this.x+60, GY-120, 'BIKER');
    ctx.restore();
  }
};

// ── HELICOPTER ────────────────────────────────────────────────
const HE={
  x:W+300,y:90,active:false,dying:false,dyT:0,dyVy:0,rotor:0,bob:0,bobT:0,rktT:0,
  reset(){this.x=W+300;this.y=90;this.active=true;this.dying=false;this.dyT=0;this.dyVy=0;this.rktT=0;},
  update(){
    if(!this.active)return;
    if(this.dying){
      this.dyT++;
      this.rotor+=1.8;
      this.dyVy+=3; this.y+=this.dyVy;
      if(this.dyT===10){boom(this.x,this.y,30);}
      if(this.y>GY+60){this.active=false;}
      return;
    }
    this.rotor+=0.3;this.bobT+=0.05;this.bob=Math.sin(this.bobT)*12;
    this.x+=(W*.67-this.x)*.02;
    this.y=90+this.bob;
    if(++this.rktT>=120){
      this.rktT=0;warnText='!!! IRANIAN MISSILES INCOMING !!!';warnTimer=80;
      const rys=[GY-40,GY-45,GY-43,GY-48]; // all crouch-to-dodge
      for(let i=0;i<4;i++)MISS.push({x:this.x+10+i*70,y:this.y+35,spd:spd+4,trail:[],rt:0|Math.random()*3});
    }
  },
  die(){this.dying=true;this.dyVy=0;},
  draw(){
    if(!this.active)return;
    const x=this.x,y=this.y;
    ctx.globalAlpha=1;
    // Rotor shadow
    ctx.save();ctx.translate(x,y-22);ctx.rotate(this.rotor);
    ctx.strokeStyle='rgba(30,30,60,.35)';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-56,0);ctx.lineTo(56,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-56);ctx.lineTo(0,56);ctx.stroke();
    ctx.restore();
    // Body
    ctx.fillStyle='#2244AA';ctx.beginPath();ctx.ellipse(x,y,56,22,0,0,Math.PI*2);ctx.fill();
    // Cockpit
    ctx.fillStyle='#77CCFF';ctx.beginPath();ctx.ellipse(x+26,y-4,22,16,.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(x+29,y-8,10,7,.3,0,Math.PI*2);ctx.fill();
    // Star
    ctx.fillStyle='#FFDD00';star(ctx,x-12,y+2,5,10,5);
    // Tail
    ctx.strokeStyle='#1A3399';ctx.lineWidth=8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x-50,y);ctx.lineTo(x-92,y-16);ctx.stroke();
    // Tail rotor
    ctx.save();ctx.translate(x-92,y-16);ctx.rotate(this.rotor*2);
    ctx.strokeStyle='rgba(100,120,200,.7)';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,12);ctx.stroke();
    ctx.restore();
    // Cannon
    ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(x+4,y+18,22,8,2);ctx.fill();
    ctx.fillRect(x+22,y+20,14,4);
    // Main rotor (front)
    ctx.save();ctx.translate(x,y-22);ctx.rotate(this.rotor);
    ctx.strokeStyle='rgba(100,130,220,.65)';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-56,0);ctx.lineTo(56,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-56);ctx.lineTo(0,56);ctx.stroke();
    ctx.restore();
    ctx.globalAlpha=1;
    drawTaunt(this.x+60, this.y-30, 'HELICOPTER');
  }
};
function star(ctx,cx,cy,ir,or,pts){
  ctx.beginPath();
  for(let i=0;i<pts*2;i++){
    const a=(Math.PI/pts)*i-Math.PI/2,r=i%2===0?or:ir;
    i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
  }
  ctx.closePath();ctx.fill();
}

// ── TAUNT SYSTEM (speech bubbles only, no API) ────────────────
const CLAUDE = {
  taunts: {FORKLIFT:'','AXE MAN':'',BIKER:'',HELICOPTER:'',HABIBI:''},
  tauntTimer: {FORKLIFT:0,'AXE MAN':0,BIKER:0,HELICOPTER:0,HABIBI:0},
};

// Draw a speech bubble above (x,y) with given text
function drawTaunt(x, y, name) {
  const text = CLAUDE.taunts[name];
  if (!text || CLAUDE.tauntTimer[name] <= 0) return;
  CLAUDE.tauntTimer[name]--;
  const alpha = Math.min(1, CLAUDE.tauntTimer[name] / 40);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 12px "Nunito",sans-serif';
  const lines = wrapText(text, 160);
  const bw = 172, bh = lines.length * 16 + 14;
  // Keep bubble on screen — clamp so it doesn't clip either edge
  const cx = Math.max(bw/2 + 8, Math.min(W - bw/2 - 8, x));
  const bx = cx - bw / 2, by = y - bh - 12;
  // Bubble
  ctx.fillStyle = 'rgba(10,10,20,.88)';
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,0,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.stroke();
  // Tail
  ctx.fillStyle = 'rgba(10,10,20,.88)';
  ctx.beginPath(); ctx.moveTo(cx - 7, by + bh); ctx.lineTo(cx + 7, by + bh); ctx.lineTo(cx, by + bh + 10); ctx.closePath(); ctx.fill();
  // Text
  ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
  lines.forEach((ln, i) => ctx.fillText(ln, cx, by + 14 + i * 16));
  ctx.restore();
}

// Entry dialogue timeout IDs — cleared on game reset so stale lines don't fire
let _eto = [];
function clearEntryTimeouts(){ _eto.forEach(clearTimeout); _eto=[]; }

// Shawgi's own speech bubble (blue border, appears with a delay after chaser line)
const PBUBBLE = { text:'', timer:0, delay:0 };
function drawPlayerBubble(){
  if(PBUBBLE.delay>0){ PBUBBLE.delay--; return; }
  if(!PBUBBLE.text||PBUBBLE.timer<=0) return;
  PBUBBLE.timer--;
  const alpha=Math.min(1, PBUBBLE.timer/40);
  const x=PX, y=P.y-90;
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.font='bold 12px "Nunito",sans-serif';
  const lines=wrapText(PBUBBLE.text,160);
  const bw=172, bh=lines.length*16+14;
  const bx=x-bw/2, by=y-bh-12;
  ctx.fillStyle='rgba(10,10,20,.88)'; ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.fill();
  ctx.strokeStyle='rgba(80,200,255,.7)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.stroke();
  ctx.fillStyle='rgba(10,10,20,.88)';
  ctx.beginPath(); ctx.moveTo(x-7,by+bh); ctx.lineTo(x+7,by+bh); ctx.lineTo(x,by+bh+10); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#80DDFF'; ctx.textAlign='center';
  lines.forEach((ln,i)=>ctx.fillText(ln,x,by+14+i*16));
  ctx.restore();
}

const SHAWGI_REACTIONS=[
  "HAHAHA BYEEE WALLAHI!!",
  "Ana too fast habibi, go home ya hmar!",
  "Yallah yallah, BYE BYE!!",
  "Inshallah they cry now hehe!",
  "WALLAHI NO ONE CAN CATCH ME!!",
  "Hahaha like donkey they run! Not me!",
  "Alhamdulilah, Sanna is waiting!!",
  "They thought they catch Shawgi?? HAHAHA!!",
  "Ya hmar BYE!! I win wallahi!!",
  "Mashallah I too fast, go cry habibi!",
];

const HIT_LINES=[
  "MY MOUSTACHE!",
  "SANNAAAA!",
  "Wallah that hurt!",
  "Not the clementines!!",
  "Ya habibi OW!",
  "My kidneys ya kalb!",
  "The moustache is fine. I am not.",
  "YALLA YALLA OW!",
  "Hash finger warned me!!",
  "Tell Sanna I tried!",
  "My back habibi!!",
  "NOT NOW SHEYTAN!",
  "My dignity!!",
  "Bismillah OUCH!",
  "I am RUNNING ya hmar!",
  "Cognitive dissonance AND PAIN!",
  "Who put that there?!",
  "SANNA HELP ME!",
  "I felt that in my soul!",
  "Forelli you dog!!",
  "MY LEGS YA KALB!",
  "SANNA DONT LOOK!",
  "Astaghfirullah!!",
  "I was so close wallah!",
  "My beautiful face!!",
  "Ya zalameh WHY!",
  "NOT THE MOUSTACHE AGAIN!",
  "Sheytan did this!!",
  "Habibi I felt my spine!",
  "AYYYY YALLAH!",
  "Sanna will hear about this!",
  "My clementines scattered!!",
  "Even Hash finger felt that!",
  "Ya hmar I was winning!!",
  "Bismillah my ribs!!",
  "Who raised these people?!",
  "WALLAH I ALMOST DIED!",
  "My moustache is crooked now!",
  "Uff habibi uff!!",
  "That was NOT discipline!",
  "Shawgi is still here ya kalb!",
  "My soul left and came back!",
  "Forelli you son of a forklift!!",
  "I bit my tongue wallah!",
  "Ana okay. Ana NOT okay.",
];

function die(){
  if(P.dead||P.invincT>0||CP3_SCENE.active)return;
  lives--;
  playHitObstacle();
  shake=8; shakeAmt=4;
  boom(P.x,P.y-30,14,['#FFDAB9','#CC2200','#FF6600','#FFCC00']);
  if(lives<=0){
    P.dead=true;
    if(score>best)best=score;
    stopRunningAudio(); stopBgMusic(); stopAmberAlert(); playDeath();
    setTimeout(()=>{ pickDeathLine(); S='gameover'; },1200);
  } else {
    stopRunningAudio();
    P.invincT=120; // ~2 sec of flashing invincibility
    PBUBBLE.text=HIT_LINES[0|Math.random()*HIT_LINES.length];
    PBUBBLE.timer=140;
    PBUBBLE.delay=0;
  }
}

function checkCol(){
  if(P.invincT>0||megaActive||CP3_SCENE.active)return; // invincibility frames or mega boost
  const hb=P.hb;
  // Obstacle collision now handled by Phaser physics overlap (_obsGroup)
  // Manual fallback for bodies not yet attached:
  for(const o of OBS){
    if(o.t==='crouch'){
      // Bees: manual check so crouching (smaller hb) can slide under
      if(overlap(hb,{x:o.x,y:o.y,w:o.w,h:o.h})){die();return;}
    } else if(!o._body&&overlap(hb,{x:o.x,y:o.y,w:o.w,h:o.h})){die();return;}
  }
  for(const m of MISS){if(overlap(hb,{x:m.x-22,y:m.y-8,w:44,h:16})){boom(m.x,m.y,15);die();return;}}
  for(const b of BULLS){if(overlap(hb,{x:b.x-8,y:b.y-5,w:16,h:10})){die();return;}}
  // Chaser contact
  const ch=phase===0?FL:phase===1?AX:phase===2?BK:HE;
  if(ch.active&&!ch.dying){
    let cx,cy,cw,ch2;
    if(phase===0){cx=FL.x+8;cy=GY-58;cw=102;ch2=58;}
    else if(phase===1){cx=AX.x;cy=GY-78;cw=52;ch2=78;}
    else if(phase===2){cx=BK.x+8;cy=GY-72;cw=108;ch2=72;}
    else{cx=HE.x-58;cy=HE.y-24;cw=116;ch2=48;}
    if(overlap(hb,{x:cx,y:cy,w:cw,h:ch2})){die();return;}
  }
}
