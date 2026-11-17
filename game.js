import * as THREE from 'three';

// NEON RUSH — all gameplay and visuals are generated procedurally.
const $ = (id) => document.getElementById(id);
const dom = {
  hud: $('hud'), screen: $('screen'), menu: $('menuPanel'), pause: $('pausePanel'), over: $('overPanel'),
  score: $('score'), coins: $('coins'), level: $('level'), hearts: $('hearts'),
  levelToast: $('levelToast'), hit: $('hitFlash'), sound: $('soundBtn')
};
const THREE_COLOR = { cyan: 0x3deaff, pink: 0xff32ae, gold: 0xffd45a, violet: 0x9c4aff, red: 0xff365a };
const LANES = [-3.3, 0, 3.3], PLAYER_Z = 8;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050718);
scene.fog = new THREE.FogExp2(0x080e26, 0.014);
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, .1, 350);
camera.position.set(0, 7, 19);
camera.lookAt(0, 2.8, -19);
const mobileDevice = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 650;
const renderRatio = () => Math.min(devicePixelRatio, mobileDevice ? 1.2 : 1.75);
const renderer = new THREE.WebGLRenderer({ antialias: !mobileDevice, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(renderRatio());
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;
$('game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x5684ff, 0x0e0519, 2));
const mainLight = new THREE.PointLight(THREE_COLOR.cyan, 140, 35);mainLight.position.set(-4, 12, 9);scene.add(mainLight);
const sideLight = new THREE.PointLight(THREE_COLOR.pink, 110, 40);sideLight.position.set(8, 9, -4);scene.add(sideLight);

const mat = (color, emissiveIntensity = .25, opts = {}) => new THREE.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity, metalness: .35, roughness: .35, ...opts
});
const darkMat = new THREE.MeshStandardMaterial({color:0x09132c, metalness:.42, roughness:.5});
const cyanMat = mat(THREE_COLOR.cyan, 2), pinkMat = mat(THREE_COLOR.pink, 2);
const goldMat = mat(THREE_COLOR.gold, 2.4, {metalness:.85,roughness:.14});
const redMat = mat(THREE_COLOR.red, 1.8), violetMat = mat(THREE_COLOR.violet, 2.2);
function cube(parent, w, h, d, material, x=0,y=0,z=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;
}
function sphere(parent,r,material,x=0,y=0,z=0,segments=12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r,segments,8),material);m.position.set(x,y,z);parent.add(m);return m;
}
const world = new THREE.Group();scene.add(world);
const road = cube(world, 11.4, .25, 220, darkMat,0,-.2,-90);
cube(world, .16,.09,220,cyanMat,-5.65,.03,-90);cube(world,.16,.09,220,pinkMat,5.65,.03,-90);
const trackPieces=[];
for(let z=-165; z<18; z+=9){
  const g=new THREE.Group();g.position.z=z;
  cube(g,11.25,.025,.08,mat(0x225eaa,.75),0,.02,0);
  for(const x of [-1.65,1.65]) cube(g,.05,.04,4.2,mat(0x2b92e4,1),x,.04,0);
  world.add(g);trackPieces.push(g);
}
const buildings=[];
const buildingMats=[mat(0x112a53,.2),mat(0x182545,.2),mat(0x1b2446,.1)];
function configureBuilding(g,z) {
  for (const child of [...g.children]) { child.geometry?.dispose(); g.remove(child); }
  g.position.z=z;
  const side=g.userData.side;
  const h=rand(9,34), w=rand(3,7), x=side*rand(10.5,20);
  cube(g,w,h,rand(5,10),buildingMats[Math.floor(Math.random()*3)],x,h/2-.15,0);
  const neon= Math.random()<.5 ? cyanMat:pinkMat;
  for(let i=1;i<Math.floor(h/2);i++){
    const yy=i*2-.1;
    cube(g,w*.72,.08,.06,neon,x,yy,(side===1?4:-4));
  }
  cube(g,w+.1,.13,7,neon,x,h,0);
}
for(let z=-185;z<33;z+=18){for(const side of [-1,1]){
  const g=new THREE.Group();g.userData.side=side;configureBuilding(g,z+rand(-4,4));world.add(g);buildings.push(g);
}}
// Floating stars produce depth beyond the buildings.
const starCount = mobileDevice ? 380 : 900;
const starPos = new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){starPos[i*3]=rand(-160,160);starPos[i*3+1]=rand(10,100);starPos[i*3+2]=rand(-210,30)}
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x98caff,size:.3,transparent:true,opacity:.9})));

