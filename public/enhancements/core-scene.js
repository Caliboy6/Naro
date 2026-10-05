/* NARO's optical coordination core. Procedural geometry; no dependencies or data claims. */
import { vetaLogo } from './brand-system.js';
const VERTEX = `
precision highp float;
attribute vec4 aData;
attribute vec2 aNext;
attribute vec2 aEdge;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime,uScroll,uGlow,uVariant;
varying float vEdge,vLight,vDepth,vType;
varying vec3 vColor;
const float PI=3.14159265359;
mat3 rx(float a){float s=sin(a),c=cos(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 ry(float a){float s=sin(a),c=cos(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rz(float a){float s=sin(a),c=cos(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
vec3 shape(vec2 uv,float type,float phase){
 float t=uTime;
 if(type<.5){
  float u=uv.x+t*.055;
  float v=uv.y+t*.115+sin(u*3.+phase)*.19;
  float radius=1.015+.277*cos(v);
  return vec3(radius*cos(u),radius*sin(u),.277*sin(v));
 }
 if(type<1.5){
  float u=uv.x+t*.025+sin(uv.y*2.+phase)*.035;
  float v=uv.y+t*.14;
  float radius=1.015+.283*cos(v);
  return vec3(radius*cos(u),radius*sin(u),.283*sin(v));
 }
 if(type<2.5){
  float u=uv.x+t*.035;
  vec3 p=vec3((1.51+phase*.055)*cos(u),(1.51+phase*.055)*sin(u),0.);
  return rx(.12+phase*.08)*ry(-.27+phase*.035)*p;
 }
 if(type<3.5){
  float u=uv.x+t*(.21+phase*.023);
  float r=.19+phase*.014;
  return rx(phase*1.47+t*.05)*ry(phase*.66)*vec3(r*cos(u),r*sin(u),0.);
 }
 if(type<4.5){
  float u=uv.x;
  float v=phase*6.283;
  float pulse=sin(u*4.-t*.5+v)*.06;
  float spread=(.13+.38*u)*sin(v);
  return vec3(.3+u*2.1,spread+.15*sin(u*2.8+v)+pulse,.24*cos(v)*(1.-u)-.24*u);
 }
 float u=uv.x+t*.027;
 return vec3(.55*cos(u),.55*sin(u),.035*sin(u*5.+phase));
}
vec3 world(vec2 uv,float type,float phase){
 vec3 p=shape(uv,type,phase);
 float drift=sin(uTime*.085)*.018;
 p=rz(-.29+drift)*ry(.27+uPointer.x*.09+uScroll*.075)*rx(.69+uPointer.y*.07+uScroll*.09)*p;
 p.y+=.025;
 return p;
}
vec4 camera(vec3 p){
 float distance=4.8-p.z;
 float f=2.55;
 float aspect=uResolution.x/uResolution.y;
 return vec4(p.x*f/aspect,p.y*f,(distance-2.)*.2,distance);
}
void main(){
 vec3 p=world(aData.xy,aData.z,aData.w);
 vec3 q=world(aNext,aData.z,aData.w);
 vec4 cp=camera(p),cq=camera(q);
 vec2 direction=(cq.xy/cq.w-cp.xy/cp.w)*uResolution;
 vec2 normal=normalize(vec2(-direction.y,direction.x)+vec2(.00001));
 float front=smoothstep(-.55,.55,p.z);
 float width=mix(.7,1.35,front);
 if(aData.z>1.5&&aData.z<2.5)width*=.8;
 if(uGlow>.5)width*=5.8;
 cp.xy+=normal*aEdge.x*width/uResolution*cp.w*2.;
 gl_Position=cp;
 vEdge=aEdge.x;
 float coordinate=aData.z<1.5?aData.x*1.8+aData.y*.14:aData.x*2.;
 float travel=pow(max(0.,cos(coordinate-uTime*(aData.z<1.5?.65:1.2)+aData.w*4.)),18.);
 vLight=.35+travel*1.8+front*.19;
 if(aData.z>2.5&&aData.z<3.5)vLight*=1.7;
 if(aData.z>3.5&&aData.z<4.5)vLight*=smoothstep(0.,.12,aData.x)*(1.-aData.x*.6);
 vDepth=.4+front*.6;
 vType=aData.z;
 vColor=mix(vec3(.07,.57,.38),vec3(.52,.95,.76),front);
 vColor=mix(vColor,vec3(.84,1.,.92),travel*.66);
 if(aData.z>1.5&&aData.z<2.5)vColor=mix(vec3(.25,.59,.46),vec3(.62,.96,.79),travel*.65);
 if(aData.z>2.5&&aData.z<3.5)vColor=vec3(.66,1.,.88);
}`;
const FRAGMENT = `
precision highp float;
uniform float uGlow,uVariant;
varying float vEdge,vLight,vDepth,vType;
varying vec3 vColor;
void main(){
 float edge=exp(-vEdge*vEdge*(uGlow>.5?3.5:2.));
 float alpha=edge*vLight*vDepth*(uGlow>.5?.070:.58);
 if(vType>1.5&&vType<2.5)alpha*=.55;
 alpha*=1.-uVariant*.25;
 gl_FragColor=vec4(vColor*alpha,alpha);
}`;
const BACKGROUND_VERTEX=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const BACKGROUND_FRAGMENT=`
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime,uVariant;
void main(){
 vec2 p=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);
 p.y-=.007;
 float r=length(p);
 float nucleus=exp(-r*r*500.);
 float halo=exp(-r*r*24.)*.085;
 float outer=exp(-pow((r-.305)*5.,2.))*.018;
 float angle=atan(p.y,p.x);
 float light=pow(max(0.,sin(angle*3.+uTime*.23)),8.);
 float lightRim=exp(-pow((r-.36)*37.,2.))*light*.019;
 float field=(nucleus*.2+halo+outer+lightRim)*(1.-uVariant*.28);
 vec3 color=vec3(.18,.8,.52)*field;
 color+=vec3(.64,1.,.86)*nucleus*.31;
 gl_FragColor=vec4(color,field);
}`;

