// ── SPRITE CATALOGUE ──────────────────────────────────────────
// Every canvas draw function below has a SPRITE ID comment.
// To replace with a real sprite image: load it with new Image(),
// then swap the matching draw block for ctx.drawImage(yourImg, x, y, w, h).
//
// PLAYER  (P.draw)
//   sprite_player_run      — legs/arms swinging run cycle
//   sprite_player_jump     — mid-air body
//   sprite_player_crouch   — squished/low body
//   sprite_player_dead     — death tumble
//
// CHASERS
//   sprite_chaser_forklift    — FL.draw  (orange forklift)
//   sprite_chaser_axeman      — AX.draw  (dark-outfit running man with axe)
//   sprite_chaser_biker       — BK.draw  (purple biker on motorbike)
//   sprite_chaser_helicopter  — HE.draw  (blue helicopter, bobbing)
//
// OBSTACLES
//   sprite_obstacle_crate     — drawCrate   (wooden box, 38×42)
//   sprite_obstacle_rock      — drawRock    (irregular stone, 45×35)
//   sprite_obstacle_fence     — drawFence   (two-rail wood fence, 52×55)
//   sprite_obstacle_debris    — drawDebris  (low scattered metal, 58×22)
//   sprite_obstacle_hole      — drawHole    (dark pit, variable width)
//
// PROJECTILES
//   sprite_projectile_missile — drawMissile (right-to-left rocket w/ trail)
//   sprite_projectile_bullet  — drawBullet  (small gold capsule)
//
// BACKGROUND LAYERS  (drawBG / drawTree / drawBldg)
//   sprite_bg_tree_round        — drawTree type 0 (round leafy tree)
//   sprite_bg_tree_clementine   — drawTree type 1 (round tree with orange fruit)
//   sprite_bg_tree_pine         — drawTree type 2 (triangle pine)
//   sprite_bg_building          — drawBldg        (tall industrial block with lit windows)
//   sprite_bg_cloud             — cloud loop in drawBG
//
// ── SPRITE IMAGES ─────────────────────────────────────────────
const SP = {};
(function(){
  const BASE = 'assets/';
  const load = (k,p) => { const i=new Image(); i.src=BASE+p; SP[k]=i; };
  load('c1','clemantines/clemantine%201.png');
  load('c2','clemantines/clemantine%202.png');
  load('c3','clemantines/clemantine%203.png');
  load('r1','rocket%201.PNG');
  load('r2','rocket%202.PNG');
  load('r3','rocket%203.PNG');
  load('floor','loopy.png');
  load('obs_crate','obs_crate.png');
  load('obs_drone','obs_drone.png');
  load('obs_rocket','obs_rocket.png');
  load('obs_wall','obs_wall.png');
  load('obs_sanna','obs_sanna.png');
  load('obs_car','obs_car.png');
  load('obs_cart','obs_cart.png');
  load('obs_clem_box','obs_clem_box.png');
  load('obs_clem_rocket','obs_clem_rocket.png');
  load('obs_donkey','obs_donkey.png');
  load('obs_bees','obs_bees.png');
  loadLocal('obs_hole','obs_hole.png');
  load('obs_habibi','obstalce%20jump/obstalce%20habibi.png');
  load('cp_sanna','sannas%20hotspot.png');
  SP.felix=[];
  for(let i=1;i<=25;i++){const _fi=new Image();_fi.src=BASE+'felix'+String(i).padStart(2,'0')+'.png';SP.felix.push(_fi);}
  SP.felixIntro=new Image();SP.felixIntro.src=BASE+'felix_intro.png';
  SP.saharIntro=new Image();SP.saharIntro.src=BASE+'sahar%20intro.png';

  // ── Web assets (CC0 — opengameart.org) ───────────────────────
  const web = (k,url) => {
    const i=new Image(); i.crossOrigin='anonymous';
    i.onerror=()=>{ SP[k]=null; }; // silent fallback if URL fails
    i.src=url; SP[k]=i;
  };
  // Biker with rider — static side-view sprite (~288×222)
  web('bk','https://opengameart.org/sites/default/files/spr_bike2man_0_0.png');
  // Sahar biker sprite (white bg stripped) + 10 transparent smoke trail frames
  loadLocal('sahar','sahar.png');
  SP.sahar_trail=[];
  for(let i=0;i<=9;i++){
    const f=new Image();
    f._ready=false;
    f.onload=()=>{f._ready=true;};
    f.onerror=()=>{console.warn('trail'+i+'.png failed to load');};
    f.src=BASE+'trail'+i+'.png';
    SP.sahar_trail.push(f);
  }
  // Parallax background layers (6 layers, forest/outdoor theme)
  web('bg1','https://opengameart.org/sites/default/files/1_188.png');
  web('bg2','https://opengameart.org/sites/default/files/2_109.png');
  web('bg3','https://opengameart.org/sites/default/files/3_84.png');
  web('bg4','https://opengameart.org/sites/default/files/4_52.png');
  web('bg5','https://opengameart.org/sites/default/files/5_49.png');
  web('bg6','https://opengameart.org/sites/default/files/6_33.png');
  // Helper: load local sprite, strip white bg into offscreen canvas
  function loadLocal(key, path, multiplyKey){
    const img = new Image();
    img.src = BASE + path;
    img.onload = () => {
      const oc = document.createElement('canvas');
      oc.width = img.width; oc.height = img.height;
      const octx = oc.getContext('2d');
      octx.drawImage(img, 0, 0);
      try {
        const id = octx.getImageData(0, 0, oc.width, oc.height);
        const d = id.data;
        for(let i=0;i<d.length;i+=4){
          const lo=Math.min(d[i],d[i+1],d[i+2]);
          if(lo>185) d[i+3]=Math.round(Math.max(0,(255-lo)/70*255));
        }
        octx.putImageData(id,0,0);
        SP[key]=oc;
      } catch(e){
        SP[key]=img;
        if(multiplyKey) SP[multiplyKey]=true;
      }
    };
  }
  // ── Player character sprites ──────────────────────────────────
  // Running: 25 individual 256×256 frames
  SP.run=[];
  for(let i=1;i<=25;i++){
    const img=new Image();
    img.src=BASE+'character/Running/'+(i===1?'Running%201':('running'+i))+'.png';
    SP.run.push(img);
  }
  // Jumping: 14 frames (named jumping1, jumping12-jumping19, jumping110-jumping114)
  SP.jump=[];
  ['jumping1','jumping12','jumping13','jumping14','jumping15','jumping16','jumping17',
   'jumping18','jumping19','jumping110','jumping111','jumping112','jumping113','jumping114'
  ].forEach(n=>{ const img=new Image(); img.src=BASE+'character/Jumping/'+n+'.png'; SP.jump.push(img); });
  // Throw: 1280×1280 sheet, 5×5 grid, 25 frames of 256×256
  SP.throw=new Image(); SP.throw.src=BASE+'character/Shawgi-throw.png';
  // Crouch: 25-frame animation
  SP.crouch=[];
  for(let i=1;i<=25;i++){ const img=new Image(); img.src=BASE+'character/crouching/crouching%20'+i+'.png'; SP.crouch.push(img); }
  // Idle: single pose used during intro cutscene
  SP.idle=new Image(); SP.idle.src=BASE+'character/idle.png';
  // Dead: death pose / sheet used when player dies
  SP.dead=new Image(); SP.dead.src=BASE+'character/dead.png';
  // Forklift chaser — single sprite, white-bg stripped
  loadLocal('fkSprite','character/forklift/FORKLIFT%20SPRITE.png');

  // Explosion — 1024×1024, 4×4 grid (16 frames of 256×256)
  loadLocal('exp','explosions%20sprite.png');
  // Background — single clementine field scene
  SP.bgs=[];
  const bgImg0=new Image(); bgImg0.src=BASE+'backrounds/backround.3.png'; SP.bgs.push(bgImg0);
  // Floor textures — tileable CC0 from OpenGameArt
  web('fGrass','https://opengameart.org/sites/default/files/grass_34.png');
  web('fDirt', 'https://opengameart.org/sites/default/files/dirt_9.png');
})();
function spriteReady(img){ return img && (img.complete||img instanceof HTMLCanvasElement) && (img.naturalWidth>0||img instanceof HTMLCanvasElement); }

