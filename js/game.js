let cheatMega = false;
const CP3_SCENE = { active: false, waiting: false, timer: 0, bldgX: 0 };
function drawBldgBubble(text, alpha){
  ctx.save();
  ctx.font = 'bold 13px "Nunito",sans-serif';
  const bw = 310, lh = 17;
  const lines = wrapText(text, bw - 20);
  const bh = lines.length * lh + 18;
  const bx = 80, by = GY - 200;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(15,8,8,.93)';
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, 10); ctx.fill();
  ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(bx, by - bh, bw, bh, 10); ctx.stroke();
  // Tail pointing down-left toward building
  ctx.fillStyle = 'rgba(15,8,8,.93)';
  ctx.beginPath(); ctx.moveTo(bx+18, by); ctx.lineTo(bx+38, by); ctx.lineTo(bx+8, by+16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#FF6600'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(bx+18, by); ctx.lineTo(bx+8, by+16); ctx.moveTo(bx+38, by); ctx.lineTo(bx+8, by+16); ctx.stroke();
  ctx.fillStyle = '#FFD080'; ctx.textAlign = 'center';
  lines.forEach((ln, i) => ctx.fillText(ln, bx + bw/2, by - bh + 15 + i*lh));
  ctx.restore();
}

// ── AUDIO AUTOSTART on first interaction ──────────────────────
let _bgStarted = false;
function _tryStartBg(){ if(!_bgStarted){ _bgStarted=true; playBgMusic(); } }
addEventListener('keydown', ()=>_tryStartBg(), {once:false, passive:true, capture:true});
addEventListener('pointerdown', ()=>_tryStartBg(), {once:false, passive:true, capture:true});

// ── INPUT ──────────────────────────────────────────────────────
addEventListener('keydown',e=>{
  K[e.code]=true;
  if(S==='start'){
    if(MENU.view!=='main'){
      if(e.code==='Escape'||e.code==='Space'||e.code==='Backspace'){ playMenuSelect(); MENU.view='main'; stopCreditsMusic(); if(_bgStarted) playBgMusic(); e.preventDefault(); return; }
    } else {
      if(e.code==='Tab'){ MENU.tab=MENU.tab==='controls'?'info':'controls'; playMenuMove(); e.preventDefault(); return; }
      if(e.code==='ArrowUp'){ MENU.sel=(MENU.sel+3)%4; playMenuMove(); e.preventDefault(); return; }
      if(e.code==='ArrowDown'){ MENU.sel=(MENU.sel+1)%4; playMenuMove(); e.preventDefault(); return; }
      if(e.code==='Space'||e.code==='Enter'){
        playMenuSelect();
        if(MENU.sel===0){ INTRO.timer=0; S='intro'; stopCreditsMusic(); }
        else if(MENU.sel===1){ S='pac'; stopCreditsMusic(); startPacGame(); }
        else if(MENU.sel===2){ MENU.view='scoreboard'; stopCreditsMusic(); }
        else { MENU.view='credits'; stopBgMusic(); playCreditsMusic(); }
        e.preventDefault(); return;
      }
    }
  }
  if(S==='intro'&&e.code==='Space'){ INTRO.timer=0; beginGameFromIntro(); return; }
  if(S==='gameover'&&e.code==='KeyR') startGame();
  if(e.code==='Escape'&&S==='play'){ S='paused'; return; }
  if(S==='paused'&&(e.code==='Space'||e.code==='Enter')){ S='play'; return; }
  if(e.code==='Escape'&&S==='paused'){ S='start'; MENU.view='main'; MENU.sel=0; return; }
  if(e.code==='Backslash'&&S==='play'){ cheatMega=!cheatMega; return; }
  if(S==='play'){
    if((e.code==='Space'||e.code==='ArrowUp')&&!P.dead) P.doJump();
    if(e.code==='ArrowDown'||e.code==='ShiftLeft'||e.code==='ShiftRight') P.crouching=true;
    if(e.code==='KeyD') throwClem();
    if(e.code==='KeyA') activateMegaBoost();
    if(e.code==='KeyS') healWithClems();
    if(e.code==='KeyN'&&phase<PHASE_DATA.length-1) triggerTrans(phase+1);
  }
  if(S==='pac'){
    if(e.code==='Escape'){ S='start'; MENU.view='main'; MENU.sel=0; stopPacMusic(); e.preventDefault(); return; }
    if(pacState==='ready'&&(e.code==='Space'||e.code==='Enter')){ pacState='playing'; }
    else if(pacState==='over'&&e.code==='KeyR'){ startPacGame(); }
    else if(pacState==='playing'){
      if(e.code==='ArrowUp'||e.code==='KeyW') pacPlayer.nextDir=PDIR.U;
      else if(e.code==='ArrowDown'||e.code==='KeyS') pacPlayer.nextDir=PDIR.D;
      else if(e.code==='ArrowLeft'||e.code==='KeyA') pacPlayer.nextDir=PDIR.L;
      else if(e.code==='ArrowRight'||e.code==='KeyD') pacPlayer.nextDir=PDIR.R;
    }
  }
  e.preventDefault();
},{passive:false});
addEventListener('keyup',e=>{
  K[e.code]=false;
  if(e.code==='ArrowDown'||e.code==='ShiftLeft'||e.code==='ShiftRight') P.crouching=false;
});