function makeGeometry(compact){
 const vertices=[];
 function segment(a,b,type,phase){
  // Six vertices form a screen-space ribbon, so thin filaments retain their glow on all GPUs.
  for(const [along,side] of [[0,-1],[1,-1],[0,1],[0,1],[1,-1],[1,1]]){
   const p=along?b:a,q=along?a:b;
   vertices.push(p[0],p[1],type,phase,q[0],q[1],side*(along?-1:1),along);
  }
 }
 function curve(samples,type,phase,point){let last=point(0);for(let n=1;n<=samples;n++){const next=point(n/samples);segment(last,next,type,phase);last=next;}}
 const tau=Math.PI*2;
 const fibers=compact?56:96, samples=compact?80:130;
 for(let n=0;n<fibers;n++){
  const phase=n/fibers*tau;
  curve(samples,0,phase,t=>[t*tau,phase+t*tau*3.]);
 }
 for(let n=0;n<(compact?32:54);n++){
  const phase=n/(compact?32:54)*tau;
  curve(compact?42:70,1,phase,t=>[phase,t*tau]);
 }
 for(let n=0;n<5;n++)curve(220,2,n,t=>[t*tau,0]);
 // Interrupted orbit tracks make the verification boundary read as a designed instrument.
 for(let n=0;n<9;n++)curve(16,2,2.4,n<6?t=>[(n*.78+t*.15)*Math.PI,0]:t=>[(n*.4+t*.09)*Math.PI,0]);
 for(let n=0;n<11;n++)curve(80,3,n,t=>[t*tau,0]);
 for(let n=0;n<(compact?12:25);n++)curve(65,4,n/(compact?12:25),t=>[t,0]);
 for(let n=0;n<3;n++)curve(160,5,n,t=>[t*tau,0]);
 return new Float32Array(vertices);
}

function createWebGL(canvas,variant,compact){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
 if(!gl)return null;
 const resources=[];
 function program(vertex,fragment){
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Core shader unavailable');}resources.push(['shader',s]);return s;}
  const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Core shader unavailable');resources.push(['program',p]);return p;
 }
 let main,bg;
 try{main=program(VERTEX,FRAGMENT);bg=program(BACKGROUND_VERTEX,BACKGROUND_FRAGMENT);}catch(error){resources.forEach(([type,r])=>type==='shader'?gl.deleteShader(r):gl.deleteProgram(r));return null;}
 function uniforms(p,names){return Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]));}
 const un=uniforms(main,['uResolution','uPointer','uTime','uScroll','uGlow','uVariant']);
 const ub=uniforms(bg,['uResolution','uTime','uVariant']);
 const geometry=makeGeometry(compact);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,geometry,gl.STATIC_DRAW);
 const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const attribs=[['aData',4,0],['aNext',2,16],['aEdge',2,24]].map(([name,size,offset])=>({location:gl.getAttribLocation(main,name),size,offset}));
 const ba=gl.getAttribLocation(bg,'aPosition');
 gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
 return {
  draw(time,pointer,scroll){
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.useProgram(bg);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(ba);gl.vertexAttribPointer(ba,2,gl.FLOAT,false,0,0);
   gl.uniform2f(ub.uResolution,canvas.width,canvas.height);gl.uniform1f(ub.uTime,time);gl.uniform1f(ub.uVariant,variant?1:0);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(ba);
   gl.useProgram(main);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   for(const a of attribs){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,32,a.offset);}
   gl.uniform2f(un.uResolution,canvas.width,canvas.height);gl.uniform2f(un.uPointer,pointer.x,pointer.y);gl.uniform1f(un.uTime,time);gl.uniform1f(un.uScroll,scroll);gl.uniform1f(un.uVariant,variant?1:0);
   gl.uniform1f(un.uGlow,1);gl.drawArrays(gl.TRIANGLES,0,geometry.length/8);
   gl.uniform1f(un.uGlow,0);gl.drawArrays(gl.TRIANGLES,0,geometry.length/8);
   for(const a of attribs)gl.disableVertexAttribArray(a.location);
  },
  destroy(){gl.deleteBuffer(buffer);gl.deleteBuffer(quad);resources.forEach(([type,r])=>type==='shader'?gl.deleteShader(r):gl.deleteProgram(r));}
 };
}

