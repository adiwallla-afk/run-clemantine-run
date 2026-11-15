// ── INTRO CUTSCENE ────────────────────────────────────────────
const INTRO = {
  timer: 0,
  lines: [
    { who:'fl', text:"Shawgi, you bipolar as fuck, i'm done with this!",  start:70,  end:200 },
    { who:'p',  text:"Oh no habibi, don't do this!",                       start:210, end:300 },
    { who:'p',  text:"I must run now, Sannas waiting!",                    start:310, end:390 },
    { who:'p',  text:"I have to reach Bacha Bazi!",                        start:395, end:475 },
    { who:'ax', text:"It's time to cleanse sweden.",                        start:485, end:580, fast:true },
    { who:'bk', text:"Fuck your cognitive dissonance",                      start:590, end:700 },
    { who:'p',  text:"fucking snake",                                       start:710, end:790, fast:true },
  ],
  RUN_START: 790,
  TOTAL: 792,
};

function drawIntro(){
  const t = INTRO.timer++;
  // Zoom: frames 0-90 pull back from 1.7 → 1.0 (cinematic pull-back)
  const zoomT = Math.min(1, t / 90);
  const scale  = 1.7 - 0.7 * easeOut(zoomT);

  // Apply zoom to the entire scene (background + characters together)
  const pivX = W/2, pivY = GY - 60;
  ctx.save();
  ctx.translate(pivX, pivY);
  ctx.scale(scale, scale);
  ctx.translate(-pivX, -pivY);

  // Background
  const introBg = SP.bgs && SP.bgs[0] && spriteReady(SP.bgs[0]) ? SP.bgs[0] : null;
  if(introBg){
    const iw=introBg.naturalWidth||800, ih=introBg.naturalHeight||320;
    const dh=GY, dw=Math.round(dh*iw/ih);
    for(let ox=0;ox<W;ox+=dw) ctx.drawImage(introBg,0,0,iw,ih,ox,0,dw,dh);
  } else {
    const grd=ctx.createLinearGradient(0,0,0,GY);
    grd.addColorStop(0,'#FFA640'); grd.addColorStop(1,'#CC5500');
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,GY);
  }
  // Floor
  const introFloorY = GY - 75;
  const introFloorReady = SP.floor && SP.floor.complete && SP.floor.naturalWidth > 0;
  if(introFloorReady){
    const fw=SP.floor.naturalWidth, fh=SP.floor.naturalHeight;
    const drawH=H-introFloorY;
    const drawW=Math.round(fw*drawH/fh);
    for(let ox=0;ox<W;ox+=drawW) ctx.drawImage(SP.floor,ox,introFloorY,drawW,drawH);
  } else {
    ctx.fillStyle='#7A5000'; ctx.fillRect(0,introFloorY,W,H-introFloorY);
  }

  // Felix — standing next to the forklift
  const felixX=175;
  const felixImg=SP.felixIntro&&SP.felixIntro.complete&&SP.felixIntro.naturalWidth>0?SP.felixIntro:null;
  if(felixImg){
    ctx.drawImage(felixImg,0,0,felixImg.naturalWidth,felixImg.naturalHeight,felixX-40,GY-90,80,90);
  }

  // Sahar — standing between Felix and Shawgi
  const saharX=220;
  const saharImg=SP.saharIntro&&SP.saharIntro.complete&&SP.saharIntro.naturalWidth>0?SP.saharIntro:null;
  if(saharImg){
    ctx.drawImage(saharImg,0,0,saharImg.naturalWidth,saharImg.naturalHeight,saharX-60,GY-115,120,115);
  }

  // Forklift — to the LEFT of Shawgi so when running begins it chases from behind
  const fx=20;
  if(!FL.drawSprite(fx)){
    [[fx+20,GY-13],[fx+90,GY-13]].forEach(([wx,wy])=>{
      ctx.fillStyle='#1A1A1A'; ctx.beginPath(); ctx.arc(wx,wy,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#555';    ctx.beginPath(); ctx.arc(wx,wy,5,0,Math.PI*2);  ctx.fill();
    });
    ctx.fillStyle='#FF8C00'; ctx.beginPath(); ctx.roundRect(fx+8,GY-58,92,46,5); ctx.fill();
    ctx.fillStyle='#E07000'; ctx.beginPath(); ctx.roundRect(fx+55,GY-82,45,34,[5,5,0,0]); ctx.fill();
    ctx.fillStyle='#99DDFF'; ctx.beginPath(); ctx.roundRect(fx+62,GY-76,30,20,3); ctx.fill();
    ctx.fillStyle='#777'; ctx.fillRect(fx-32,GY-36,46,6); ctx.fillRect(fx-32,GY-23,46,6);
    ctx.fillStyle='#555'; ctx.fillRect(fx+85,GY-88,6,22);
  }

  // Real Shawgi — always idle in intro
  const px=340;
  let introSImg = spriteReady(SP.idle) ? SP.idle : (SP.run && spriteReady(SP.run[0]) ? SP.run[0] : null);
  if(introSImg){
    ctx.drawImage(introSImg, 0,0,256,256, px-40, GY-80, 80, 80);
  } else {
    ctx.strokeStyle='#1A1A2E'; ctx.lineWidth=7; ctx.lineCap='round';
    ctx.fillStyle='#CC2200'; ctx.beginPath(); ctx.roundRect(px-13,GY-44,26,32,5); ctx.fill();
    ctx.fillStyle='#FFDAB9'; ctx.beginPath(); ctx.arc(px,GY-54,13,0,Math.PI*2); ctx.fill();
  }

  ctx.restore();

  // Dialogue bubbles (appear after zoom, typed out)
  ctx.font='bold 13px "Nunito",sans-serif';
  for(const ln of INTRO.lines){
    if(t < ln.start || t > ln.end) continue;
    const chars = Math.min(ln.text.length, Math.floor((t - ln.start) / (ln.fast ? 0.6 : 1.5)));
    const shown = ln.text.slice(0, chars);
    const isFl  = ln.who==='fl';
    const isAx  = ln.who==='ax';
    const isBk  = ln.who==='bk';
    const bx    = isFl ? fx+70 : isAx ? felixX+10 : isBk ? saharX+10 : px+50;
    const by    = isFl ? GY-155 : isAx ? GY-170 : isBk ? GY-170 : GY-160;
    const lines = wrapText(shown, 200);
    const bw=214, bh=lines.length*17+14;
    ctx.fillStyle='rgba(10,10,20,.9)';
    ctx.beginPath(); ctx.roundRect(bx-bw/2,by,bw,bh,8); ctx.fill();
    const bubbleColor = isFl?'rgba(255,140,0,.8)':isAx?'rgba(180,0,0,.8)':isBk?'rgba(0,180,80,.8)':'rgba(80,200,255,.8)';
    ctx.strokeStyle=bubbleColor; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(bx-bw/2,by,bw,bh,8); ctx.stroke();
    ctx.fillStyle='rgba(10,10,20,.9)';
    if(isAx){
      // Tail points down-left toward Felix's mouth
      ctx.beginPath(); ctx.moveTo(felixX,by+bh); ctx.lineTo(felixX+14,by+bh); ctx.lineTo(felixX+5,by+bh+18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(180,0,0,.8)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(felixX,by+bh); ctx.lineTo(felixX+5,by+bh+18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(felixX+14,by+bh); ctx.lineTo(felixX+5,by+bh+18); ctx.stroke();
    } else if(isBk){
      // Tail points down toward Sahar's mouth
      ctx.beginPath(); ctx.moveTo(saharX-7,by+bh); ctx.lineTo(saharX+7,by+bh); ctx.lineTo(saharX,by+bh+18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,180,80,.8)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(saharX-7,by+bh); ctx.lineTo(saharX,by+bh+18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(saharX+7,by+bh); ctx.lineTo(saharX,by+bh+18); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(bx-7,by+bh); ctx.lineTo(bx+7,by+bh); ctx.lineTo(bx,by+bh+10); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle=isAx?'#FF4444':isBk?'#44FF88':'#FFD700'; ctx.textAlign='center';
    lines.forEach((l,i)=>ctx.fillText(l,bx,by+14+i*17));
  }

  // Skip hint
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.font='11px "Nunito",sans-serif'; ctx.textAlign='center';
  ctx.fillText('SPACE to skip',W/2,H-10);

  // When last line ends — game begins seamlessly (same scene, forklift already on screen)
  if(t >= INTRO.TOTAL){ INTRO.timer=0; beginGameFromIntro(); }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHeart(x,y,lit){
  ctx.globalAlpha=lit?1:0.18;
  ctx.fillStyle=lit?'#FF2244':'#888';
  ctx.beginPath();
  ctx.moveTo(x,y+6);ctx.bezierCurveTo(x,y+2,x-9,y-4,x-9,y);
  ctx.bezierCurveTo(x-9,y-7,x,y-7,x,y-2);
  ctx.bezierCurveTo(x,y-7,x+9,y-7,x+9,y);
  ctx.bezierCurveTo(x+9,y-4,x,y+2,x,y+6);
  ctx.fill();ctx.globalAlpha=1;
}
function drawHUD(){
  ctx.textAlign='left';

  // TOP LEFT — score pill
  ctx.fillStyle='rgba(0,0,0,.48)';ctx.beginPath();ctx.roundRect(10,10,130,42,6);ctx.fill();
  ctx.fillStyle='#FFF';ctx.font='bold 24px "Fredoka One",cursive';ctx.fillText(Math.floor(score),16,38);
  ctx.fillStyle='#FFD700';ctx.font='10px "Nunito",sans-serif';ctx.fillText('BEST '+Math.floor(best),82,22);


  // TOP CENTRE — 3 hearts
  for(let i=0;i<3;i++) drawHeart(W/2-20+i*20,18,i<lives);

  // WARNING BANNER — flashing centre
  if(warnTimer>0){
    warnTimer--;
    ctx.globalAlpha=Math.min(1,warnTimer/12)*(warnTimer%10<5?1:0.4);
    ctx.fillStyle='#BB0000';ctx.beginPath();ctx.roundRect(W/2-130,8,260,40,6);ctx.fill();
    ctx.fillStyle='#FFF';ctx.font='bold 17px "Fredoka One",cursive';ctx.textAlign='center';
    ctx.fillText(warnText,W/2,34);ctx.globalAlpha=1;
  }

  // BOTTOM LEFT — jump dots + boost bar stacked
  {
    // jump dots
    for(let i=0;i<2;i++){
      ctx.fillStyle=P.jumpsLeft>i?'#88CCFF':'rgba(120,160,200,.22)';
      ctx.beginPath();ctx.arc(14+i*16,H-34,5,0,Math.PI*2);ctx.fill();
    }
  }

  // BOTTOM CENTRE — speed bar (slim, no text)
  {
    const sx=W/2-44,sy=H-16,sw=88;
    const r=(playerSpdOffset+2.5)/6.5;
    ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.roundRect(sx,sy,sw,7,3);ctx.fill();
    ctx.fillStyle=playerSpdOffset>0.3?'#FF6600':playerSpdOffset<-0.3?'#44AAFF':'#88CC88';
    ctx.beginPath();ctx.roundRect(sx+1,sy+1,Math.max(2,(sw-2)*r),5,2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(sx+sw*.38,sy,1,7);
  }

  // BOTTOM RIGHT — clementine pips + action label
  {
    const px=W-107,py=H-34;
    // Flash colour for pips: 5+ = red flash, 10 = red/white alternating
    let pipFlash = '#FF8800';
    if(clemCount>=CLEM_MAX){
      pipFlash = Math.floor(frame/6)%2===0 ? '#FF1111' : '#FFFFFF';
    } else if(clemCount>=5){
      pipFlash = Math.floor(frame/10)%2===0 ? '#FF1111' : '#FF8800';
    }
    for(let i=0;i<CLEM_MAX;i++){
      ctx.fillStyle=i<clemCount ? pipFlash : 'rgba(255,136,0,.18)';
      ctx.beginPath();ctx.arc(px+i*10+4,py,4,0,Math.PI*2);ctx.fill();
    }
    // mega bar when active
    if(megaActive){
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.roundRect(px,py+8,100,9,3);ctx.fill();
      ctx.fillStyle='#FF8800';ctx.beginPath();ctx.roundRect(px+1,py+9,Math.max(0,98*(megaTimer/MEGA_DUR)),7,2);ctx.fill();
    }
    // hint line
    let hint='D throw';
    if(megaActive)hint='MEGA '+Math.ceil(megaTimer/60)+'s';
    else if(clemCount>=CLEM_MAX)hint='A MEGA!';
    else if(clemCount>=5&&lives<3)hint='S heal';
    ctx.fillStyle=clemCount>=CLEM_MAX&&!megaActive?'#FFDD00':'rgba(255,255,255,.5)';
    ctx.font='bold 9px "Nunito",sans-serif';ctx.textAlign='right';
    ctx.fillText(hint,W-6,H-14);
    // pulse outline when mega ready
    if(clemCount>=CLEM_MAX&&!megaActive){
      ctx.strokeStyle=`rgba(255,220,0,${.4+.4*Math.sin(frame*.15)})`;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(px-4,py-8,116,28,4);ctx.stroke();
    }
  }

  // CONTROLS HINT — fades out
  if(hintAlpha>0){
    ctx.globalAlpha=hintAlpha*.65;
    ctx.fillStyle='#FFF';ctx.font='10px "Nunito",sans-serif';ctx.textAlign='center';
    ctx.fillText('SPACE=Jump  ↓=Crouch  X=Boost  ←/→=Speed  D=Throw  S=Heal(5)  A=Mega(10)',W/2,H-4);
    ctx.globalAlpha=1;
    if(dist>400)hintAlpha=Math.max(0,hintAlpha-.008);
  }
  ctx.textAlign='left';
}

// ── SCREENS ───────────────────────────────────────────────────
function drawStart(){
  // Background
  ctx.fillStyle='#0D0D0D'; ctx.fillRect(0,0,W,H);

  // Subtle vignette
  const vig=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,W*.75);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // ── LEFT PANEL — story ───────────────────────────────────────
  const lx=18, ly=18, lw=190, lh=H-36;
  ctx.fillStyle='rgba(255,255,255,.04)'; ctx.beginPath(); ctx.roundRect(lx,ly,lw,lh,10); ctx.fill();
  ctx.strokeStyle='rgba(255,160,40,.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(lx,ly,lw,lh,10); ctx.stroke();

  ctx.textAlign='left';
  ctx.fillStyle='rgba(255,180,60,.95)'; ctx.font='bold 11px "Nunito",sans-serif';
  ctx.fillText('THE STORY', lx+12, ly+20);
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(lx+12, ly+24, lw-24, 1);

  const story=[
    'Shawgi Naimi — a clementine',
    'farmer from war-filled Jordan.',
    '',
    'Bipolar, undisciplined, riddled',
    'with Cognitive Dissonance,',
    'and a burning need',
    'to be a hipster.',
    '',
    'With the absence of his',
    'Hash Finger, he is armed',
    'with nothing but his moustache',
    'and a bag of clementines.',
    '',
    'Shawgi must run, jump, and',
    'slide under obstacles. He has',
    'always run from his problems,',
    'but this time his problems',
    'are faster.',
    '',
    'The mission — reach Bacha',
    'Bazi with lovely Sanna.',
    '',
    'Will you be able to do it?',
  ];
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='11px "Nunito",sans-serif';
  story.forEach((line,i)=>ctx.fillText(line, lx+12, ly+40+i*15));

  // ── RIGHT PANEL — controls ───────────────────────────────────
  const rx=W-208, ry=18, rw=190, rh=H-36;
  ctx.fillStyle='rgba(255,255,255,.04)'; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,10); ctx.fill();
  ctx.strokeStyle='rgba(80,200,255,.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,10); ctx.stroke();

  // ── Tabs ──────────────────────────────────────────────────────
  const tabs=[['controls','CONTROLS'],['info','MORE INFO']];
  tabs.forEach(([id,label],i)=>{
    const tx=rx+12+i*88, tw2=82, ty=ry+6;
    const active=MENU.tab===id;
    ctx.fillStyle=active?'rgba(80,200,255,.22)':'rgba(255,255,255,.05)';
    ctx.beginPath();ctx.roundRect(tx,ty,tw2,18,[4,4,0,0]);ctx.fill();
    ctx.strokeStyle=active?'rgba(80,200,255,.6)':'rgba(255,255,255,.1)';
    ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(tx,ty,tw2,18,[4,4,0,0]);ctx.stroke();
    ctx.fillStyle=active?'rgba(80,200,255,.95)':'rgba(255,255,255,.35)';
    ctx.font=`${active?'bold ':''  }9.5px "Nunito",sans-serif`;ctx.textAlign='center';
    ctx.fillText(label,tx+tw2/2,ty+12);
  });
  ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(rx+10,ry+24,rw-20,1);

  if(MENU.tab==='controls'){
    const controls=[
      ['SPACE',      'Jump (x2 double jump)'],
      ['↓ / SHIFT',  'Slide under obstacles'],
      ['D',          'Throw clementine'],
      ['← / →',     'Adjust speed'],
      ['S',          'Heal  (5 clems)'],
      ['A',          'Mega Boost  (10 clems)'],
      ['TAB',        'More info & tips'],
    ];
    controls.forEach(([key,desc],i)=>{
      const cy=ry+42+i*28;
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.roundRect(rx+10,cy-12,54,16,4);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(rx+10,cy-12,54,16,4);ctx.stroke();
      ctx.fillStyle='rgba(255,220,100,.95)';ctx.font='bold 10px "Nunito",sans-serif';ctx.textAlign='left';
      ctx.fillText(key,rx+14,cy);
      ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='10px "Nunito",sans-serif';
      ctx.fillText(desc,rx+70,cy);
    });
    ctx.fillStyle='rgba(255,255,255,.2)';ctx.font='9px "Nunito",sans-serif';ctx.textAlign='center';
    ctx.fillText('TAB — more info',rx+rw/2,ry+rh-8);
  } else {
    const tips=[
      {t:'Clementines',d:'Throw at drones & rockets to\ndestroy them before they hit you.'},
      {t:'Slide',d:'Bee swarms require crouching.\nJumping won\'t save you.'},
      {t:'Mega Boost',d:'Invincible + blazing speed\nfor 5 seconds. Needs 10 clems.'},
      {t:'Heal',d:'Restores 1 life for 5 clems.\nOnly works if you\'ve been hit.'},
      {t:'Speed',d:'← slow down to dodge tight gaps.\n→ speed up to outrun chasers.'},
    ];
    tips.forEach((tip,i)=>{
      const ty2=ry+36+i*52;
      ctx.fillStyle='rgba(80,200,255,.7)';ctx.font='bold 10px "Nunito",sans-serif';ctx.textAlign='left';
      ctx.fillText('▸ '+tip.t,rx+12,ty2);
      ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='10px "Nunito",sans-serif';
      tip.d.split('\n').forEach((line,j)=>ctx.fillText(line,rx+12,ty2+13+j*13));
    });
    ctx.fillStyle='rgba(255,255,255,.2)';ctx.font='9px "Nunito",sans-serif';ctx.textAlign='center';
    ctx.fillText('TAB — back to controls',rx+rw/2,ry+rh-8);
  }

  // ── CENTRE — title ───────────────────────────────────────────
  ctx.textAlign='center';
  ctx.shadowColor='rgba(255,100,0,.7)'; ctx.shadowBlur=32;
  ctx.fillStyle='#FFFFFF'; ctx.font='bold 56px "Fredoka One",cursive';
  ctx.fillText('RUN', W/2, H/2-52);
  ctx.fillText('CLEMANTINE', W/2, H/2+8);
  ctx.fillText('RUN!', W/2, H/2+68);
  ctx.shadowBlur=0;

  // Divider lines flanking title
  ctx.strokeStyle='rgba(255,140,0,.3)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(lx+lw+10, H/2+38); ctx.lineTo(W/2-70, H/2+38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2+70, H/2+38); ctx.lineTo(rx-10, H/2+38); ctx.stroke();

  // ── Menu options ─────────────────────────────────────────────
  if(MENU.view==='main'){
    const opts=['▶  START GAME','👻  PAC-SHAWGI','🏆  SCOREBOARD','★  CREDITS'];
    const pulse=.75+.25*Math.sin(frame*.08);
    opts.forEach((label,i)=>{
      const oy=H/2+102+i*26;
      const sel=MENU.sel===i;
      ctx.globalAlpha=sel?1:0.45;
      if(sel){
        ctx.fillStyle='rgba(255,200,60,.18)';
        ctx.beginPath();ctx.roundRect(W/2-130,oy-18,260,24,6);ctx.fill();
        ctx.strokeStyle=`rgba(255,200,60,${pulse})`;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect(W/2-130,oy-18,260,24,6);ctx.stroke();
      }
      ctx.fillStyle=sel?'#FFD700':'rgba(255,255,255,.7)';
      ctx.font=`${sel?'bold ':''  }14px "Nunito",sans-serif`;
      ctx.textAlign='center';
      ctx.fillText(label,W/2,oy);
    });
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='10px "Nunito",sans-serif';
    ctx.fillText('↑ ↓  navigate    SPACE  select',W/2,H-12);
  } else if(MENU.view==='scoreboard'){
    drawScoreboard();
  } else {
    drawCredits();
  }
}

function drawScoreboard(){
  ctx.fillStyle='#0D0D0D';ctx.fillRect(0,0,W,H);
  const vig=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,W*.75);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.6)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

  ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.font='bold 36px "Fredoka One",cursive';
  ctx.shadowColor='rgba(255,180,0,.5)';ctx.shadowBlur=20;
  ctx.fillText('SCOREBOARD',W/2,58);
  ctx.shadowBlur=0;

  let runs=[];
  try{ runs=JSON.parse(localStorage.getItem('rcr_runs')||'[]'); }catch(e){}

  if(runs.length===0){
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='16px "Nunito",sans-serif';
    ctx.fillText('No runs yet. Go get your legs moving!',W/2,H/2);
  } else {
    // Header
    const cols=[W/2-300,W/2-80,W/2+60,W/2+180,W/2+280];
    ctx.fillStyle='rgba(255,200,60,.6)';ctx.font='bold 11px "Nunito",sans-serif';
    ['#','SCORE','DIST','PHASE','DATE'].forEach((h,i)=>ctx.fillText(h,cols[i],100));
    ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(W/2-310,106,620,1);

    runs.forEach((r,i)=>{
      const ry=124+i*26;
      const isTop=i===0;
      ctx.globalAlpha=1-i*0.06;
      if(isTop){
        ctx.fillStyle='rgba(255,215,0,.1)';
        ctx.beginPath();ctx.roundRect(W/2-310,ry-14,620,22,4);ctx.fill();
      }
      ctx.fillStyle=isTop?'#FFD700':'rgba(255,255,255,.8)';
      ctx.font=`${isTop?'bold ':''  }12px "Nunito",sans-serif`;
      [i+1, r.score, r.dist+'m', r.phase, r.date||'-'].forEach((v,j)=>ctx.fillText(v,cols[j],ry));
    });
    ctx.globalAlpha=1;
  }

  ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='11px "Nunito",sans-serif';
  ctx.fillText('SPACE / ESC  to go back',W/2,H-14);
}

function drawCredits(){
  ctx.fillStyle='#0D0D0D';ctx.fillRect(0,0,W,H);
  const vig=ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,W*.7);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.65)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

  ctx.textAlign='center';
  ctx.fillStyle='#FFFFFF';ctx.font='bold 34px "Fredoka One",cursive';
  ctx.shadowColor='rgba(255,100,0,.6)';ctx.shadowBlur=22;
  ctx.fillText('CREDITS',W/2,52);
  ctx.shadowBlur=0;

  const cast=[
    {name:'SHAWGI NAIMI',    role:'The Runner — Our Beautiful Disaster',        col:'#FFD700'},
    {name:'FORELLI',         role:'The Forklift Man — Disciplinarian',           col:'#FF8C00'},
    {name:'FELIX',           role:'The Axe Man — Straight Out of Prison',        col:'#CC3300'},
    {name:'SAHAR',           role:'The Snake — Cognitive Dissonance Incarnate',  col:'#AA44FF'},
    {name:'DIMA',            role:'Creative Support & Moral Damage',             col:'#44AAFF'},
    {name:'ADI',             role:'Creator, Developer & Chief Clementine Officer',col:'#44FF99'},
  ];

  cast.forEach((c,i)=>{
    const cy=100+i*50;
    // Name
    ctx.fillStyle=c.col;ctx.font='bold 16px "Fredoka One",cursive';
    ctx.shadowColor=c.col;ctx.shadowBlur=8;
    ctx.fillText(c.name,W/2,cy);
    ctx.shadowBlur=0;
    // Role
    ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='12px "Nunito",sans-serif';
    ctx.fillText(c.role,W/2,cy+18);
    // Divider
    if(i<cast.length-1){
      ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(W/2-180,cy+28,360,1);
    }
  });

  const pulse=.6+.4*Math.sin(frame*.06);
  ctx.globalAlpha=pulse;
  ctx.fillStyle='rgba(255,220,100,.8)';ctx.font='bold 12px "Nunito",sans-serif';
  ctx.fillText('Made with love, clementines & cognitive dissonance',W/2,H-30);
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='11px "Nunito",sans-serif';
  ctx.fillText('SPACE / ESC  to go back',W/2,H-14);
}

