// ── CANVAS SETUP ──────────────────────────────────────────────
let canvas, ctx; // assigned in Phaser scene create()
let scene; // global reference to current Phaser scene — used by game functions for camera shake
const W = 820;
const H = 420;
const GY = 345; // ground y
const PX = 150; // player fixed x

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    const rad = typeof r==='number'?[r,r,r,r]:(r||[0,0,0,0]);
    const [tl,tr,br,bl] = [rad[0]||0,rad[1]||0,rad[2]||0,rad[3]||0];
    this.moveTo(x+tl,y);
    this.lineTo(x+w-tr,y); this.quadraticCurveTo(x+w,y,x+w,y+tr);
    this.lineTo(x+w,y+h-br); this.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
    this.lineTo(x+bl,y+h); this.quadraticCurveTo(x,y+h,x,y+h-bl);
    this.lineTo(x,y+tl); this.quadraticCurveTo(x,y,x+tl,y);
    this.closePath();
  };
}

// ── CONSTANTS ─────────────────────────────────────────────────
const PHASE_DATA = [
  {name:'FORKLIFT', checkpoint:1000, color:'#FF8C00', transMsg:'FORKLIFT DESTROYED!', nextMsg:'AXE MAN INCOMING!'},
  {name:'AXE MAN',  checkpoint:2000, color:'#CC3300', transMsg:'AXE MAN DOWN!',       nextMsg:'BIKER SPOTTED!'},
  {name:'BIKER',    checkpoint:3000, color:'#6600CC', transMsg:'BIKER WRECKED!',       nextMsg:'HELICOPTER INBOUND!'},
  {name:'HELICOPTER',checkpoint:Infinity,color:'#FF0044',transMsg:'',nextMsg:''}
];

const BG_THEMES = [
  {sky1:'#FF9500',sky2:'#FF4400',gnd:'#7A5000',gline:'#8B5E0A',tc:'#AA3300'},
  {sky1:'#1A0050',sky2:'#080020',gnd:'#3A2804',gline:'#4A3305',tc:'#661800'},
  {sky1:'#66BB22',sky2:'#338811',gnd:'#1A6B1A',gline:'#228B22',tc:'#004400'},
  {sky1:'#BB2200',sky2:'#660000',gnd:'#331400',gline:'#441800',tc:'#331100'},
  {sky1:'#445566',sky2:'#223344',gnd:'#444455',gline:'#555566',tc:'#223333'}
];

// ── STATE ─────────────────────────────────────────────────────
let S = 'start'; // start|play|trans|gameover
let score=0, best=0, dist=0, frame=0, spd=3.5;
let phase=0, shake=0, shakeAmt=0;
let obTimer=0, obInterval=90;
let missTimer=0, missInterval=300;
let bullTimer=0, bullInterval=180;
let warnTimer=0, warnText='';
let transTimer=0, transMsg='', transNext='';
let hintAlpha=1;
// gs = current effective game speed (spd + playerSpdOffset), updated each frame
let gs=3.5;
// Lives
let lives=3;
// Player-controlled speed offset  (← / → or A / D keys held)
let playerSpdOffset=0;
// Clementines
let clemCount=0;
const CLEM_MAX=10;
const CLEMS=[];        // floating pickups
const THROWN=[];       // clementines thrown by player
let clemSpawnT=0;
let megaActive=false, megaTimer=0;
const MEGA_DUR=300;    // 5 seconds @ 60fps
// Checkpoint landmark buildings
const CPBLDGS=[];

// ── MENU ───────────────────────────────────────────────────────
const MENU = { sel: 0, view: 'main', tab: 'controls' }; // tab: 'controls' | 'info'