function createFallback(canvas,variant,compact){
 const ctx=canvas.getContext('2d');if(!ctx)return {draw(){},destroy(){}};
 function project(p,rotation){
  let [x,y,z]=p;let c=Math.cos(rotation),s=Math.sin(rotation);[y,z]=[y*c-z*s,y*s+z*c];
  c=Math.cos(.27);s=Math.sin(.27);[x,z]=[x*c+z*s,-x*s+z*c];
  c=Math.cos(-.29);s=Math.sin(-.29);[x,y]=[x*c-y*s,x*s+y*c];
  const f=canvas.height*1.275/(4.8-z);return [canvas.width/2+x*f,canvas.height/2-y*f,z];
 }
 return {draw(time,pointer,scroll){
  const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,h*.44);halo.addColorStop(0,'rgba(141,240,201,.2)');halo.addColorStop(.15,'rgba(32,211,157,.04)');halo.addColorStop(1,'rgba(32,211,157,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='lighter';
  const rotation=.69+pointer.y*.07+scroll*.09;
  const fibers=compact?38:70;
  for(let n=0;n<fibers;n++){
   const phase=n/fibers*Math.PI*2;ctx.beginPath();let z=0;
   for(let i=0;i<=110;i++){const u=i/110*Math.PI*2+time*.055,v=phase+i/110*Math.PI*6+time*.115;const r=1.015+.277*Math.cos(v);const p=project([r*Math.cos(u),r*Math.sin(u),.277*Math.sin(v)],rotation);z+=p[2];if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}
   ctx.strokeStyle=`rgba(115,239,187,${(.15+(z/110+.3)*.24)*(variant?.7:1)})`;ctx.lineWidth=canvas.width/w*.65;ctx.stroke();
  }
  for(let n=0;n<4;n++){ctx.beginPath();for(let i=0;i<=160;i++){const u=i/160*Math.PI*2+time*.025,p=project([(1.51+n*.055)*Math.cos(u),(1.51+n*.055)*Math.sin(u),0],rotation);if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}ctx.strokeStyle='rgba(162,236,203,.2)';ctx.lineWidth=.8;ctx.stroke();}
  for(let n=0;n<10;n++){ctx.beginPath();const a=n*1.47+time*.09;for(let i=0;i<=100;i++){const u=i/100*Math.PI*2+time*.26,r=.2+n*.012,p=project([r*Math.cos(u),r*Math.sin(u)*Math.cos(a),r*Math.sin(u)*Math.sin(a)],rotation);if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}ctx.strokeStyle='rgba(184,255,223,.38)';ctx.stroke();}
  ctx.globalCompositeOperation='source-over';
 },destroy(){}};
}

