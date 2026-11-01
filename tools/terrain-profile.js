// Terrain tuning helper: prints the route elevation (metres) at points along the control polyline,
// plus the highest point and two reference heights. Functions are copied from index.html.
// Variant "b" is the terrain used in index.html; "a" is the first draft, kept for comparison.
// Usage: node tools/terrain-profile.js b ['[[x,z],...]']   (optional custom route control points)
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function hash(i,j){let n=(Math.imul(i,374761393)+Math.imul(j,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,o){let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=a*vnoise(x,y);n+=a;a*=.5;const nx=(.8*x-.6*y)*2.03+17.3,ny=(.6*x+.8*y)*2.03-9.1;x=nx;y=ny}return s/n}
const gauss=(dx,dz,s)=>Math.exp(-(dx*dx+dz*dz)/(2*s*s));
function segDist(px,pz,ax,az,bx,bz){const vx=bx-ax,vz=bz-az;const t=clamp(((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz),0,1);return Math.hypot(px-(ax+t*vx),pz-(az+t*vz))}
const V = process.argv[2]||'a';
function heightAt(x,z){
  let rise, dome, ridge, knob;
  if (V==='a'){ rise=smooth(-0.55,0.15,z)*0.28; dome=0.44*gauss(x+0.64,z-0.30,0.27); const rd=segDist(x,z,0.30,0.72,0.98,-0.42); ridge=0.62*Math.exp(-(rd*rd)/(2*0.24*0.24)); knob=0.18*gauss(x+0.40,z-0.88,0.22);}
  else { rise=smooth(-0.55,0.12,z)*0.30 - smooth(0.25,1.0,z)*0.12; dome=0.46*gauss(x+0.60,z-0.24,0.30); const rd=segDist(x,z,0.48,0.60,1.0,-0.45); ridge=0.64*Math.exp(-(rd*rd)/(2*0.27*0.27)); knob=0.14*gauss(x+0.48,z-0.92,0.2);}
  const mtn=Math.min(1,(Math.max(0,rise)/0.28)*0.55+(dome+ridge)*1.5);
  const r=fbm(x*2.6+3.1,z*2.6-1.7,5);const ridged=1-Math.abs(2*fbm(x*4.4-5.0,z*4.4+2.0,4)-1);
  const detail=((r-.5)*.20+(ridged-.62)*.10)*mtn;const basin=(fbm(x*1.1+9,z*1.1+4,3)-.5)*.05-.022*z;
  return Math.max(0,.07+rise+dome+ridge+knob+detail+basin)}
const ctrl=JSON.parse(process.argv[3]||'[[-0.64,-0.95],[-0.46,-0.74],[-0.26,-0.56],[-0.10,-0.40],[-0.27,-0.27],[-0.05,-0.16],[-0.24,-0.04],[-0.02,0.07],[-0.08,0.22],[0.03,0.40],[-0.03,0.58],[0.05,0.78],[0.03,1.02]]');
// sample along ctrl polyline coarse
let out=[];for(let i=0;i<ctrl.length-1;i++){for(let s=0;s<4;s++){const t=s/4;const x=ctrl[i][0]+(ctrl[i+1][0]-ctrl[i][0])*t,z=ctrl[i][1]+(ctrl[i+1][1]-ctrl[i][1])*t;out.push([x,z,Math.round(180+heightAt(x,z)*1580)])}}
console.log(out.map(o=>`${o[1].toFixed(2)}:${o[2]}`).join(' '));
let mx=0,mz=0;for(let x=-1;x<=1;x+=0.02)for(let z=-0.5;z<=1;z+=0.02){const h=heightAt(x,z);if(h>mx){mx=h;mz=[x.toFixed(2),z.toFixed(2)]}} console.log('peak',Math.round(180+mx*1580),mz);
console.log('dome top', Math.round(180+heightAt(-0.6,0.24)*1580), 'end', Math.round(180+heightAt(0.03,1.0)*1580));