const DEATH_LINES = [
  "Sanna is already crying.\nShe knew this day would come.",
  "Ya kalb, even the clementines\nare ashamed of you.",
  "Habibi, you ran like a coward\nand died like one too.",
  "Somewhere, Sanna is sobbing.\nOff to jahanam ya kalb.",
  "Ya hmar, your legs gave up.\nMay sheytan keep you warm.",
  "The forklift has seen men die.\nNone this embarrassing.",
  "Sanna lit a candle for you.\nThen blew it out.",
  "Wallah, you lasted this long?\nSanna is still disappointed.",
  "You died as you lived:\nrunning from your problems, ya kalb.",
  "Hash finger could have saved you\nin this one.",
  "You thought your courage\nwas as big as your moustache.",
  "Now the Ayatollah's gonna\ntake care of Sanna.",
  "The moustache survived.\nMay sheytan take the rest.",
  "Sanna waited by the window.\nYa hmar, she can stop now.",
  "Ya azrayin, you should have thrown\nmore clementines.",
  "The Ayatollah sends his regards.\nSanna does not.",
  "Your mother named you Shawgi.\nYa kalb, she expected more.",
  "Hash finger warned you.\nYou didn't listen. Classic hmar.",
  "You outran no one.\nOff to jahanam ya zalameh.",
  "Sanna has already moved on.\nIt took her four minutes, ya kalb.",
  "Even the axe man felt bad for a second.\nThen he didn't.",
  "The Ayatollah is already\nredecorating Sanna's house.",
  "You ran from your problems.\nYa hmar, your problems were faster.",
  "Hash finger could fix a lot of things.\nNot this level of stupid.",
  "The forklift is celebrating.\nMay sheytan dance with you.",
  "Sanna bought a new plant.\nShe named it after someone better.",
  "Your moustache deserved better.\nThe rest of you, ya kalb? Debatable.",
  "Bipolar and slow, ya azrayin.\nOff to jahanam you go.",
  "The Ayatollah is sending flowers.\nNot to you.",
  "Two jumps, ya hmar.\nYou wasted both.",
  "Hash finger said don't go.\nYou went. May sheytan keep you.",
  "Sanna is making tea.\nFor someone who doesn't die like this.",
  "Ya zalameh, the biker\ndidn't even bother to spit on you.",
  "Off to jahanam ya kalb,\nstill clutching your clementines.",
  "Should have practiced more discipline,\nShawgi.",
  "Cognitive dissonance at its best.\nLive to die another day.",
  "Are you even trying\nya kalb?",
  "Ya hmar, even the forklift\nwas embarrassed for you.",
  "Discipline, Shawgi. Discipline.\nYou have none. Zero. Yalla.",
  "Yalla habibi, get up.\nOh wait. You can't.",
  "The axe man came out of prison just for this.\nYa azrayin, what a waste.",
  "Ya Shawgi, your legs are fast.\nYour brain is already in jahanam.",
  "Wallah, even Sanna\nsaw that one coming, ya hmar.",
  "Cognitive dissonance at full speed.\nMay sheytan enjoy the company.",
  "Ya kalb, the hole was right there.\nRight. There.",
  "Hash finger is shaking his head.\nHe will not cry for you.",
  "Ya zalameh, two legs, two jumps, zero brain.\nOff to jahanam.",
  "Forelli sends his condolences.\nHe does not mean it, ya kalb.",
  "Sanna didn't leave you.\nYou ran yourself straight to sheytan.",
  "May sheytan welcome you personally,\nya azrayin.",
  "Even the holes in the ground\nexpected more from you, ya hmar.",
  "Let's meet Shawgi.\nMeet in jahanam ya muntafik.",
  "Felix killed gays for breakfast.\nWhat made you think you weren't next? Ya shahid.",
  "Sahar called you a hipster to your face\nand you still didn't run fast enough. Off to jahanam.",
  "You could have jumped above that, you know.\nPress space, dumbass.",
];
let _deathLine = '';
function pickDeathLine(){
  _deathLine = DEATH_LINES[0|Math.random()*DEATH_LINES.length];
  try {
    const runs = JSON.parse(localStorage.getItem('rcr_runs')||'[]');
    const phaseNames=['FORKLIFT','AXE MAN','BIKER','HELICOPTER'];
    runs.unshift({score:Math.floor(score), dist:Math.floor(dist), phase:phaseNames[phase]||'?', date:new Date().toLocaleDateString()});
    localStorage.setItem('rcr_runs', JSON.stringify(runs.slice(0,10)));
  } catch(e){}
}