// Player: stylized neon armored runner. The hitbox uses lane + action state.
const runner=new THREE.Group();scene.add(runner);
const body=new THREE.Group();runner.add(body);
const suit=mat(0x173c72,.18,{metalness:.82}), face=mat(0xb6faff,.45), visor=mat(0xff53d1,1.8);
cube(body,1.08,1.3,.67,suit,0,1.75,0);
cube(body,.79,.25,.71,cyanMat,0,1.92,.34);
cube(body,.86,.76,.78,suit,0,2.72,0);
cube(body,.78,.24,.11,visor,0,2.78,.42);
const limbGroups=[];
for(const sign of [-1,1]){
  const arm=new THREE.Group();arm.position.set(sign*.73,2.18,0);
  cube(arm,.34,.92,.36,suit,0,-.42,0);cube(arm,.41,.1,.41,pinkMat,0,-.78,0);
  body.add(arm);limbGroups.push(arm);
  const leg=new THREE.Group();leg.position.set(sign*.32,1.14,0);
  cube(leg,.43,1.05,.43,suit,0,-.5,0);cube(leg,.49,.18,.65,cyanMat,0,-.97,.13);
  body.add(leg);limbGroups.push(leg);
}
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.9,22),new THREE.MeshBasicMaterial({color:0x19dfff,transparent:true,opacity:.19,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;runner.add(shadow);
const trail=[];
for(let i=0;i<14;i++){
  const p=new THREE.Mesh(new THREE.SphereGeometry(.06,5,5),new THREE.MeshBasicMaterial({color:i%2?THREE_COLOR.pink:THREE_COLOR.cyan,transparent:true,opacity:.6}));
  scene.add(p);trail.push(p);
}

const obstacles=[];const pickups=[];const bursts=[];
function makeObstacle(type,lane,z){
  const g=new THREE.Group();g.position.set(LANES[lane],0,z);
  if(type==='block'){
    cube(g,2.2,3.8,1.4,darkMat,0,1.9,0);
    for(const x of [-1.08,1.08]) cube(g,.11,3.9,1.55,redMat,x,1.95,0);
    for(const y of [.35,1.5,2.65,3.75]) cube(g,2.22,.095,1.52,redMat,0,y,0);
    cube(g,1.0,.25,1.48,redMat,0,1.95,.01);
  } else if(type==='hurdle'){
    cube(g,2.35,1.05,1.05,mat(0x753316,.6),0,.54,0);
    for(const y of [.2,.85]) cube(g,2.45,.13,1.1,goldMat,0,y,0);
    for(const x of [-1.17,1.17]) cube(g,.13,1.1,1.12,goldMat,x,.53,0);
  } else {
    for(const x of [-1.05,1.05]) cube(g,.19,4.0,.42,violetMat,x,2,0);
    cube(g,2.15,.32,.4,violetMat,0,2.55,0);
    cube(g,2.15,.09,.37,mat(0xf0b6ff,3),0,2.31,0);
  }
  scene.add(g);obstacles.push({g,type,lane,z,checked:false});
}
function makeCoin(lane,z){
  const g=new THREE.Group();g.position.set(LANES[lane],1.35,z);
  const torus=new THREE.Mesh(new THREE.TorusGeometry(.43,.14,7,18),goldMat);g.add(torus);
  sphere(g,.18,mat(0xffffff,1.8),0,0,0,8);
  scene.add(g);pickups.push({g,lane,z,checked:false});
}
function burst(x,y,z,color,count=16){
  for(let i=0;i<count;i++){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
    mesh.position.set(x,y,z);scene.add(mesh);
    bursts.push({mesh,velocity:new THREE.Vector3(rand(-7,7),rand(-2,8),rand(-6,6)),life:rand(.3,.8),maxLife:.8});
  }
}

// Original synthesized sound: no MP3 files, no external audio licensing.
class Synth {
  constructor(){this.ctx=null;this.enabled=true;this.nextBeat=0;this.beat=0;}
  init(){if(!this.ctx){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;this.ctx=new AudioContext()} if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});this.nextBeat=this.ctx.currentTime+.06;}
  tone(freq=.0,duration=.15,type='sine',volume=.04,delay=0){
    if(!this.enabled||!this.ctx)return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(1,freq),t);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(this.ctx.destination);osc.start(t);osc.stop(t+duration+.025);
  }
  jump(){this.tone(300,.13,'sawtooth',.042);this.tone(500,.2,'sine',.05,.08)}
  slide(){this.tone(155,.15,'triangle',.06);this.tone(90,.22,'sawtooth',.016,.04)}
  coin(){this.tone(880,.11,'sine',.065);this.tone(1320,.2,'sine',.045,.1)}
  hit(){this.tone(110,.36,'sawtooth',.09);this.tone(65,.42,'triangle',.065)}
  levelUp(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.19,'triangle',.055,i*.105))}
  update(){if(!this.ctx||!this.enabled||state!=='playing')return;
    const notes=[110,0,165,0,146.83,0,196,0,130.81,0,174.61,0,146.83,0,220,0];
    let scheduled=0;
    while(this.nextBeat<this.ctx.currentTime+.10 && scheduled++<4){
      const note=notes[this.beat%notes.length];if(note)this.tone(note,.19,'triangle',.017,Math.max(0,this.nextBeat-this.ctx.currentTime));
      if(this.beat%4===0)this.tone(55,.13,'sine',.045,Math.max(0,this.nextBeat-this.ctx.currentTime));
      this.beat++;this.nextBeat+=.24;
    }
    if(this.nextBeat<this.ctx.currentTime-.5)this.nextBeat=this.ctx.currentTime+.04;
  }
}
const synth=new Synth();
let state='menu',lane=1,targetX=0,currentX=0,jumpY=0,jumpVelocity=0,slideTime=0;
let score=0,coins=0,meters=0,level=1,lives=3,speed=26,invincible=0,spawnIn=0;
let elapsed=0,worldDistance=0,toastTime=0,shake=0;
let best=0;try{best=Number(localStorage.getItem('neonRushBest')||0)}catch{}
$('menuBest').textContent=best.toLocaleString();
function showPanel(which){
  dom.screen.classList.remove('hidden');
  for(const name of ['menu','pause','over'])dom[name].classList.toggle('hidden',name!==which);
}
function hidePanel(){dom.screen.classList.add('hidden')}
function clearObjects(){
  for(const arr of [obstacles,pickups]){for(const o of arr)scene.remove(o.g);arr.length=0;}
  for(const p of bursts)scene.remove(p.mesh);bursts.length=0;
}
function reset(){
  clearObjects();lane=1;targetX=0;currentX=0;jumpY=0;jumpVelocity=0;slideTime=0;
  score=0;coins=0;meters=0;level=1;lives=3;speed=26;invincible=0;spawnIn=1.8;
  elapsed=0;worldDistance=0;toastTime=0;shake=0;runner.visible=true;
  runner.position.set(0,0,PLAYER_Z);body.scale.y=1;body.position.y=0;
  updateHud();dom.levelToast.style.opacity='0';dom.hit.style.opacity='0';
}
function start(){reset();state='playing';hidePanel();dom.hud.classList.remove('hidden');$('mobileControls').classList.remove('hidden');synth.init();synth.levelUp()}
function toMenu(){state='menu';dom.hud.classList.add('hidden');$('mobileControls').classList.add('hidden');clearObjects();$('menuBest').textContent=best.toLocaleString();showPanel('menu')}
function pause(){if(state!=='playing')return;state='paused';showPanel('pause')}
function resume(){if(state!=='paused')return;state='playing';hidePanel();if(synth.ctx)synth.nextBeat=synth.ctx.currentTime+.05}
function gameOver(){
  if(state!=='playing')return;
  state='over';synth.hit();
  if(score>best){best=score;try{localStorage.setItem('neonRushBest',String(best))}catch{}}
  $('finalScore').textContent=score.toLocaleString();$('finalCoins').textContent=coins;
  $('finalLevel').textContent=level;$('finalBest').textContent=best.toLocaleString();
  $('overMessage').textContent=score===best&&score>0?'新纪录！这座城市记住了你的名字。':'霓虹不会熄灭，再挑战一次！';
  $('mobileControls').classList.add('hidden');showPanel('over');
}
function updateHud(){dom.score.textContent=String(score).padStart(6,'0');dom.coins.textContent=coins;dom.level.textContent=String(level).padStart(2,'0');dom.hearts.textContent='♥ '.repeat(lives)+'♡ '.repeat(3-lives)}
function move(dir){if(state!=='playing')return;lane=clamp(lane+dir,0,2);targetX=LANES[lane]}
function jump(){if(state!=='playing'||jumpY>.03||slideTime>0)return;jumpVelocity=10.8;synth.jump()}
function slide(){if(state!=='playing'||jumpY>.1||slideTime>0)return;slideTime=.82;synth.slide()}
function action(e){
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==='KeyM'){toggleSound();return}
  if(e.code==='KeyP'||e.code==='Escape'){state==='playing'?pause():state==='paused'?resume():null;return}
  if(state!=='playing')return;
  if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);
  else if(e.code==='ArrowRight'||e.code==='KeyD')move(1);
  else if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space')jump();
  else if(e.code==='ArrowDown'||e.code==='KeyS')slide();
}
window.addEventListener('keydown',action);
function toggleSound(){synth.enabled=!synth.enabled;dom.sound.textContent=synth.enabled?'♪ ON':'♪ OFF';if(synth.enabled){synth.init()} }
$('startBtn').onclick=start;$('restartBtn').onclick=start;$('resumeBtn').onclick=resume;
$('homeBtn').onclick=toMenu;$('pauseHomeBtn').onclick=toMenu;
$('pauseBtn').onclick=()=>state==='playing'?pause():resume();dom.sound.onclick=toggleSound;
for(const [id,fn] of [['leftTouch',()=>move(-1)],['rightTouch',()=>move(1)],['jumpTouch',jump],['slideTouch',slide]]){
  $(id).addEventListener('pointerdown',(e)=>{e.preventDefault();fn()});
}
// Swipe controls work on the 3D canvas, without interfering with menu buttons.
let touchStart = null;
renderer.domElement.style.touchAction = 'none';
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || state !== 'playing') return;
  touchStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!touchStart || touchStart.id !== e.pointerId) return;
  const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
  touchStart = null;
  if (state !== 'playing' || Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
  else if (dy < 0) jump(); else slide();
});
renderer.domElement.addEventListener('pointercancel', () => { touchStart = null; });
window.addEventListener('blur',()=>{if(state==='playing')pause()});

