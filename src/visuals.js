import * as THREE from 'three';

const clamp=THREE.MathUtils.clamp;

function seeded(seed=1){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}

export function makeNoiseTexture({size=512,base='#25292d',speck='#555b60',lines=false,seed=1}={}){
  const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),r=seeded(seed);
  x.fillStyle=base;x.fillRect(0,0,size,size);
  for(let i=0;i<size*5;i++){const g=Math.floor(35+r()*55),a=.08+r()*.23,s=.5+r()*2.2;x.fillStyle=`rgba(${g},${g},${g},${a})`;x.fillRect(r()*size,r()*size,s,s)}
  if(lines){x.lineCap='round';for(let i=0;i<28;i++){x.strokeStyle=`rgba(8,9,10,${.05+r()*.13})`;x.lineWidth=.5+r()*2;x.beginPath();let px=r()*size,py=r()*size;x.moveTo(px,py);for(let j=0;j<5;j++){px+=(r()-.5)*70;py+=(r()-.5)*70;x.lineTo(px,py)}x.stroke()}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,2);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}

function windowTexture(night=true){const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d'),r=seeded(night?37:13);x.fillStyle=night?'#0c1320':'#66727c';x.fillRect(0,0,c.width,c.height);for(let y=12;y<500;y+=28)for(let xx=10;xx<248;xx+=24){const lit=r()>(night?.35:.88);x.fillStyle=lit?(night?(r()>.35?'#ffd88a':'#76d9ff'):'#a9c8d7'):(night?'#101927':'#55636d');x.fillRect(xx,y,14,16)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}

export function createVisualMaterials(track){
  const wet=['rain','night'].includes(track.weather),snow=track.weather==='snow';
  const asphalt=makeNoiseTexture({base:wet?'#171c21':'#262a2d',speck:'#656a6e',lines:true,seed:9});
  const ground=makeNoiseTexture({base:snow?'#9eacb2':track.weather==='rain'?'#24372f':track.weather==='dust'?'#9b6038':'#45683d',speck:snow?'#cad4d8':track.weather==='rain'?'#3f554b':'#66706a',seed:23});ground.repeat.set(22,22);
  return {
    road:new THREE.MeshPhysicalMaterial({map:asphalt,color:snow?0xb7c3c8:track.weather==='rain'?0x7b8792:0xffffff,roughness:wet?.24:snow?.68:.8,metalness:wet?.08:0,clearcoat:wet?.8:snow?.16:.08,clearcoatRoughness:wet?.18:.7}),
    shoulder:new THREE.MeshStandardMaterial({color:snow?0x697a82:track.weather==='dust'?0x7e5235:0x55595b,roughness:.95}),
    ground:new THREE.MeshStandardMaterial({map:ground,color:0xffffff,roughness:1}),
    glass:new THREE.MeshPhysicalMaterial({color:0x18364b,metalness:.05,roughness:.06,transmission:.22,transparent:true,opacity:.82,clearcoat:1}),
    chrome:new THREE.MeshStandardMaterial({color:0xb9c4cd,metalness:.95,roughness:.16}),
    rubber:new THREE.MeshStandardMaterial({color:0x090a0b,roughness:.96}),
    dark:new THREE.MeshPhysicalMaterial({color:0x101317,metalness:.7,roughness:.24,clearcoat:.5}),
    white:new THREE.MeshStandardMaterial({color:0xf5f5f2,roughness:.5}),
    red:new THREE.MeshStandardMaterial({color:0xd9263f,roughness:.52}),
    rail:new THREE.MeshStandardMaterial({color:0x9da8b1,metalness:.9,roughness:.26}),
    gravel:new THREE.MeshStandardMaterial({color:track.weather==='dust'?0x8c5a37:0x6a675f,roughness:1}),
    windowTex:windowTexture(track.weather==='night'),
  };
}

function loftGeometry(sections){
  const pos=[],idx=[];for(const s of sections){const {z,w,b,t}=s;pos.push(-w,b,z,-w,t,z,w,t,z,w,b,z)}
  for(let i=0;i<sections.length-1;i++){const a=i*4,b=a+4;idx.push(a,a+1,b,a+1,b+1,b, a+1,a+2,b+1,a+2,b+2,b+1, a+2,a+3,b+2,a+3,b+3,b+2, a+3,a,b+3,a,b,b+3)}
  idx.push(0,3,2,0,2,1);const k=(sections.length-1)*4;idx.push(k,k+1,k+2,k,k+2,k+3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
}

function addMesh(parent,geo,mat,pos=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}

export function createDetailedCar(def,{ai=false,world=null}={}){
  const g=new THREE.Group();
  const style=def.style||'gt';
  const P={
    gt:{len:1.00,width:1.00,roof:.96,nose:.98,rear:1.00,ride:1.00,wing:.65,wheel:1.00},
    coupe:{len:.96,width:.96,roof:1.03,nose:1.02,rear:.96,ride:1.02,wing:.35,wheel:.96},
    muscle:{len:1.06,width:1.04,roof:1.05,nose:1.14,rear:1.07,ride:1.05,wing:.18,wheel:1.03},
    roadster:{len:.94,width:.98,roof:.76,nose:1.05,rear:.92,ride:.98,wing:.12,wheel:1.00},
    supercar:{len:1.02,width:1.06,roof:.86,nose:1.16,rear:1.02,ride:.90,wing:.50,wheel:1.05},
    track:{len:1.03,width:1.08,roof:.84,nose:1.15,rear:1.05,ride:.88,wing:1.05,wheel:1.06},
    luxury:{len:1.10,width:1.02,roof:1.07,nose:1.00,rear:1.04,ride:1.04,wing:.12,wheel:1.02},
    ev:{len:1.02,width:1.04,roof:.95,nose:.90,rear:1.00,ride:.94,wing:.20,wheel:1.06},
    hyper:{len:1.04,width:1.10,roof:.78,nose:1.20,rear:1.08,ride:.84,wing:.72,wheel:1.08},
    prototype:{len:1.08,width:1.12,roof:.72,nose:1.26,rear:1.13,ride:.80,wing:1.18,wheel:1.10},
    legend:{len:1.08,width:1.12,roof:.74,nose:1.28,rear:1.12,ride:.80,wing:1.28,wheel:1.11}
  }[style]||{};
  const bodyMat=new THREE.MeshPhysicalMaterial({color:def.color,metalness:.72,roughness:.17,clearcoat:1,clearcoatRoughness:.08,sheen:.24,sheenColor:new THREE.Color(def.color).multiplyScalar(.45)});bodyMat.userData.bodyPaint=true;
  const carbon=new THREE.MeshPhysicalMaterial({color:0x080b0f,metalness:.58,roughness:.2,clearcoat:.8});
  const glass=new THREE.MeshPhysicalMaterial({color:0x122d41,metalness:.04,roughness:.035,transmission:.2,transparent:true,opacity:.82,clearcoat:1});
  const rubber=new THREE.MeshStandardMaterial({color:0x070809,roughness:.98});
  const rimMat=new THREE.MeshStandardMaterial({color:style==='ev'?0x252b31:0xaeb7bf,metalness:1,roughness:.16});
  const brakeMat=new THREE.MeshStandardMaterial({color:ai?0xffb12f:0xff3c31,metalness:.35,roughness:.35});
  const headMat=new THREE.MeshStandardMaterial({color:0xeefaff,emissive:0xc8edff,emissiveIntensity:3.8,roughness:.1});
  const tailMat=new THREE.MeshStandardMaterial({color:0x680008,emissive:0xff102e,emissiveIntensity:2.8,roughness:.22});
  const L=P.len,W=P.width,R=P.ride;
  const bodySections=[
    {z:3.3*L,w:1.08*W,b:.44*R,t:.72*R},
    {z:2.7*L,w:(style==='muscle'?1.72:1.58)*W,b:.37*R,t:(style==='muscle'?1.12:1.00)*R},
    {z:1.55*L,w:1.78*W,b:.34*R,t:(style==='luxury'?1.32:1.16)*R},
    {z:.35*L,w:1.84*W,b:.33*R,t:1.34*R},
    {z:-1.2*L,w:1.75*W,b:.34*R,t:(style==='muscle'?1.30:1.20)*R},
    {z:-2.5*L,w:1.64*W,b:.38*R,t:.95*R},
    {z:-3.18*L,w:1.28*W,b:.42*R,t:.80*R}
  ];
  addMesh(g,loftGeometry(bodySections),bodyMat);
  // layered coachwork gives the silhouette the depth of a real sports car rather than a single faceted shell
  addMesh(g,new THREE.BoxGeometry(2.75*W,.12,1.72*L),bodyMat,[0,1.05*R,1.72*L],[-.055,0,0]);
  addMesh(g,new THREE.BoxGeometry(3.28*W,.18,.42),carbon,[0,.54*R,3.08*L]);
  addMesh(g,new THREE.BoxGeometry(3.18*W,.14,.55),carbon,[0,.48*R,-3.04*L]);
  for(const x of[-1.67,1.67]) addMesh(g,new THREE.BoxGeometry(.18,.24,3.55*L),carbon,[x*W,.49*R,-.08]);
  // bonnet creases / intakes / grille
  for(const x of[-.58,.58]) addMesh(g,new THREE.BoxGeometry(.055,.035,1.55*L),carbon,[x*W,1.16*R,1.78*L],[-.04,0,0]);
  if(['supercar','track','hyper','prototype','legend'].includes(style)){
    addMesh(g,new THREE.BoxGeometry(1.15*W,.055,.62*L),carbon,[0,1.18*R,1.65*L],[-.06,0,0]);
    for(const x of[-1.23,1.23]) addMesh(g,new THREE.BoxGeometry(.38,.08,.82*L),carbon,[x*W,.62*R,2.38*L],[0,x<0?-.10:.10,0]);
  }
  const roofH=P.roof;
  if(style!=='roadster'){
    addMesh(g,loftGeometry([
      {z:1.05*L,w:1.30*W,b:1.14*R,t:1.43*roofH},
      {z:.48*L,w:1.24*W,b:1.16*R,t:1.92*roofH},
      {z:-.72*L,w:1.18*W,b:1.16*R,t:1.96*roofH},
      {z:-1.42*L,w:1.28*W,b:1.14*R,t:1.50*roofH}
    ]),glass);
  }else{
    addMesh(g,new THREE.BoxGeometry(2.65*W,.09,1.55*L),glass,[0,1.20,.20]);
    addMesh(g,new THREE.BoxGeometry(2.9*W,.13,.18),carbon,[0,1.35,-.55]);
  }
  // style-specific aero/body identity
  addMesh(g,new THREE.BoxGeometry(3.38*W,.12,.42*P.rear),carbon,[0,.51*R,-3.04*L]);
  if(P.wing>.2){
    const wing=addMesh(g,new THREE.BoxGeometry((2.2+P.wing)*W,.10,.42+.10*P.wing),carbon,[0,1.28+.34*P.wing,-2.78*L]);
    addMesh(g,new THREE.BoxGeometry(.11,.38+.20*P.wing,.13),carbon,[-1.05*W,1.14+.18*P.wing,-2.65*L]);
    addMesh(g,new THREE.BoxGeometry(.11,.38+.20*P.wing,.13),carbon,[1.05*W,1.14+.18*P.wing,-2.65*L]);
    g.userData.wing=wing;
  }
  if(['supercar','track','hyper','prototype','legend'].includes(style)){
    addMesh(g,new THREE.BoxGeometry(3.25*W,.08,.62),carbon,[0,.43*R,3.05*L]);
    for(const x of[-1.35,1.35])addMesh(g,new THREE.BoxGeometry(.34,.09,1.15),carbon,[x*W,.48*R,2.75*L],[0,x<0?-.18:.18,0]);
  }
  if(style==='muscle'){
    addMesh(g,new THREE.BoxGeometry(2.55*W,.16,1.55),bodyMat,[0,1.16,1.55*L]);
    addMesh(g,new THREE.BoxGeometry(.62,.12,.82),carbon,[0,1.31,1.70*L]);
  }
  if(style==='ev'){
    addMesh(g,new THREE.BoxGeometry(3.0*W,.07,.18),headMat,[0,.84,3.12*L]);
    addMesh(g,new THREE.BoxGeometry(3.0*W,.06,.16),tailMat,[0,.80,-3.08*L]);
  }else{
    for(const x of[-1.05,1.05]){addMesh(g,new THREE.BoxGeometry(style==='prototype'?.48:.72,.16,.13),headMat,[x*W,.92*R,3.12*L],[.03,x<0?-.08:.08,0]);addMesh(g,new THREE.BoxGeometry(.72,.13,.11),tailMat,[x*W,.87*R,-3.08*L]);}
  }
  for(const x of[-1.62,1.62])if(!['prototype','legend'].includes(style))addMesh(g,new THREE.BoxGeometry(.26,.18,.48),bodyMat,[x*W,1.25*R,.18],[0,0,x<0?-.15:.15]);
  const wheels=[];const wheelRadius=.59*P.wheel,wheelZ=2.03*L,wheelX=1.70*W;
  for(const x of[-wheelX,wheelX])for(const z of[-wheelZ,wheelZ]){
    const hub=new THREE.Group();hub.position.set(x,.55*R,z);hub.userData.front=z>0;hub.userData.baseY=.55*R;g.add(hub);
    addMesh(hub,new THREE.CylinderGeometry(wheelRadius,wheelRadius,.46,30,1),rubber,[0,0,0],[0,0,Math.PI/2]);
    addMesh(hub,new THREE.CylinderGeometry(wheelRadius*.64,wheelRadius*.64,.48,style==='luxury'?18:12,1),rimMat,[0,0,0],[0,0,Math.PI/2]);
    addMesh(hub,new THREE.CylinderGeometry(wheelRadius*.40,wheelRadius*.40,.49,20),brakeMat,[0,0,0],[0,0,Math.PI/2]);
    const spokes=style==='ev'?5:style==='luxury'?10:6;for(let s=0;s<spokes;s++)addMesh(hub,new THREE.BoxGeometry(.035,.55*P.wheel,.07),rimMat,[x<0?-.24:.24,0,0],[s*Math.PI/spokes,0,Math.PI/2]);
    wheels.push(hub);
  }
  const flames=[];const flameMat=new THREE.MeshBasicMaterial({color:style==='ev'?0x9cf8ff:0x5de8ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending});
  const exhaustXs=style==='prototype'?[-.72,0,.72]:[-.52,.52];for(const x of exhaustXs){if(style!=='ev')addMesh(g,new THREE.CylinderGeometry(.11,.14,.34,16),carbon,[x,.55*R,-3.22*L],[Math.PI/2,0,0]);const fl=addMesh(g,new THREE.ConeGeometry(.16,1.45,12),flameMat,[x,.55*R,-3.95*L],[Math.PI/2,0,0]);fl.visible=false;flames.push(fl)}
  const glow=new THREE.PointLight(def.color,0,4,2);glow.position.set(0,.35,-2.5*L);g.add(glow);
  g.userData={...g.userData,wheels,flames,boostGlow:glow,ai,style,baseY:.1,wheelRadius,wheelHubY:.55*R,groundOffset:wheelRadius-.55*R};g.scale.setScalar(ai?.94:1);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});world?.add(g);return g;
}

