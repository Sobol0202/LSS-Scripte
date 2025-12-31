// ==UserScript==
// @name         LSS Feuerwerk
// @version      1.1
// @author       Sobol
// @description  Feuerwerk ist teuer und schlecht für die Umwelt, darum Digital
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
'use strict';

const button = document.createElement('button');
button.textContent = '🎆 Feuerwerk';
Object.assign(button.style,{
  position:'fixed', bottom:'20px', left:'20px',
  zIndex:100000, padding:'10px 16px',
  borderRadius:'8px', border:'none',
  background:'#222', color:'#fff', cursor:'pointer'
});
document.body.appendChild(button);

const overlay = document.createElement('div');
Object.assign(overlay.style,{
  position:'fixed', inset:0,
  background:'rgba(0,0,0,0.75)',
  zIndex:99997, opacity:0,
  transition:'opacity 1.5s ease',
  pointerEvents:'none'
});
document.body.appendChild(overlay);

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
Object.assign(canvas.style,{
  position:'fixed', inset:0,
  zIndex:99998, pointerEvents:'none'
});
document.body.appendChild(canvas);

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize(); addEventListener('resize',resize);


let rockets=[], guided=[], particles=[], digitParticles=[];
let running=false, startTime=0, index=0;


class Rocket {
  constructor(o){
    this.x=o.x; this.y=canvas.height;
    const r=o.angle*Math.PI/180;
    this.vx=Math.cos(r)*o.speed;
    this.vy=Math.sin(r)*o.speed;
    this.targetY=o.targetY;
    this.color=o.color;
    this.explosion=o.explosion;
    this.scale=o.scale||1;
  }
  update(){
    this.x+=this.vx; this.y+=this.vy;
    if(this.y<=this.targetY){
      explode(this.x,this.y,this.explosion,this.color,this.scale);
      return false;
    }
    return true;
  }
  draw(){
    ctx.save();
    ctx.shadowBlur=20;
    ctx.shadowColor=this.color;
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-4,this.y-18,8,18);
    ctx.restore();
  }
}


class GuidedRocket {
  constructor(o){
    this.x=o.x; this.y=canvas.height;
    this.tx=o.tx; this.ty=o.ty;
    this.color=o.color;
    this.speed=o.speed;
    this.turn=o.turn;
    this.vx=0; this.vy=-this.speed;
    this.trail=[];
  }
  update(){
    const dx=this.tx-this.x, dy=this.ty-this.y;
    const d=Math.hypot(dx,dy);
    if(d<8){
      explodeDigit(this.x,this.y,this.color);
      return false;
    }
    const ux=dx/d, uy=dy/d;
    this.vx=(1-this.turn)*this.vx + this.turn*ux*this.speed;
    this.vy=(1-this.turn)*this.vy + this.turn*uy*this.speed;
    this.x+=this.vx; this.y+=this.vy;
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>42) this.trail.shift();
    return true;
  }
  draw(){
    ctx.save();
    ctx.strokeStyle=this.color;
    ctx.shadowBlur=30;
    ctx.shadowColor=this.color;
    ctx.beginPath();
    this.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.stroke();
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-3,this.y-10,6,10);
    ctx.restore();
  }
}