// ── VFX ASSETS (SVG data URIs — no network, no CORS, always work) ────────
const VFX = {};
(function(){
  const svg = (key, w, h, markup) => {
    const img = new Image();
    img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${markup}</svg>`)}`;
    VFX[key] = img;
  };
  // Soft smoke/dust puff — three overlapping translucent circles
  svg('smoke', 64, 64,
    `<circle cx="32" cy="34" r="24" fill="rgba(210,200,185,0.72)"/>
     <circle cx="18" cy="24" r="17" fill="rgba(225,215,200,0.58)"/>
     <circle cx="46" cy="26" r="15" fill="rgba(195,185,170,0.52)"/>
     <circle cx="32" cy="32" r="10" fill="rgba(240,235,225,0.4)"/>`);
  // Orange clementine fruit with leaf
  svg('clem_ground', 28, 28,
    `<circle cx="14" cy="16" r="11" fill="#FF7700"/>
     <circle cx="10" cy="13" r="3.5" fill="rgba(255,160,50,0.45)"/>
     <ellipse cx="19" cy="6" rx="6" ry="3" fill="#2D9E00" transform="rotate(-25,19,6)"/>
     <line x1="14" y1="5" x2="14" y2="10" stroke="#1A6600" stroke-width="1.5"/>`);
  // Crack/jagged stone edge for holes
  svg('crack', 20, 14,
    `<polygon points="0,14 4,7 7,2 11,8 16,3 20,14" fill="#3A3028"/>
     <polygon points="2,14 5,9 9,5 13,10 18,5 20,14" fill="#2A221A" opacity="0.7"/>`);
  // Warning glow for obstacles — subtle orange rim light
  svg('ob_glow', 8, 8,
    `<rect width="8" height="8" rx="2" fill="rgba(255,120,0,0.18)"/>`);
})();