function addTree(group,x,z,scale=1,type='pine',snow=false){
  const tg=new THREE.Group();tg.position.set(x,0,z);tg.userData.wind=true;tg.userData.phase=Math.random()*Math.PI*2;tg.userData.baseRotZ=(Math.random()-.5)*.018;group.add(tg);
  const trunkMat=new THREE.MeshStandardMaterial({color:0x5c3f28,roughness:1});const leafMat=new THREE.MeshStandardMaterial({color:type==='palm'?0x2d6b3c:snow?0x315746:0x255734,roughness:.9});const tr=addMesh(tg,new THREE.CylinderGeometry(.18*scale,.28*scale,2.6*scale,8),trunkMat,[0,1.3*scale,0]);
  if(type==='palm'){tr.rotation.z=(Math.random()-.5)*.08;for(let i=0;i<7;i++){const leaf=addMesh(tg,new THREE.ConeGeometry(.22*scale,3.4*scale,4),leafMat,[0,2.75*scale,0],[Math.PI/2,(i/7)*Math.PI*2,0]);leaf.scale.x=.28}}
  else{for(let i=0;i<3;i++){addMesh(tg,new THREE.ConeGeometry((1.5-i*.28)*scale,(2.5-i*.35)*scale,9),leafMat,[0,(2.3+i*.85)*scale,0]);if(snow)addMesh(tg,new THREE.ConeGeometry((1.53-i*.28)*scale,.14*scale,9),new THREE.MeshStandardMaterial({color:0xc9d5da,roughness:1}),[0,(3.48+i*.68)*scale,0])}}
  return tg;
}
function addRock(group,x,z,scale=1,color=0x76523b){const r=addMesh(group,new THREE.DodecahedronGeometry(scale,1),new THREE.MeshStandardMaterial({color,roughness:1}),[x,scale*.65,z],[Math.random(),Math.random(),Math.random()]);r.scale.y=.7+Math.random()*.8;return r}