function setupTouchInput(){
  canvas.addEventListener('touchstart',e=>{
    touchY0=e.touches[0].clientY;
    if(S==='start'){INTRO.timer=0;S='intro';}
    else if(S==='intro'){INTRO.timer=0;beginGameFromIntro();}
    else if(S==='gameover')startGame();
    else if(S==='start'&&MENU.view!=='main'){MENU.view='main';}
  },{passive:true});
  canvas.addEventListener('touchend',e=>{
    const dy=touchY0-e.changedTouches[0].clientY;
    if(S==='play'){if(dy>30)P.doJump();else if(dy<-30){P.crouching=true;setTimeout(()=>P.crouching=false,400);}}
  },{passive:true});
}

// ── PHASES ────────────────────────────────────────────────────
function beginPhase(idx){
  phase=idx;spd+=0.3;
  // Don't wipe active obstacles — game keeps flowing
  FL.active=false;AX.active=false;BK.active=false;HE.active=false;
  if(idx===0)FL.reset();
  else if(idx===1)AX.reset();
  else if(idx===2)BK.reset();
  else HE.reset();
  obInterval=Math.max(42,90-idx*12);
  missTimer=0;bullTimer=0;obTimer=0;
  PBUBBLE.text=''; PBUBBLE.timer=0; PBUBBLE.delay=0;
  clearEntryTimeouts();
  const names=['FORKLIFT','AXE MAN','BIKER','HELICOPTER'];
  if(idx===0){
    _eto.push(setTimeout(()=>{ CLAUDE.taunts['FORKLIFT']="FINE THEN, Time to practice discipline you lost soul!"; CLAUDE.tauntTimer['FORKLIFT']=360; }, 2500));
    _eto.push(setTimeout(()=>{ PBUBBLE.text="FACK YA MAMA FORELLI!"; PBUBBLE.timer=300; PBUBBLE.delay=0; }, 5500));
  } else if(idx===1){
    _eto.push(setTimeout(()=>{ CLAUDE.taunts['AXE MAN']="SHAWGI YA HMAR, I came out of prison just for you!"; CLAUDE.tauntTimer['AXE MAN']=360; }, 2500));
    _eto.push(setTimeout(()=>{ PBUBBLE.text="WAZZAAAP MAYNEEEEE"; PBUBBLE.timer=300; PBUBBLE.delay=0; }, 5500));
  } else if(idx===2){
    _eto.push(setTimeout(()=>{ CLAUDE.taunts['BIKER']="NO MORE Cognitive Dissonance you fucking hipster!"; CLAUDE.tauntTimer['BIKER']=360; }, 2500));
    _eto.push(setTimeout(()=>{ PBUBBLE.text="FUCK. Sahar, you fucking snake!"; PBUBBLE.timer=300; PBUBBLE.delay=0; }, 5500));
  }
}