function drawGameover(){
  ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  // Big DEAD
  ctx.shadowColor='#660000';ctx.shadowBlur=30;
  ctx.fillStyle='#8B0000';ctx.font='bold 96px "Fredoka One",cursive';
  ctx.fillText('DEAD',W/2,118);
  ctx.shadowBlur=0;
  // Cynical subtitle
  ctx.fillStyle='rgba(200,160,160,.85)';ctx.font='15px "Nunito",sans-serif';
  const dl=_deathLine.split('\n');
  dl.forEach((ln,i)=>ctx.fillText(ln,W/2,148+i*22));
  // Score
  ctx.fillStyle='#FFF';ctx.font='22px "Nunito",sans-serif';ctx.fillText('Score: '+Math.floor(score),W/2,210);
  ctx.fillStyle='#FFD700';ctx.fillText('Best: '+Math.floor(best),W/2,238);
  // Restart button
  const pulse=.84+.16*Math.sin(frame*.12);
  ctx.save();ctx.translate(W/2,H*.86);ctx.scale(pulse,pulse);
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.roundRect(-130,-26,260,52,26);ctx.fill();
  ctx.fillStyle='#8B0000';ctx.font='bold 20px "Fredoka One",cursive';ctx.fillText('PRESS R TO RESTART',0,10);
  ctx.restore();
}