function addLamp(group,x,z,yaw,night=false){const metal=new THREE.MeshStandardMaterial({color:0x4b525a,metalness:.8,roughness:.25});const pole=addMesh(group,new THREE.CylinderGeometry(.09,.13,6.5,10),metal,[x,3.25,z]);const arm=addMesh(group,new THREE.BoxGeometry(1.4,.08,.08),metal,[x+Math.cos(yaw)*.65,6.3,z+Math.sin(yaw)*.65],[0,-yaw,0]);const bulb=addMesh(group,new THREE.SphereGeometry(.17,10,8),new THREE.MeshStandardMaterial({color:0xfff2cb,emissive:0xffd890,emissiveIntensity:night?5:1}),[x+Math.cos(yaw)*1.25,6.18,z+Math.sin(yaw)*1.25]);if(night){const l=new THREE.PointLight(0xffcf8a,22,24,2);l.position.copy(bulb.position);group.add(l)}}

function addBuilding(group,x,z,h,w,d,night,windowTex){const mat=new THREE.MeshStandardMaterial({map:windowTex,color:night?0x748091:0xffffff,roughness:.62,emissive:night?0x0f1620:0x000000,emissiveIntensity:night?.32:0});const b=addMesh(group,new THREE.BoxGeometry(w,h,d),mat,[x,h/2,z]);b.userData.cityLight=night;b.userData.baseEmissive=night?.28:0;b.userData.phase=Math.random()*7;addMesh(group,new THREE.BoxGeometry(w*1.04,.28,d*1.04),new THREE.MeshStandardMaterial({color:0x2d3338,roughness:.85}),[x,h+.14,z]);return b}