function triggerTrans(next){
  // Get chaser's current x so the pit spawns under them
  const chaserX = phase===0?FL.x : phase===1?AX.x : phase===2?BK.x : HE.x;

  // Kill current chaser — they fall into the pit
  if(phase===0)FL.die();
  else if(phase===1)AX.die();
  else if(phase===2)BK.die();
  else HE.die();

  // Shawgi reacts like a dumb happy donkey
  PBUBBLE.text=SHAWGI_REACTIONS[Math.floor(Math.random()*SHAWGI_REACTIONS.length)];
  PBUBBLE.timer=220;
  PBUBBLE.delay=20;

  // Spawn checkpoint building with pit aligned under the chaser
  if(next===3) CPBLDGS.push({x:W+200, ph:3});
  else if(next!==2) CPBLDGS.push({x:chaserX-100, ph:next});
  if(next===2){
    spawnHabibi(W+60); beginPhase(2);
  } else if(next===3){
    // Sanna's hotspot scene at phase 2→3 checkpoint
    phase=3; MISS.length=0; BULLS.length=0;
    CP3_SCENE.active=true; CP3_SCENE.waiting=true; CP3_SCENE.timer=0; CP3_SCENE.bldgX=0; PBUBBLE.text=''; PBUBBLE.timer=0;
  } else {
    // Start next phase immediately — no state freeze
    beginPhase(next);
  }
}

// ── START / RESET ─────────────────────────────────────────────
function startGame(){
  S='play';score=0;dist=0;frame=0;spd=3.5;phase=0;shake=0;
  PARTS.length=0;EXPS.length=0;OBS.length=0;HOLES.length=0;MISS.length=0;BULLS.length=0;
  if(scene){ if(scene._obsGroup) scene._obsGroup.clear(true,true); if(scene._clemGroup) scene._clemGroup.clear(true,true); }
  if(scene && scene._groundCollider) scene._groundCollider.active=true;
  if(scene && scene._playerPhys){ scene._playerPhys.setPosition(PX, GY-26); scene._playerPhys.setVelocity(0,0); }
  warnTimer=0;transTimer=0;obTimer=0;obInterval=90;
  missTimer=0;missInterval=300;bullTimer=0;bullInterval=180;hintAlpha=1;
  P.y=GY;P.vy=0; // Phaser physics manages velocity
  P.jumping=false;P.jumpsLeft=2;P.crouching=false;P.dead=false;P.run=0;P.deathT=0;P.invincT=0;P.throwT=0;P.fallingInHole=false;P.holeGrace=0;
  gs=3.5;lives=3;playerSpdOffset=0;
  clemCount=0;CLEMS.length=0;THROWN.length=0;clemSpawnT=0;megaActive=false;megaTimer=0;CPBLDGS.length=0;UAVS.length=0;CP3_SCENE.active=false;CP3_SCENE.waiting=false;CP3_SCENE.timer=0;
  FL.active=false;AX.active=false;BK.active=false;HE.active=false;
  // Reset Claude state
  Object.keys(CLAUDE.taunts).forEach(k=>{CLAUDE.taunts[k]='';CLAUDE.tauntTimer[k]=0;});
  PBUBBLE.text='';PBUBBLE.timer=0;PBUBBLE.delay=0;
  clearEntryTimeouts();
  initBG();beginPhase(0);
  // Resume bg music (may have been stopped on death)
  if(_bgStarted) playBgMusic();
  playRunningAudio();
}

// Called from intro — same as startGame but forklift is already on-screen left side
function beginGameFromIntro(){
  startGame();
  // Place forklift where it stood in the intro (left of player, ready to chase)
  FL.x=30;
}

