import * as THREE from 'three';

export class RaceVFX {
  constructor(scene){
    this.scene=scene; this.particles=[]; this.trails=[]; this.tmp=new THREE.Vector3();
    this.sparkMat=new THREE.MeshBasicMaterial({color:0xffc35b,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
    this.smokeMat=new THREE.MeshBasicMaterial({color:0xb8c1cc,transparent:true,opacity:.32,depthWrite:false});
    this.nitroMat=new THREE.MeshBasicMaterial({color:0x6ff7ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  }
  clear(){for(const p of [...this.particles,...this.trails]){this.scene.remove(p.mesh);p.mesh.geometry?.dispose?.()}this.particles.length=0;this.trails.length=0;}
  burst(pos,type='spark',count=12,dir=null){
    const mat=type==='smoke'?this.smokeMat:type==='nitro'?this.nitroMat:this.sparkMat;
    for(let i=0;i<count;i++){
      const geo=type==='smoke'?new THREE.SphereGeometry(.12+Math.random()*.22,6,5):new THREE.BoxGeometry(.035,.035,.25+Math.random()*.32);
      const mesh=new THREE.Mesh(geo,mat.clone());mesh.position.copy(pos);mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
      const base=dir?dir.clone():new THREE.Vector3((Math.random()-.5),Math.random()*.8,(Math.random()-.5));
      base.multiplyScalar(type==='smoke'?1.5+Math.random()*2:4+Math.random()*7);base.x+=(Math.random()-.5)*3;base.z+=(Math.random()-.5)*3;
      this.scene.add(mesh);this.particles.push({mesh,v:base,life:type==='smoke'?.7+Math.random()*.7:.25+Math.random()*.35,max:type==='smoke'?1.4:.6,type});
    }
  }
  trail(pos,color=0x67e8ff,scale=1){
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.16*scale,7,5),mat);mesh.position.copy(pos);this.scene.add(mesh);this.trails.push({mesh,life:.22,max:.22});
  }
  update(dt){
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry?.dispose?.();this.particles.splice(i,1);continue}p.v.y-=p.type==='smoke'?.2:10*dt;p.mesh.position.addScaledVector(p.v,dt);if(p.type==='smoke')p.mesh.scale.multiplyScalar(1+dt*2);p.mesh.material.opacity=Math.max(0,p.life/p.max)*(p.type==='smoke'?.28:1)}
    for(let i=this.trails.length-1;i>=0;i--){const p=this.trails[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry?.dispose?.();this.trails.splice(i,1);continue}p.mesh.scale.multiplyScalar(1+dt*4);p.mesh.material.opacity=(p.life/p.max)*.62}
  }
}