class Particle {
  constructor(x,y,a,s,c,z,l){
    this.x=x; this.y=y;
    this.vx=Math.cos(a)*s;
    this.vy=Math.sin(a)*s;
    this.life=l; this.max=l;
    this.color=c; this.size=z;
  }
  update(){
    this.vy+=0.05;
    this.x+=this.vx; this.y+=this.vy;
    return --this.life>0;
  }
  draw(){
    ctx.save();
    ctx.globalAlpha=this.life/this.max;
    ctx.shadowBlur=15;
    ctx.shadowColor=this.color;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

class DigitParticle {
  constructor(x,y,a,s,c){
    this.x=x; this.y=y;
    this.vx=Math.cos(a)*s;
    this.vy=Math.sin(a)*s;
    this.color=c;
    this.life=140; this.max=140;
    this.size=4.2;
    this.gravity=0.004;
  }
  update(){
    this.vy+=this.gravity;
    this.x+=this.vx; this.y+=this.vy;
    return --this.life>0;
  }
  draw(){
    const t=this.life/this.max;
    ctx.save();
    ctx.globalAlpha=t*t;
    ctx.shadowBlur=24;
    ctx.shadowColor=this.color;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}


function explode(x,y,type,c,sc){
  const count = Math.round(90*sc);

  switch(type){
    case 'ring':
      for(let i=0;i<count;i++){
        const a=i/count*Math.PI*2;
        particles.push(new Particle(x,y,a,4.5*sc,c,3,100));
      }
      break;

    case 'star':
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2;
        const sp=i%2?2.5:6;
        particles.push(new Particle(x,y,a,sp*sc,c,3,110));
      }
      break;

    case 'heart':
      for(let i=0;i<count;i++){
        const t=i/count*Math.PI*2;
        const hx=16*Math.sin(t)**3;
        const hy=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
        const a=Math.atan2(-hy,hx);
        particles.push(new Particle(x,y,a,0.15*Math.hypot(hx,hy)*sc,c,3,120));
      }
      break;

    case 'spiral':
      for(let i=0;i<count;i++){
        particles.push(
          new Particle(x,y,i*0.35,i*0.06*sc,c,3,120)
        );
      }
      break;

    case 'smiley':
      for(let i=0;i<count;i++){
        particles.push(new Particle(x,y,Math.random()*Math.PI*2,3*sc,'yellow',3,110));
      }
      break;

    default: // burst
      for(let i=0;i<count;i++){
        particles.push(
          new Particle(
            x,y,
            Math.random()*Math.PI*2,
            (2+Math.random()*4)*sc,
            c,3,100
          )
        );
      }
  }
}


function explodeDigit(x,y,color){
  const count=16;
  for(let i=0;i<count;i++){
    const a=(Math.PI*2*i)/count;
    const s=i%2?0.4:0.8;
    digitParticles.push(new DigitParticle(x,y,a,s,color));
  }
}


const GLYPHS = {
  // L
  'L': [
    [0,0],[0,1],[0,2],[0,3],[0,4],
    [1,4],[2,4]
  ],

  // S
  'S': [
    [0,0],[1,0],[2,0],
    [0,1],
    [0,2],[1,2],[2,2],
          [2,3],
    [0,4],[1,4],[2,4]
  ],

  // 2
  '2': [
    [0,0],[1,0],[2,0],
          [2,1],
    [0,2],[1,2],[2,2],
    [0,3],
    [0,4],[1,4],[2,4]
  ],

  // 0
  '0': [
    [0,0],[1,0],[2,0],
    [0,1],       [2,1],
    [0,2],       [2,2],
    [0,3],       [2,3],
    [0,4],[1,4],[2,4]
  ],

  // 6
  '6': [
          [1,0],[2,0],
    [0,1],
    [0,2],[1,2],[2,2],
    [0,3],       [2,3],
    [0,4],[1,4],[2,4]
  ]
};


function spawnGlyphXXL(ch,x,y,cell,color){
  GLYPHS[ch].forEach(([gx,gy],i)=>{
    for(let sx=0;sx<3;sx++){
      for(let sy=0;sy<3;sy++){
        choreography.push({
          time:t+(i*45)+(sx+sy)*18,
          action:'guided',
          o:{
            x:x+gx*cell+sx*(cell/3),
            tx:x+gx*cell+sx*(cell/3),
            ty:y+gy*cell+sy*(cell/3),
            color:color,
            speed:6,
            turn:0.24
          }
        });
      }
    }
  });
}


const choreography=[];
let t=0;

for(let i=0;i<80;i++){
  choreography.push({
    time:t, action:'launch',
    o:{
      x:Math.random()*canvas.width,
      angle:-60-Math.random()*60,
      speed:8,
      targetY:canvas.height*0.5,
      explosion:['burst','ring','star','heart','spiral','smiley'][i%6],
      color:`hsl(${Math.random()*360},100%,60%)`,
      scale:1.2
    }
  });
  t+=260;
}

t+=2200;

/* LSS (rot) */
const cell=84, gap=120;
const glyphW=cell*3;
const startX=(canvas.width-(glyphW*7+gap*6))/2;
const baseY=canvas.height*0.20;

spawnGlyphXXL('L',startX+0*(glyphW+gap),baseY,cell,'red');
spawnGlyphXXL('S',startX+1*(glyphW+gap),baseY,cell,'red');
spawnGlyphXXL('S',startX+2*(glyphW+gap),baseY,cell,'red');

t+=2400;

/* 2026 (weiß) */
spawnGlyphXXL('2',startX+3*(glyphW+gap),baseY,cell,'white');
spawnGlyphXXL('0',startX+4*(glyphW+gap),baseY,cell,'white');
spawnGlyphXXL('2',startX+5*(glyphW+gap),baseY,cell,'white');
spawnGlyphXXL('6',startX+6*(glyphW+gap),baseY,cell,'white');

t+=4200;

/* Goldenes Finale */
for(let i=0;i<140;i++){
  choreography.push({
    time:t+i*85,
    action:'launch',
    o:{
      x:Math.random()*canvas.width,
      angle:-70-Math.random()*40,
      speed:9.5+Math.random()*2,
      targetY:canvas.height*(0.28+Math.random()*0.25),
      explosion:['burst','ring','star'][i%3],
      color:'gold',
      scale:2.2
    }
  });
}

function run(){
  if(!running)return;
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const now=performance.now()-startTime;
  while(index<choreography.length && now>=choreography[index].time){
    const e=choreography[index++];
    if(e.action==='launch') rockets.push(new Rocket(e.o));
    if(e.action==='guided') guided.push(new GuidedRocket(e.o));
  }

  rockets=rockets.filter(r=>{r.draw();return r.update();});
  guided=guided.filter(r=>{r.draw();return r.update();});
  particles=particles.filter(p=>{p.draw();return p.update();});
  digitParticles=digitParticles.filter(p=>{p.draw();return p.update();});

  if(index>=choreography.length && !rockets.length && !guided.length && !particles.length && !digitParticles.length){
    running=false;
    overlay.style.opacity=0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    return;
  }
  requestAnimationFrame(run);
}

button.onclick=()=>{
  if(running)return;
  rockets=[]; guided=[]; particles=[]; digitParticles=[];
  index=0; running=true; startTime=performance.now();
  overlay.style.opacity=1;
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  run();
};

})();