// ── UPDATE ────────────────────────────────────────────────────
function gameUpdate(){
  if(S==='pac'){ pacUpdate(); return; }
  if(S!=='play')return;
  frame++;
  if(frame%400===0)spd=Math.min(spd+0.12,12);
  // Player speed control — hold ← / A to slow, → / D to speed up
  if(S==='play'&&!P.dead){
    if(K['ArrowLeft']||K['KeyA'])  playerSpdOffset=Math.max(-2.5, playerSpdOffset-0.07);
    else if(K['ArrowRight']||K['KeyD']) playerSpdOffset=Math.min(4,   playerSpdOffset+0.07);
  }
  if(P.dead||P.fallingInHole){ gs=0; if(!SFX.running.paused) stopRunningAudio(); }
  else{ gs=Math.max(0.8, spd+playerSpdOffset+(megaActive?9:0)); }
  if(CP3_SCENE.active){
    if(CP3_SCENE.waiting){
      const bldg=CPBLDGS.find(b=>b.ph===3);
      if(!bldg||bldg.x<=PX){ CP3_SCENE.waiting=false; }
    } else {
      gs=0;
      if(!SFX.running.paused) stopRunningAudio();
      CP3_SCENE.timer++;
      if(CP3_SCENE.timer===1){ OBS.length=0; HOLES.length=0; obTimer=0; }
      if(CP3_SCENE.timer===210){ PBUBBLE.text='Ya habibi... Ya mashallah what a piece'; PBUBBLE.timer=180; PBUBBLE.delay=0; }
      if(CP3_SCENE.timer>=400){ CP3_SCENE.active=false; P.invincT=120; obTimer=0; OBS.length=0; HOLES.length=0; beginPhase(3); playRunningAudio(); }
    }
  }
  if(!P.dead&&!P.fallingInHole){ score+=gs*.05; dist+=gs*.08; }
  // Phase checkpoint
  if(S==='play'&&phase<PHASE_DATA.length-1&&dist>=PHASE_DATA[phase].checkpoint)triggerTrans(phase+1);
  P.update();
  FL.update();AX.update();BK.update();HE.update();
  // Keep trail particles spawning after death so smoke doesn't freeze
  if(P.dead&&!P.fallingInHole){
    if(phase===0&&FL.active&&!FL.dying){ spawnBikeExhaust(FL.x+10,GY-30,0.55); spawnBikeDirt(FL.x+60,GY+10,0.95,1.8,false,120); }
    if(phase===2&&BK.active&&!BK.dying){ spawnBikeExhaust(BK.x+10,GY-30); spawnBikeDirt(BK.x+82,GY+17); }
  }
  if(S==='play'&&!P.dead){
    // Obstacles
    const _sceneFrozen = CP3_SCENE.active && !CP3_SCENE.waiting;
    if(!_sceneFrozen&&++obTimer>=obInterval){obTimer=0;obInterval=Math.max(40,obInterval-.08);spawnOb();}
    for(let i=OBS.length-1;i>=0;i--){
      OBS[i].x-=gs;
      if(OBS[i]._body){ OBS[i]._body.x=OBS[i].x+OBS[i].w/2; OBS[i]._body.body.reset(OBS[i]._body.x, OBS[i]._body.y); }
      if(OBS[i].x<-100){ if(OBS[i]._body) OBS[i]._body.destroy(); OBS.splice(i,1); }
    }
    for(let i=HOLES.length-1;i>=0;i--){HOLES[i].x-=gs;if(HOLES[i].x+HOLES[i].w<0)HOLES.splice(i,1);}
    // Iranian Missiles — phase 2 (Felix / Axe Man) only
    if(phase===1){
      if(++missTimer>=missInterval){missTimer=0;missInterval=Math.max(140,missInterval-.8);spawnMissileWave();}
    }
    for(let i=MISS.length-1;i>=0;i--){
      const m=MISS[i];m.trail.push({x:m.x,y:m.y});if(m.trail.length>8)m.trail.shift();
      m.x-=m.spd+gs*.5;if(m.x<-60)MISS.splice(i,1);
    }
    if(MISS.length===0) stopAmberAlert();
    // Bullets LEFT→RIGHT — phase 3 (Biker / Sahar)
    if(phase===2&&BK.active&&!BK.dying){
      if(++bullTimer>=240){
        bullTimer=0;
        const gunX=BK.x+108, gunY=GY-78;
        BULLS.push({x:gunX,y:gunY,spd:-(spd+7),ltr:true});
        playGunshot();
        warnText='INCOMING!';warnTimer=60;
        BK.muzzle=10;
        // Muzzle pop — small smoke + flash particles
        boom(gunX,gunY,4,['#FFFF88','#FFFFFF','#FFDD44']);
        spawnJumpSmoke(gunX,gunY);
      }
    }
    for(let i=BULLS.length-1;i>=0;i--){
      BULLS[i].x -= BULLS[i].ltr ? BULLS[i].spd : gs+4;
      if(BULLS[i].x<-30||BULLS[i].x>W+20)BULLS.splice(i,1);
    }
    // ── Clementine pickups
    if(++clemSpawnT>=150){clemSpawnT=0;
      const _cy = GY-45-Math.random()*170;
      const _clem = {x:W+30, y:_cy, bobT:Math.random()*Math.PI*2, _body:null};
      CLEMS.push(_clem);
      if(scene && scene._clemGroup){
        const _cb = scene._clemGroup.create(_clem.x, _clem.y, '__DEFAULT');
        _cb.setDisplaySize(26, 26).setAlpha(0);
        _cb.body.allowGravity = false;
        _clem._body = _cb;
      }
    }
    for(let i=CLEMS.length-1;i>=0;i--){
      const c=CLEMS[i]; c.x-=gs; c.bobT+=0.07;
      const cy=c.y+Math.sin(c.bobT)*7;
      const hb=P.hb;
      if(!c._body && Math.abs(c.x-(hb.x+hb.w/2))<22&&Math.abs(cy-(hb.y+hb.h/2))<28){
        CLEMS.splice(i,1);
        clemCount=Math.min(CLEM_MAX,clemCount+1);
        boom(c.x,cy,7,['#FF8800','#FFCC00','#FF4400']);
        score+=10; continue;
      }
      if(c.x<-40){ if(c._body) c._body.destroy(); CLEMS.splice(i,1); }
    }
    // ── Thrown clementines
    for(let i=THROWN.length-1;i>=0;i--){
      const tc=THROWN[i]; tc.x+=tc.spd; tc.spin+=0.25;
      if(tc.x>W+60){THROWN.splice(i,1);continue;}
      let hit=false;
      // vs missiles
      for(let j=MISS.length-1;j>=0;j--){
        if(Math.abs(tc.x-MISS[j].x)<28&&Math.abs(tc.y-MISS[j].y)<22){
          boom(MISS[j].x,MISS[j].y,14,['#FF6600','#FFAA00','#FF8800']);
          MISS.splice(j,1); hit=true; score+=50;  break;
        }
      }
      // vs UAV drones
      if(!hit){
        for(let j=UAVS.length-1;j>=0;j--){
          const u=UAVS[j];
          if(tc.x>u.x&&tc.x<u.x+u.w&&tc.y>u.y&&tc.y<u.y+u.h){
            boom(u.x+u.w/2,u.y+u.h/2,12,['#44AAFF','#FFFFFF','#FFCC00','#FF6600']);
            UAVS.splice(j,1); hit=true; score+=40; break;
          }
        }
      }
      // vs bullets
      if(!hit){
        for(let j=BULLS.length-1;j>=0;j--){
          if(Math.abs(tc.x-BULLS[j].x)<18&&Math.abs(tc.y-BULLS[j].y)<14){
            boom(BULLS[j].x,BULLS[j].y,6,['#FFD700','#FFFFFF']);
            BULLS.splice(j,1); hit=true; score+=15; break;
          }
        }
      }
      if(hit)THROWN.splice(i,1);
    }
    // ── UAV drones
    for(let i=UAVS.length-1;i>=0;i--){
      const u=UAVS[i];
      u.x-=gs; u.rotorT+=0.12;
      if(u.x+u.w<-20){UAVS.splice(i,1);continue;}
      // Collision with player (must crouch to avoid)
      if(!P.dead&&P.invincT===0&&!megaActive){
        const px=P.x-30,py=P.y-80,pw=60,ph=80;
        const crouchPy=P.crouching?P.y-44:py;
        const crouchPh=P.crouching?44:ph;
        if(u.x<px+pw&&u.x+u.w>px&&u.y<crouchPy+crouchPh&&u.y+u.h>crouchPy){
          die();
          UAVS.splice(i,1);
        }
      }
    }
    // ── Checkpoint buildings scroll
    for(let i=CPBLDGS.length-1;i>=0;i--){CPBLDGS[i].x-=gs;if(CPBLDGS[i].x<-260)CPBLDGS.splice(i,1);}
    // ── Mega boost timer
    if(cheatMega){ megaActive=true; megaTimer=MEGA_DUR; }
    else if(megaActive){megaTimer--;if(megaTimer<=0){megaActive=false;megaTimer=0;}}
    checkHoles();
    checkCol();
  }
  updateParts(); // always update — keeps particles alive after death
}