function billboardTexture(text='#VELOCITY',accent='#5ce9ff'){
  const c=document.createElement('canvas');c.width=512;c.height=160;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,512,160);g.addColorStop(0,'#050914');g.addColorStop(.55,'#101934');g.addColorStop(1,'#050914');x.fillStyle=g;x.fillRect(0,0,512,160);
  x.strokeStyle=accent;x.lineWidth=5;x.strokeRect(5,5,502,150);x.fillStyle='#fff';x.font='900 54px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,78);x.fillStyle=accent;x.font='800 18px system-ui';x.fillText('VELOCITY LEGENDS WORLD TOUR',256,126);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function addRaceGate(group,p,f,s,roadHalf,text,accent){
  const yaw=Math.atan2(f.x,f.z),metal=new THREE.MeshStandardMaterial({color:0x111721,metalness:.82,roughness:.24});
  for(const sign of[-1,1]){const q=p.clone().addScaledVector(s,(roadHalf+1.8)*sign);addMesh(group,new THREE.BoxGeometry(.45,7,.45),metal,[q.x,3.5,q.z],[0,yaw,0])}
  const boardMat=new THREE.MeshBasicMaterial({map:billboardTexture(text,accent),toneMapped:false});const board=addMesh(group,new THREE.BoxGeometry(roadHalf*2+4.2,2.15,.24),boardMat,[p.x,6.1,p.z],[0,yaw,0]);
  const glow=new THREE.PointLight(new THREE.Color(accent),9,34,2);glow.position.set(p.x,5.4,p.z);group.add(glow);return board;
}