function spawnWave(){
  const occupied=new Set();
  const primary=Math.floor(Math.random()*3);occupied.add(primary);
  const types=['block','hurdle','laser'];
  makeObstacle(types[Math.floor(Math.random()*3)],primary,-135);
  // At higher levels, two lanes can be blocked: the remaining lane is always safe.
  if(level>=3&&Math.random()<Math.min(.12+level*.045,.47)){
    const other=[0,1,2].filter(l=>l!==primary)[Math.floor(Math.random()*2)];
    occupied.add(other);makeObstacle(types[Math.floor(Math.random()*3)],other,-135);
  }
  const safe=[0,1,2].filter(l=>!occupied.has(l));
  const coinLane=safe[Math.floor(Math.random()*safe.length)];
  if(Math.random()<.94)for(let i=0;i<4;i++)makeCoin(coinLane,-145-i*3.4);
}
function damage(){
  if(invincible>0)return;
  lives--;invincible=1.65;shake=.5;dom.hit.style.opacity='.24';
  setTimeout(()=>dom.hit.style.opacity='0',130);
  burst(currentX,1.8,PLAYER_Z,THREE_COLOR.red,25);synth.hit();updateHud();
  if(lives<=0)gameOver();
}
function onCoin(o){
  coins++;score+=75;synth.coin();burst(o.g.position.x,o.g.position.y,o.g.position.z,THREE_COLOR.gold,9);
  scene.remove(o.g);o.checked=true;
}
function tickGame(dt){
  elapsed+=dt;meters+=speed*dt*.45;worldDistance+=speed*dt;
  score=Math.floor(meters*10)+coins*75;
  const newLevel=Math.min(20,1+Math.floor(meters/450));
  if(newLevel!==level){level=newLevel;toastTime=2.1;dom.levelToast.textContent='LEVEL '+String(level).padStart(2,'0')+' // SPEED UP';dom.levelToast.style.opacity='1';synth.levelUp()}
  speed=Math.min(65,26+level*2.5+elapsed*.033);
  spawnIn-=dt;
  if(spawnIn<=0){spawnWave();spawnIn=clamp(1.5-(level-1)*.065,.82,1.5)+Math.random()*.3}
  invincible=Math.max(0,invincible-dt);
  if(slideTime>0)slideTime=Math.max(0,slideTime-dt);
  if(jumpY>0||jumpVelocity>0){jumpVelocity-=27*dt;jumpY+=jumpVelocity*dt;if(jumpY<=0){jumpY=0;jumpVelocity=0}}
  currentX=THREE.MathUtils.damp(currentX,targetX,14,dt);
  runner.position.set(currentX,jumpY,PLAYER_Z);
  // Squashing mesh does not change logical player's ground position.
  body.scale.y=THREE.MathUtils.damp(body.scale.y,slideTime>0?.46:1,18,dt);
  body.position.y=slideTime>0?-.09:0;
  body.rotation.z=THREE.MathUtils.damp(body.rotation.z,(targetX-currentX)*-.055,12,dt);
  runner.visible=invincible<=0||Math.floor(elapsed*14)%2===0;
  const stride=Math.sin(elapsed*speed*.55);
  limbGroups[0].rotation.x=stride*.65;limbGroups[1].rotation.x=-stride*.6;
  limbGroups[2].rotation.x=-stride*.6;limbGroups[3].rotation.x=stride*.6;
  for(let i=0;i<trail.length;i++){
    const p=trail[i];p.position.set(currentX+Math.sin(elapsed*7+i)*.23,1.2+Math.sin(elapsed*4+i)*.2,-PLAYER_Z*.0+PLAYER_Z+i*.42);
    p.material.opacity=(1-i/trail.length)*.32;
  }
  for(const o of obstacles){
    o.z+=speed*dt;o.g.position.z=o.z;
    if(!o.checked&&Math.abs(o.z-PLAYER_Z)<1.05&&Math.abs(currentX-LANES[o.lane])<1.18){
      o.checked=true;
      if(o.type==='block'||(o.type==='hurdle'&&jumpY<1.14)||(o.type==='laser'&&slideTime<=0))damage();
    }
  }
  for(const c of pickups){
    c.z+=speed*dt;c.g.position.z=c.z;c.g.rotation.y+=dt*3.5;c.g.position.y=1.35+Math.sin(elapsed*5+c.z)*.1;
    if(!c.checked&&Math.abs(c.z-PLAYER_Z)<1.25&&Math.abs(currentX-LANES[c.lane])<1.15)onCoin(c);
  }
  for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].z>25){scene.remove(obstacles[i].g);obstacles.splice(i,1)}
  for(let i=pickups.length-1;i>=0;i--)if(pickups[i].z>25){scene.remove(pickups[i].g);pickups.splice(i,1)}
  for(const p of trackPieces){p.position.z+=speed*dt;if(p.position.z>21)p.position.z-=189}
  for(const b of buildings){b.position.z+=speed*dt*.8;if(b.position.z>40)configureBuilding(b,-180-rand(0,15))}
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)dom.levelToast.style.opacity='0'}
  if(shake>0)shake-=dt;
  updateHud();
}
function updateParticles(dt){
  for(let i=bursts.length-1;i>=0;i--){const p=bursts[i];p.life-=dt;
    p.mesh.position.addScaledVector(p.velocity,dt);p.velocity.y-=13*dt;
    p.mesh.material.opacity=Math.max(0,p.life/p.maxLife);
    if(p.life<=0){scene.remove(p.mesh);bursts.splice(i,1)}
  }
}
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.045);
  if(state==='playing')tickGame(dt);
  if(state!=='paused')updateParticles(dt);
  const idle=clock.elapsedTime;
  if(state!=='playing'){
    runner.position.set(0,0,PLAYER_Z);runner.visible=true;
    body.rotation.y=Math.sin(idle*.5)*.18;
  }else body.rotation.y=0;
  const camX=(state==='playing'?currentX*.35:Math.sin(idle*.22)*1.15)+(shake>0?rand(-shake,shake):0);
  camera.position.x=THREE.MathUtils.damp(camera.position.x,camX,3.2,dt);
  camera.position.y=THREE.MathUtils.damp(camera.position.y,state==='playing'&&jumpY>0?7.8:7.1,3,dt);
  camera.lookAt(currentX*.15,2.75,-20);
  sideLight.intensity=105+Math.sin(idle*3)*18;
  if(state==='playing')synth.update();
  renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(renderRatio());
});
