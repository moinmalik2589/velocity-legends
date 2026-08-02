import * as THREE from "three";

const PRESETS={
  sports:{length:3.25,width:1.46,body:.44,wheel:.34,cabin:.48,hood:.36,spoiler:false},
  supercar:{length:3.5,width:1.56,body:.38,wheel:.37,cabin:.38,hood:.29,spoiler:true},
  muscle:{length:3.8,width:1.6,body:.58,wheel:.39,cabin:.56,hood:.48,spoiler:true},
  compact:{length:2.75,width:1.3,body:.6,wheel:.31,cabin:.62,hood:.25,spoiler:false},
};

function roundedBox(width,height,depth,radius=.08){
 const shape=new THREE.Shape(),x=-width/2,z=-depth/2,r=Math.min(radius,width/4,depth/4);
 shape.moveTo(x+r,z);shape.lineTo(-x-r,z);shape.quadraticCurveTo(-x,z,-x,z+r);shape.lineTo(-x,-z-r);shape.quadraticCurveTo(-x,-z,-x-r,-z);shape.lineTo(x+r,-z);shape.quadraticCurveTo(x,-z,x,-z-r);shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);shape.closePath();
 return new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:r*.35,bevelSize:r*.35,bevelSegments:2});
}

function mesh(geometry,material,x,y,z){const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;return part}

export class ProceduralVehicleFactory {
 static create({preset="sports",color=0x43b8ff,name="Velocity vehicle"}={}){
  const spec=PRESETS[preset]||PRESETS.sports,g=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color,metalness:.82,roughness:.2}),trim=new THREE.MeshStandardMaterial({color:0x10151e,metalness:.7,roughness:.28}),glass=new THREE.MeshStandardMaterial({color:0x8ddfff,emissive:0x123a5c,emissiveIntensity:.45,metalness:.85,roughness:.09,transparent:true,opacity:.88}),rubber=new THREE.MeshStandardMaterial({color:0x07090d,roughness:.9}),rim=new THREE.MeshStandardMaterial({color:0xc8edff,metalness:1,roughness:.15}),headlight=new THREE.MeshStandardMaterial({color:0xd6f7ff,emissive:0x78daff,emissiveIntensity:1.8}),brake=new THREE.MeshStandardMaterial({color:0xff3049,emissive:0x6f0010,emissiveIntensity:.7}),wheels=[],brakes=[];
  const add=(geo,mat,x,y,z)=>{const p=mesh(geo,mat,x,y,z);g.add(p);return p},L=spec.length,W=spec.width;
  g.name=name;
  // Multi-part silhouette: undertray, sculpted body, hood, cabin, roof, bumpers and glazing.
  add(new THREE.BoxGeometry(L,.18,W*.88),trim,0,.36,0);
  add(roundedBox(L*.94,spec.body,W),paint,.02,.48,0).rotation.x=Math.PI/2;
  add(roundedBox(L*.38,spec.body*.46,W*.9),paint,L*.27,.77,0).rotation.x=Math.PI/2;
  const cabin=add(roundedBox(L*spec.cabin,spec.body*.78,W*.76),glass,-L*.13,.87,0);cabin.rotation.x=Math.PI/2;
  add(roundedBox(L*.35,.12,W*.7),paint,-L*.14,1.18,0).rotation.x=Math.PI/2;
  add(new THREE.BoxGeometry(.28,.18,W*.98),paint,L*.52,.48,0);add(new THREE.BoxGeometry(.36,.2,W*.98),paint,-L*.52,.5,0);
  // Window dividers and side windows make the cabin readable from the chase camera.
  for(const z of[-W*.395,W*.395]){add(new THREE.BoxGeometry(L*.34,.32,.025),glass,-L*.12,.93,z);add(new THREE.BoxGeometry(.035,.37,.04),trim,-L*.13,.96,z)}
  for(const z of[-W*.31,W*.31]){add(new THREE.BoxGeometry(.1,.12,.25),headlight,L*.52,.63,z);const tail=add(new THREE.BoxGeometry(.11,.12,.24),brake,-L*.52,.63,z);brakes.push(tail)}
  for(const z of[-W*.55,W*.55]){const mirror=add(new THREE.SphereGeometry(.095,10,8),trim,-L*.01,.9,z);mirror.scale.set(1,.65,.6)}
  for(const x of[-L*.3,L*.3])for(const z of[-W*.56,W*.56]){const pivot=new THREE.Group();pivot.position.set(x,.34,z);const wheel=mesh(new THREE.CylinderGeometry(spec.wheel,spec.wheel,.24,18),rubber,0,0,0);wheel.rotation.x=Math.PI/2;pivot.add(wheel);const hub=mesh(new THREE.CylinderGeometry(spec.wheel*.44,spec.wheel*.44,.255,12),rim,0,0,0);hub.rotation.x=Math.PI/2;pivot.add(hub);g.add(pivot);wheels.push({pivot,wheel,front:x>0})}
  for(const z of[-W*.29,W*.29]){const exhaust=add(new THREE.CylinderGeometry(.065,.065,.22,10),trim,-L*.56,.39,z);exhaust.rotation.x=Math.PI/2;const emitter=add(new THREE.ConeGeometry(.075,.25,8),new THREE.MeshBasicMaterial({color:0x4ebeff}),-L*.63,.4,z);emitter.rotation.z=-Math.PI/2;emitter.visible=false;g.userData.nitroEmitters??=[];g.userData.nitroEmitters.push(emitter)}
  if(spec.spoiler){add(new THREE.BoxGeometry(.16,.075,W*.72),paint,-L*.55,1.06,0);for(const z of[-W*.27,W*.27])add(new THREE.BoxGeometry(.055,.22,.055),trim,-L*.49,.94,z)}
  g.userData={...g.userData,preset,wheels,brakes,body:paint,velocity:0};return g;
 }
 static animate(vehicle,{speed=0,steer=0,accelerating=false,braking=false,nitro=false,delta=1/60}={}){
  vehicle.userData.wheels?.forEach(({pivot,wheel,front})=>{wheel.rotation.y-=speed*delta/.32;if(front)pivot.rotation.y=THREE.MathUtils.lerp(pivot.rotation.y,steer*.42,.2)});
  vehicle.rotation.z=THREE.MathUtils.lerp(vehicle.rotation.z,-steer*Math.min(Math.abs(speed)/35,.7)*.11,.12);vehicle.rotation.x=THREE.MathUtils.lerp(vehicle.rotation.x,braking?.07:accelerating?-.045:0,.12);vehicle.position.y=THREE.MathUtils.lerp(vehicle.position.y,.03+Math.abs(steer)*.015,.12);
  vehicle.userData.brakes?.forEach(light=>light.material.emissiveIntensity=braking?3:.7);vehicle.userData.nitroEmitters?.forEach(flame=>flame.visible=nitro&&speed>2);
 }
}