// ── RENDER ────────────────────────────────────────────────────
function gameRender(){
  ctx.clearRect(0,0,W,H);
  if(S==='start'){drawStart();return;}
  if(S==='intro'){drawIntro();return;}
  if(S==='pac'){pacRender();return;}
  // Manual screen shake
  const _didShake = shake > 0;
  if(_didShake){ shake--; ctx.save(); ctx.translate((Math.random()-0.5)*shakeAmt,(Math.random()-0.5)*shakeAmt); }
  drawBG();
  // Holes
  for(const h of HOLES)drawHole(h);
  // Obstacles (sprite or canvas fallback)
  const _sceneActive = CP3_SCENE.active&&!CP3_SCENE.waiting;
  if(_sceneActive) ctx.globalAlpha=0.15;
  for(const o of OBS){
    if(o.t==='crouch'){
      const beesSpr = SP.obs_bees;
      // Circular vibration to simulate bee hovering
      const bx = o.x + Math.sin(frame * 0.45) * 3;
      const by = o.y - 10 + Math.cos(frame * 0.6) * 4;
      if(beesSpr && beesSpr.complete && beesSpr.naturalWidth>0){
        ctx.drawImage(beesSpr, bx, by, o.w, o.h + 10);
      } else {
        ctx.fillStyle='#883300';ctx.fillRect(bx,by,o.w,o.h);
        ctx.fillStyle='#AA4400';ctx.fillRect(bx+4,by+4,o.w-8,8);
        ctx.strokeStyle='#662200';ctx.lineWidth=2;ctx.strokeRect(bx,by,o.w,o.h);
      }
    } else {
      const sprKey = {
        crate:'obs_crate', drone:'obs_drone', rocket:'obs_rocket', wall:'obs_wall', sanna:'obs_sanna',
        car:'obs_car', cart:'obs_cart', clem_box:'obs_clem_box', clem_rocket:'obs_clem_rocket', donkey:'obs_donkey', habibi:'obs_habibi'
      }[o.t];
      const spr = sprKey && SP[sprKey];
      if(spriteReady(spr)){
        if(o.t==='habibi'){
          ctx.drawImage(spr, o.x - o.w/2, o.y + 33, o.w*3, o.h);
          drawTaunt(o.x + o.w/2, o.y + 10, 'HABIBI');
        } else if(o.t==='donkey'){
          ctx.drawImage(spr, o.x - o.w/2 - 10, o.y - 55, o.w*2.2, o.h*2.6);
        } else if(o.t==='clem_rocket'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 20, o.w*1.8, o.h*2.2);
        } else if(o.t==='cart'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 35, o.w*2.5, o.h*3);
        } else if(o.t==='clem_box'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 22, o.w*1.7, o.h*2.2);
        } else if(o.t==='sanna'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 20, o.w*1.5, o.h*2);
        } else if(o.t==='wall'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 110, o.w*3.5, o.h*5);
        } else if(o.t==='car'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 110, o.w*2.5, o.h*4.5);
        } else if(o.t==='drone'){
          ctx.drawImage(spr, o.x - o.w/2, o.y - 20, o.w*1.5, o.h*2);
        } else {
          ctx.drawImage(spr, o.x - o.w/2, o.y - 20, o.w*2.5, o.h*3);
        }
      } else {
        ctx.fillStyle='#884400'; ctx.fillRect(o.x,o.y,o.w,o.h);
      }
    }
  }
  if(_sceneActive) ctx.globalAlpha=1;
  // Checkpoint landmark buildings
  for(const b of CPBLDGS)drawCPBldg(b);
  // Floating clementine pickups
  for(const c of CLEMS)drawClem(c.x, c.y+Math.sin(c.bobT)*7);
  for(const m of MISS)drawMissile(m);
  for(const b of BULLS)drawBullet(b);
  // Thrown clementines (in front of obstacles)
  for(const tc of THROWN)drawThrownClem(tc);
  // UAV drones
  for(const u of UAVS)drawUAV(u);
  FL.draw();AX.draw();BK.draw();HE.draw();
  P.draw();
  // Redraw floor + holes on top of player when falling — floor hides him, holes restore the openings
  // Then redraw chasers so they aren't covered by the floor
  if(P.fallingInHole){ drawFloorStrip(); for(const h of HOLES) drawHole(h); FL.draw();AX.draw();BK.draw();HE.draw(); }
  drawPlayerBubble();
  if(CP3_SCENE.active && CP3_SCENE.timer < 210){
    const t = CP3_SCENE.timer;
    const alpha = t < 30 ? t/30 : t > 180 ? (210-t)/30 : 1;
    drawBldgBubble('ONLY 10 CLEMANTINES, AND WE WILL MAKE YOUR DREAMS COME TRUE!', alpha);
  }
  // Mega boost speed lines
  if(megaActive){
    ctx.globalAlpha=0.18+0.1*Math.sin(frame*.25);
    ctx.strokeStyle='#FFAA00';ctx.lineWidth=2;
    for(let i=0;i<8;i++){const ly=50+i*38;ctx.beginPath();ctx.moveTo(W,ly);ctx.lineTo(W-(60+Math.random()*120),ly);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  drawParts();
  if(_didShake)ctx.restore();
  drawHUD();
  // drawTrans() removed — no phase-change banners
  if(S==='gameover')drawGameover();
  if(S==='paused')drawPause();
}

// ── MAIN SCENE ────────────────────────────────────────────────
class MainScene extends Phaser.Scene {
  constructor() { super({ key: 'MainScene' }); }

  create() {
    try {
    canvas = this.sys.canvas;
    ctx    = this.sys.context;
    scene  = this;  // global reference for game functions

    setupTouchInput();
    initBG();

    // ── TileSprites (background + ground) ────────────────────
    try {
      if (this.textures.exists('bgMain')) {
        this._bgTile = this.add.tileSprite(0, 0, W, GY, 'bgMain').setOrigin(0, 0).setDepth(0);
      }
    } catch(e) { this._bgTile = null; }

    try {
      if (this.textures.exists('fDirt') || SP.fDirt) {
        // Phaser doesn't have fDirt loaded (it was a web URL), use canvas fallback
      }
    } catch(e) {}
    this._dirtTile  = null; // web images not Phaser-loaded; canvas fallback handles them
    this._grassTile = null;

    // ── Arcade Physics ────────────────────────────────────────
    // Gravity: 0.6 px/frame² × 60fps × 60fps = 2160 px/s²
    this.physics.world.gravity.y = 2160;

    // Invisible ground static body at GY
    this._ground = this.physics.add.staticImage(W/2, GY + 5, '__DEFAULT')
      .setDisplaySize(W, 10).setAlpha(0).refreshBody();

    // Invisible player physics body (standing: 52px tall, center at GY-26)
    this._playerPhys = this.physics.add.image(PX, GY - 26, '__DEFAULT').setAlpha(0);
    this._playerPhys.body.setSize(20, 52);
    this._playerPhys.body.maxVelocity.y = 1200;
    this._playerPhys.body.setCollideWorldBounds(false);

    // Ground collider — callback fires when player lands
    this._groundCollider = this.physics.add.collider(
      this._playerPhys, this._ground,
      () => {
        // Check if player is over a hole — if so, don't snap/reset
        let onHole = false;
        for (const h of HOLES) {
          if (P.x + 10 > h.x && P.x - 10 < h.x + h.w) { onHole = true; break; }
        }
        if (!P.dead && !P.fallingInHole && !onHole) {
          if (P.jumping && !P.dead) playRunningAudio();
          P.jumping = false;
          P.jumpsLeft = 2;
          P.holeGrace = 0;
        }
      }
    );

    // ── Phaser physics groups for obstacles + pickups ─────────
    // Obstacles: dynamic group, bodies moved manually each frame
    this._obsGroup = this.physics.add.group();
    this.physics.add.overlap(this._playerPhys, this._obsGroup, () => {
      if (!P.dead && P.invincT === 0 && !megaActive) die();
    });

    // Clementine pickups: dynamic group
    this._clemGroup = this.physics.add.group();
    this.physics.add.overlap(this._playerPhys, this._clemGroup, (playerPhys, clemBody) => {
      // Find and remove matching clem from CLEMS array
      const idx = CLEMS.findIndex(c => c._body === clemBody);
      if (idx !== -1) {
        const c = CLEMS[idx];
        boom(c.x, c.y, 7, ['#FF8800','#FFCC00','#FF4400']);
        clemCount = Math.min(CLEM_MAX, clemCount + 1);
        score += 10;
        CLEMS.splice(idx, 1);
        clemBody.destroy();
      }
    });

    // ── postrender: draw game on top of Phaser's TileSprites ──
    this.game.events.on('postrender', () => { gameRender(); });
    } catch(e) { console.error('MainScene create error:', e); }
  }

  update(time, delta) {
    gameUpdate();

    // ── Hole detection (must run before blocked.down sync) ──
    let _overHole = false;
    if (!P.dead) {
      if (P.fallingInHole) {
        // Already committed to falling — keep collider off
        _overHole = true;
        if (this._groundCollider) this._groundCollider.active = false;
      } else {
        const hbCenterX = P.x;
        for (const h of HOLES) {
          if (hbCenterX + 10 > h.x && hbCenterX - 10 < h.x + h.w) {
            _overHole = true; break;
          }
        }
        if (_overHole) {
          if (this._groundCollider) this._groundCollider.active = false;
        } else {
          if (this._groundCollider) this._groundCollider.active = true;
        }
      }
    }

    // ── Sync P.y from physics body ───────────────────────────
    if (this._playerPhys && this._playerPhys.body) {
      // body.bottom = bottom edge of physics rectangle
      P.y = this._playerPhys.body.bottom;
      // Only snap to ground when NOT over a hole
      if (this._playerPhys.body.blocked.down && !_overHole) {
        if (P.jumping && !P.dead) playRunningAudio();
        P.jumping = false;
        if (P.jumpsLeft < 2) P.jumpsLeft = 2;
        P.holeGrace = 0;
        this._groundCollider.active = true;
      }
    }

    // ── TileSprite scrolling (if active) ────────────────────
    if (this._bgTile && S === 'play' && !P.dead && !P.fallingInHole) {
      this._bgTile.tilePositionX += gs * 0.4;
    }

    // ── Sync obstacle physics bodies ────────────────────────
    // For each entry in OBS, maintain a matching physics body in _obsGroup.
    // Bodies are created in spawnObPhaser() and destroyed when OBS entry is removed.

    // ── Sync clem physics bodies ────────────────────────────
    for (const c of CLEMS) {
      if (c._body) {
        c._body.x = c.x;
        c._body.y = c.y + Math.sin(c.bobT) * 7;
        c._body.body.reset(c._body.x, c._body.y);
      }
    }

    // Remove clem bodies for clems that were destroyed externally
    if (this._clemGroup) {
      for (const body of this._clemGroup.getChildren()) {
        const stillExists = CLEMS.some(c => c._body === body);
        if (!stillExists) body.destroy();
      }
    }
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  width: W,
  height: H,
  render: { antialias: true, pixelArt: false },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
    // gravity set per-world in scene create()
  },
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: 1.5,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#111111',
  scene: [MainScene]
});