function drawTrans(){
  if(transTimer<=0)return;
  transTimer--;
  // Slide in from top, hold, slide out — game keeps running underneath
  const slideIn=Math.min(1,(160-transTimer)/18);
  const slideOut=transTimer<18?transTimer/18:1;
  const vis=slideIn*slideOut;
  const yOff=(1-vis)*(-100);
  ctx.save();
  ctx.globalAlpha=vis;
  ctx.translate(0,yOff);
  // Banner strip
  ctx.fillStyle='rgba(10,10,20,.82)';
  ctx.fillRect(0,H*.28,W,88);
  ctx.strokeStyle='rgba(255,200,0,.6)';ctx.lineWidth=2;
  ctx.strokeRect(0,H*.28,W,88);
  ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.font='bold 38px "Fredoka One",cursive';
  ctx.fillText(transMsg,W/2,H*.28+44);
  ctx.fillStyle='#FF7777';ctx.font='bold 20px "Fredoka One",cursive';
  ctx.fillText(transNext,W/2,H*.28+70);
  ctx.restore();
}

function drawPause(){
  ctx.fillStyle='rgba(0,0,0,0.72)';
  ctx.fillRect(0,0,W,H);
  ctx.save();

  // ── Title ────────────────────────────────────────────────────
  ctx.textAlign='center';
  ctx.font='bold 48px "Fredoka One",cursive';
  ctx.fillStyle='#FFE566';
  ctx.strokeStyle='#222'; ctx.lineWidth=5;
  ctx.strokeText('PAUSED',W/2,46);
  ctx.fillText('PAUSED',W/2,46);

  // ── Controls panel — left ────────────────────────────────────
  const lx=30, ly=68, lw=190, lh=H-90;
  ctx.fillStyle='rgba(255,255,255,.05)'; ctx.beginPath(); ctx.roundRect(lx,ly,lw,lh,8); ctx.fill();
  ctx.strokeStyle='rgba(80,200,255,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(lx,ly,lw,lh,8); ctx.stroke();

  ctx.textAlign='left';
  ctx.fillStyle='rgba(80,200,255,.95)'; ctx.font='bold 11px "Nunito",sans-serif';
  ctx.fillText('CONTROLS', lx+12, ly+18);
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(lx+12,ly+22,lw-24,1);

  const controls=[
    ['SPACE',     'Jump  (x2 double jump)'],
    ['↓ / SHIFT', 'Slide under obstacles'],
    ['F / E',     'Throw clementine'],
    ['← / →',    'Adjust speed'],
    ['H',         'Heal  (5 clems)'],
    ['Q',         'Mega Boost  (10 clems)'],
    ['ESC',       'Pause / Resume'],
  ];
  controls.forEach(([key,desc],i)=>{
    const cy=ly+38+i*26;
    ctx.fillStyle='rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(lx+10,cy-12,52,15,4); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(lx+10,cy-12,52,15,4); ctx.stroke();
    ctx.fillStyle='rgba(255,220,100,.95)'; ctx.font='bold 10px "Nunito",sans-serif';
    ctx.fillText(key, lx+14, cy);
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='10px "Nunito",sans-serif';
    ctx.fillText(desc, lx+68, cy);
  });

  // ── Mission panel — right ────────────────────────────────────
  const rx=W-220, ry=68, rw=190, rh=H-90;
  ctx.fillStyle='rgba(255,255,255,.05)'; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.fill();
  ctx.strokeStyle='rgba(255,160,40,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,8); ctx.stroke();

  ctx.fillStyle='rgba(255,180,60,.95)'; ctx.font='bold 11px "Nunito",sans-serif';
  ctx.fillText('THE MISSION', rx+12, ry+18);
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(rx+12,ry+22,rw-24,1);

  const mission=[
    'Run, jump, and slide your',
    'way through Jordan.',
    '',
    'Collect clementines to',
    'throw, heal, or unleash',
    'the Mega Boost.',
    '',
    'Survive every chaser.',
    '',
    'Reach Bacha Bazi',
    'with lovely Sanna.',
  ];
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='11px "Nunito",sans-serif';
  mission.forEach((line,i)=>ctx.fillText(line, rx+12, ry+38+i*17));

  // ── Resume prompt ─────────────────────────────────────────────
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='13px "Nunito",sans-serif';
  ctx.fillText('SPACE  resume    ESC  main menu', W/2, H-14);

  ctx.restore();
}
