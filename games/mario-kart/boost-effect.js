import {Mesh,BufferGeometry,Float32BufferAttribute,ShaderMaterial,AdditiveBlending,DoubleSide,Vector3,Quaternion} from 'three';

// Measured Standard Kart rear rim centers in assembled model coordinates.
// The fallback uses the authored exhaust-throat positions in model-spec.js.
const SOURCE=[.467,1.15,1.09],FALLBACK=[.62,.91,1.59];
function geometry(source){
 const positions=[],uv=[],kind=[],phase=[],center=source?SOURCE:FALLBACK;
 for(const side of [-1,1]){
  const q=new Quaternion().setFromUnitVectors(new Vector3(0,0,1),new Vector3(source?side*.105:0,source?.35:0,1).normalize());
  for(let plane=0;plane<3;plane++)for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
   const x=(u-.5)*.8,y=plane===2?(v-.5)*.8:0,z=plane===2?.015:v*1.5;
   const p=new Vector3(plane===1?0:x,plane===1?x:y,z).applyQuaternion(q);
   positions.push(p.x+side*center[0],p.y+center[1],p.z+center[2]);uv.push(u,v);kind.push(plane===2?1:0);phase.push(side*1.7);
  }
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setAttribute('flare',new Float32BufferAttribute(kind,1));g.setAttribute('phase',new Float32BufferAttribute(phase,1));return g;
}
export function makeBoostEffect(){
 const material=new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,
  uniforms:{time:{value:0},strength:{value:0}},
  vertexShader:`attribute float flare; attribute float phase; varying vec2 vUv; varying float vFlare; varying float vPhase;
   void main(){vUv=uv;vFlare=flare;vPhase=phase;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float time; uniform float strength; varying vec2 vUv; varying float vFlare; varying float vPhase;
   void main(){
    float pulse=.9+.1*sin(time*43.+vPhase);float density;
    if(vFlare>.5){vec2 p=(vUv-.5)*2.;density=exp(-dot(p,p)*7.)*.8;}
    else {float t=vUv.y;float bend=sin(t*15.-time*30.+vPhase)*.045*t;
     float width=(.14+.15*sin(t*3.14159))*(1.-t);
     float x=abs(vUv.x-.5+bend);density=exp(-pow(x/max(.005,width),2.)*2.)*pow(max(0.,1.-t),1.1)*pulse;}
    float alpha=density*strength;if(alpha<.008)discard;
    vec3 color=mix(vec3(1.,.16,.008),vec3(1.,.92,.55),smoothstep(.22,.75,density));
    gl_FragColor=vec4(color*2.2,alpha);
   }`});
 const mesh=new Mesh(geometry(false),material);mesh.name='boost-exhaust';mesh.visible=false;mesh.userData.source=false;return mesh;
}
export function updateBoostEffect(effect,model,boost,time){
 if(effect.userData.model!==model){
  let source=false;model.traverse(o=>{if(o.userData.openwiiSourcePack)source=true;});
  if(source!==effect.userData.source){effect.geometry.dispose();effect.geometry=geometry(source);effect.userData.source=source;}
  effect.userData.model=model;
 }
 effect.visible=boost>0;
 effect.position.copy(model.position);effect.quaternion.copy(model.quaternion);effect.scale.copy(model.scale);
 effect.material.uniforms.time.value=time;
 effect.material.uniforms.strength.value=Math.min(1,Math.max(0,boost)/.12);
}