/** Mount a pause-aware optical core; the returned function releases all resources. */
export function mountCoreScene(container,options={}){
 if(!container)return ()=>{};
 const variant=options.variant==='vault';
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const compact=window.innerWidth<760;
 const scene=document.createElement('div');scene.className='naro-core-scene';scene.dataset.variant=variant?'vault':'home';scene.setAttribute('role',variant?'img':'group');scene.setAttribute('aria-label','AI intents converge through the NARO coordination core and a Veta policy boundary before execution.');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');scene.appendChild(canvas);
 const pause=document.createElement('button');pause.type='button';pause.className='naro-core-scene__pause';pause.setAttribute('aria-label','Pause core animation');pause.setAttribute('aria-pressed','false');
 const hasControls=!variant&&options.labels!==false&&options.controls!==false;
 pause.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg><span>Pause motion</span>';pause.hidden=media.matches||!hasControls;
 if(hasControls)scene.appendChild(pause);
 if(options.labels!==false&&!variant){
  if(options.labels!=='footer'){
   const head=document.createElement('div');head.className='naro-core-scene__head';head.innerHTML='<span>NARO CORE<small>INTENT COORDINATION ENGINE</small></span>';
   const boundary=document.createElement('div');boundary.className='naro-core-scene__boundary';boundary.innerHTML=vetaLogo()+'<span>POLICY BOUNDARY</span>';
   scene.append(head,boundary);
  }
  const footer=document.createElement('div');footer.className='naro-core-scene__footer';footer.innerHTML='<span>AI INTENT</span><i>→</i><span>POLICY CHECK</span><i>→</i><span>VERIFIED EXECUTION</span>';
  scene.append(footer);
 }
 container.appendChild(scene);
 let canvasRef=canvas;
 let renderer=createWebGL(canvas,variant,compact);
 scene.dataset.coreRenderer=renderer?'webgl':'canvas';
 if(!renderer){canvas.remove();const fallback=document.createElement('canvas');fallback.setAttribute('aria-hidden','true');scene.prepend(fallback);renderer=createFallback(fallback,variant,compact);canvasRef=fallback;}
 canvasRef.dataset.coreRenderer=scene.dataset.coreRenderer;
 let frame=0;
 function draw(){renderer.draw(time,pointer,scroll);scene.dataset.coreFrame=String(++frame);canvasRef.dataset.coreFrame=String(frame);}
 let raf=0,disposed=false,inView=true,manualPaused=false,contextLost=false,time=6.2,lastTime=0,scroll=0;
 const pointer={x:0,y:0},target={x:0,y:0};
 function resize(){
  const rect=scene.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,compact?1.25:1.5);
  canvasRef.width=Math.max(1,Math.round(rect.width*dpr));canvasRef.height=Math.max(1,Math.round(rect.height*dpr));
  renderStatic();
 }
 function renderStatic(){if(!disposed)draw();}
 function tick(now){
  raf=0;if(disposed||contextLost||!inView||document.hidden||media.matches||manualPaused)return;
  const delta=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;time+=delta;
  pointer.x+=(target.x-pointer.x)*.035;pointer.y+=(target.y-pointer.y)*.035;
  const rect=scene.getBoundingClientRect();scroll=Math.max(-1,Math.min(1,(window.innerHeight/2-rect.top-rect.height/2)/window.innerHeight));
  draw();raf=requestAnimationFrame(tick);
 }
 function schedule(){
  if(raf){cancelAnimationFrame(raf);raf=0;}
  lastTime=0;
  if(disposed||contextLost||!inView||document.hidden)return;
  pause.hidden=media.matches||!hasControls;
  if(media.matches||manualPaused)renderStatic();else raf=requestAnimationFrame(tick);
 }
 function togglePause(){
  manualPaused=!manualPaused;pause.setAttribute('aria-pressed',String(manualPaused));pause.setAttribute('aria-label',manualPaused?'Resume core animation':'Pause core animation');
  pause.innerHTML=manualPaused?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z"/></svg><span>Resume motion</span>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z"/></svg><span>Pause motion</span>';
  schedule();
 }
 pause.addEventListener('click',togglePause);
 function move(event){const r=scene.getBoundingClientRect();target.x=(event.clientX-r.left)/r.width*2-1;target.y=(event.clientY-r.top)/r.height*2-1;}
 function leave(){target.x=target.y=0;}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(scene);
 const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{rootMargin:'100px'});intersection.observe(scene);
 container.addEventListener('pointermove',move,{passive:true});container.addEventListener('pointerleave',leave,{passive:true});document.addEventListener('visibilitychange',schedule);media.addEventListener('change',schedule);
 function lost(event){event.preventDefault();contextLost=true;if(raf)cancelAnimationFrame(raf);raf=0;}
 function restored(){
  if(disposed)return;
  renderer.destroy();
  const replacement=createWebGL(canvasRef,variant,compact);
  if(replacement){renderer=replacement;scene.dataset.coreRenderer='webgl';}
  else{
   canvasRef.removeEventListener('webglcontextlost',lost);canvasRef.removeEventListener('webglcontextrestored',restored);
   canvasRef.remove();const fallback=document.createElement('canvas');fallback.setAttribute('aria-hidden','true');scene.prepend(fallback);
   canvasRef=fallback;renderer=createFallback(canvasRef,variant,compact);scene.dataset.coreRenderer='canvas';
  }
  canvasRef.dataset.coreRenderer=scene.dataset.coreRenderer;contextLost=false;resize();schedule();
 }
 canvasRef.addEventListener('webglcontextlost',lost);canvasRef.addEventListener('webglcontextrestored',restored);
 resize();schedule();
 return ()=>{disposed=true;if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();intersection.disconnect();container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',schedule);media.removeEventListener('change',schedule);pause.removeEventListener('click',togglePause);canvasRef.removeEventListener('webglcontextlost',lost);canvasRef.removeEventListener('webglcontextrestored',restored);renderer.destroy();scene.remove();};
}