export function decorateEnvironment({world,track,pointAt,sideAt,tangentAt,roadHalf,materials,quality='high'}){
  const group=new THREE.Group();group.name='realisticEnvironment';world.add(group);const count=quality==='low'?38:quality==='medium'?68:104;const r=seeded(Object.keys(track).join('').length*99+track.name.length);
  const roadProbe=[];for(let i=0;i<260;i++)roadProbe.push(pointAt(i/260));
  const roadClear=(q,clearance=roadHalf+12)=>{const lim=clearance*clearance;for(const rp of roadProbe){const dx=q.x-rp.x,dz=q.z-rp.z;if(dx*dx+dz*dz<lim)return false}return true};
  const candidate=(t,dist,sign)=>pointAt(t).clone().addScaledVector(sideAt(t),dist*sign);
  if(track.name==='Azure Coast'){
    const water=new THREE.Mesh(new THREE.PlaneGeometry(track.practice?5200:1800,track.practice?5200:1800),new THREE.MeshPhysicalMaterial({color:0x167fa7,roughness:.18,metalness:.05,clearcoat:1,transparent:true,opacity:.9}));water.rotation.x=-Math.PI/2;water.position.y=-.22;water.userData.water=true;water.userData.baseY=-.22;group.add(water);
    for(let i=0;i<count;i++){const t=i/count,sign=i%2?1:-1,q=candidate(t,roadHalf+16+r()*66,sign);if(!roadClear(q,roadHalf+12))continue;if(i%3)addTree(group,q.x,q.z,.8+r()*.8,'palm');else addRock(group,q.x,q.z,1+r()*2,0x877d6e)}
  }else if(track.name==='Steel Harbor'){
    const cols=[0xbd3b35,0x1f6d8d,0xc9902c,0x4c6a55];for(let i=0;i<count;i++){const t=i/count,sign=i%2?1:-1,q=candidate(t,roadHalf+20+r()*70,sign);if(!roadClear(q,roadHalf+14))continue;if(i%3){const h=2.6,w=6,d=2.6;for(let j=0;j<1+(i%3);j++)addMesh(group,new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:cols[i%cols.length],metalness:.12,roughness:.7}),[q.x,h/2+j*h,q.z]);}else addLamp(group,q.x,q.z,Math.atan2(sideAt(t).z,sideAt(t).x),false)}
  }else if(track.name==='Red Canyon'){
    for(let i=0;i<count*2;i++){const t=(i/(count*2)+r()*.015)%1,sign=i%2?1:-1,q=candidate(t,roadHalf+18+r()*100,sign);if(!roadClear(q,roadHalf+16))continue;addRock(group,q.x,q.z,1.5+r()*5,0x8d5033);if(i%9===0){const cactusMat=new THREE.MeshStandardMaterial({color:0x3f7045,roughness:.9});addMesh(group,new THREE.CylinderGeometry(.25,.32,3.5,8),cactusMat,[q.x,1.75,q.z]);addMesh(group,new THREE.CylinderGeometry(.13,.16,1.5,8),cactusMat,[q.x+.45,2.1,q.z],[0,0,.7])}}
  }else if(track.name==='Neon City'){
    for(let i=0;i<count;i++){const t=i/count,sign=i%2?1:-1,q=candidate(t,roadHalf+26+r()*78,sign);if(!roadClear(q,roadHalf+22))continue;const h=18+r()*60;addBuilding(group,q.x,q.z,h,8+r()*15,8+r()*15,true,materials.windowTex);if(i%3===0){const p=pointAt(t),ss=sideAt(t);addLamp(group,p.x+ss.x*(roadHalf+5)*sign,p.z+ss.z*(roadHalf+5)*sign,Math.atan2(ss.z,ss.x),true)}}
  }else if(track.name==='Alpine Rush'){
    for(let i=0;i<count*2;i++){const t=(i/(count*2)+r()*.01)%1,sign=i%2?1:-1,q=candidate(t,roadHalf+18+r()*98,sign);if(!roadClear(q,roadHalf+18))continue;if(i%3)addTree(group,q.x,q.z,.8+r()*1.25,'pine',true);else {const m=addRock(group,q.x,q.z,2+r()*7,0x66747b);m.position.y-=.4}}
    let made=0,tries=0;while(made<18&&tries++<160){const ang=r()*Math.PI*2,dist=520+r()*350,h=45+r()*100,q=new THREE.Vector3(Math.cos(ang)*dist,0,Math.sin(ang)*dist);if(!roadClear(q,120))continue;addMesh(group,new THREE.ConeGeometry(35+r()*38,h,7),new THREE.MeshStandardMaterial({color:0x6c7e87,roughness:1}),[q.x,h/2-1,q.z]);addMesh(group,new THREE.ConeGeometry(13+r()*12,h*.28,7),new THREE.MeshStandardMaterial({color:0xc7d5dc,roughness:1}),[q.x,h*.86,q.z]);made++}
  }else{
    for(let i=0;i<count*2;i++){const t=(i/(count*2)+r()*.01)%1,sign=i%2?1:-1,q=candidate(t,roadHalf+18+r()*(track.practice?120:84),sign);if(!roadClear(q,roadHalf+15))continue;if(i%4)addTree(group,q.x,q.z,.8+r()*1.1,'pine');else addRock(group,q.x,q.z,1+r()*3,0x53605b);if(i%12===0){const p=pointAt(t),ss=sideAt(t);addLamp(group,p.x+ss.x*(roadHalf+5)*sign,p.z+ss.z*(roadHalf+5)*sign,Math.atan2(ss.z,ss.x),false)}}
    if(track.practice){for(let i=0;i<18;i++){const t=(i+.4)/18,p=pointAt(t),ss=sideAt(t),sign=i%2?1:-1,q=p.clone().addScaledVector(ss,(roadHalf+55+r()*80)*sign);if(!roadClear(q,roadHalf+28))continue;addBuilding(group,q.x,q.z,5+r()*5,8+r()*7,7+r()*7,false,materials.windowTex)}}
  }
  const labels=['VELOCITY','NITRO ZONE','LEGENDS','APEX RACING'];const accent='#'+track.accent.toString(16).padStart(6,'0');[0.08,0.24,0.51,0.76].forEach((t,i)=>{const p=pointAt(t),f=tangentAt(t),ss=sideAt(t);addRaceGate(group,p,f,ss,roadHalf,labels[i],accent)});
  if(!track.practice)for(const t of [0.16,0.60]){const p=pointAt(t),f=tangentAt(t),ss=sideAt(t),yaw=Math.atan2(f.x,f.z);for(const sign of[-1,1]){const q=p.clone().addScaledVector(ss,(roadHalf+16)*sign);addMesh(group,new THREE.BoxGeometry(24,4.2,9),new THREE.MeshStandardMaterial({color:0x394352,metalness:.35,roughness:.55}),[q.x,2.1,q.z],[0,yaw,0]);for(let rr=0;rr<4;rr++)for(let c=0;c<10;c++)addMesh(group,new THREE.BoxGeometry(.55,.45,.55),new THREE.MeshStandardMaterial({color:[0x3fc8ff,0xff4b70,0xffc44d,0x8e67ff][(rr+c)%4],roughness:.7}),[q.x+ss.x*sign*(rr*.85-1.3)+f.x*(c-4.5)*1.45,3.0+rr*.45,q.z+ss.z*sign*(rr*.85-1.3)+f.z*(c-4.5)*1.45])}}
  return group;
}