// ── AUDIO ──────────────────────────────────────────────────────
const BASE_PATH = 'assets/';
const SFX = {
  death:       new Audio(BASE_PATH + 'FAHHH%20Sound%20Effect.mp3'),
  bg:          new Audio(BASE_PATH + 'Jay-Z%20-%20The%20Story%20of%20OJ%20(Instrumental).mp3'),
  menuMove:    new Audio(BASE_PATH + 'menu%20move.wav'),
  credits:     new Audio(BASE_PATH + 'credits.wav'),
  hitObstacle: new Audio(BASE_PATH + 'hit%20obstacle.wav'),
  menuSelect:  new Audio(BASE_PATH + 'clicknig%20enter%20sound.mp3'),
  running:     new Audio(BASE_PATH + 'running%20audio.mp3'),
  donkey:      new Audio(BASE_PATH + 'Donkey%20-%20Sound%20Effect%20%20ProSounds%20(1).mp3'),
  amberAlert:  new Audio(BASE_PATH + 'Amber%20alert%20Sound%20Effect%20%20Soundboard%20Link.mp3'),
  jump:        new Audio(BASE_PATH + 'jumping%202.wav'),
  gunshot:     new Audio(BASE_PATH + 'Explosion_001.wav'),
  missileExp:  [new Audio(BASE_PATH + 'Explosion_001.wav'), new Audio(BASE_PATH + 'Explosion_002.wav'), new Audio(BASE_PATH + 'Explosion_003.wav')],
};
SFX.bg.loop = true;
SFX.bg.volume = 0.03;
SFX.running.loop = true;
SFX.running.volume = 0.12;
SFX.death.volume = 1.0;
SFX.menuMove.volume = 0.7;
SFX.credits.loop = true;
SFX.credits.volume = 0.4;
SFX.hitObstacle.volume = 0.8;
SFX.menuSelect.volume = 0.8;
SFX.jump.volume = 0.05;
SFX.donkey.volume = 1.0;
SFX.amberAlert.volume = 0.8;
SFX.gunshot.volume = 0.6;
SFX.missileExp.forEach(a => a.volume = 0.6);
function playBgMusic(){ /* bg music disabled */ }
function stopBgMusic(){ SFX.bg.pause(); }
function playDeath(){
  SFX.death.currentTime=0; SFX.death.volume=1.0;
  SFX.death.play().catch(()=>{});
  function _schedule(){
    const delay = Math.max(0, (SFX.death.duration - 5) * 1000);
    setTimeout(()=>{ SFX.donkey.currentTime=0; SFX.donkey.play().catch(()=>{}); }, delay);
  }
  if(SFX.death.duration){ _schedule(); }
  else { SFX.death.addEventListener('loadedmetadata', _schedule, {once:true}); }
}
function playMenuMove(){ SFX.menuMove.currentTime=0; SFX.menuMove.play().catch(()=>{}); }
function playMenuSelect(){ SFX.menuSelect.currentTime=0; SFX.menuSelect.play().catch(()=>{}); }
function playCreditsMusic(){ SFX.credits.currentTime=0; SFX.credits.play().catch(()=>{}); }
function stopCreditsMusic(){ SFX.credits.pause(); SFX.credits.currentTime=0; }
function playHitObstacle(){ SFX.hitObstacle.currentTime=0; SFX.hitObstacle.play().catch(()=>{}); }
function playRunningAudio(){ SFX.running.currentTime=0; SFX.running.play().catch(()=>{}); }
function stopRunningAudio(){ SFX.running.pause(); SFX.running.currentTime=0; }
function playJump(){ SFX.jump.currentTime=0; SFX.jump.play().catch(()=>{}); }
function playGunshot(){ SFX.gunshot.currentTime=0; SFX.gunshot.play().catch(()=>{}); }
function playMissileSound(){ const a=SFX.missileExp[0|Math.random()*3]; a.currentTime=0; a.play().catch(()=>{}); }
function playAmberAlert(){ if(SFX.amberAlert.paused){ SFX.amberAlert.currentTime=0; SFX.amberAlert.play().catch(()=>{}); } }
function stopAmberAlert(){ SFX.amberAlert.pause(); SFX.amberAlert.currentTime=0; }

// ── INPUT ──────────────────────────────────────────────────────
const K={};
let touchY0=0;