export function updateEnvironmentVisuals(world,dt,now){
  const env=world?.getObjectByName?.('realisticEnvironment');if(!env)return;const t=now*.001;
  env.traverse(o=>{if(o.userData?.wind){const a=.012+Math.min(.018,o.scale?.y||1)*.005;o.rotation.z=o.userData.baseRotZ+Math.sin(t*1.35+o.userData.phase)*a;o.rotation.x=Math.sin(t*.85+o.userData.phase*.7)*a*.35}if(o.userData?.water){o.position.y=o.userData.baseY+Math.sin(t*.8)*.025;o.material.roughness=.15+Math.sin(t*.55)*.025}if(o.userData?.cityLight&&o.material){o.material.emissiveIntensity=o.userData.baseEmissive+Math.max(0,Math.sin(t*1.8+o.userData.phase))*.22}})
}

export function updateDetailedCarVisual(car,speed,boost,drifting,dt,steer=0){if(!car?.userData)return;for(const w of car.userData.wheels||[]){w.rotation.x+=speed*dt*.82;if(w.userData.front)w.rotation.y=THREE.MathUtils.lerp(w.rotation.y,-steer*.28,1-Math.pow(.008,dt));}for(const f of car.userData.flames||[]){f.visible=!!boost;if(f.visible){const k=.8+Math.random()*.5;f.scale.set(k,k*(boost?1.4:1),k)}}if(car.userData.boostGlow)car.userData.boostGlow.intensity=boost?18:0;}
