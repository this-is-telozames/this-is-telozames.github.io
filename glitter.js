'use strict';
(() => {
 const canvas=document.querySelector('#page-glitter'),button=document.querySelector('#glitter-toggle');
 const ctx=canvas.getContext('2d');if(!ctx){canvas.hidden=true;button.hidden=true;return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let enabled=true,raf=0,last=0,w=0,h=0,ambient=[],bursts=[];
 const colors=['#ddff45','#fff6b0','#ff9dce','#f4f6ff'];
 function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ambient=Array.from({length:w<600?18:32},()=>({x:Math.random()*w,y:Math.random()*h,size:1+Math.random()*2.5,phase:Math.random()*Math.PI*2,speed:.3+Math.random()*.3,color:colors[Math.floor(Math.random()*colors.length)]}));}
 function active(){return enabled&&!reduced.matches&&!document.hidden&&!document.querySelector('dialog[open]');}
 function star(x,y,size,alpha,color,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-size*2);ctx.lineTo(size*.45,-size*.45);ctx.lineTo(size*2,0);ctx.lineTo(size*.45,size*.45);ctx.lineTo(0,size*2);ctx.lineTo(-size*.45,size*.45);ctx.lineTo(-size*2,0);ctx.lineTo(-size*.45,-size*.45);ctx.closePath();ctx.fill();ctx.restore();}
 function draw(now){raf=0;if(!active()){ctx.clearRect(0,0,w,h);return;}raf=requestAnimationFrame(draw);if(now-last<32)return;const dt=Math.min((now-last)/1000,.05);last=now;ctx.clearRect(0,0,w,h);for(const p of ambient){p.y=(p.y+dt*5)%h;const glow=(Math.sin(now*.001*p.speed+p.phase)+1)/2;star(p.x+Math.sin(now*.0002+p.phase)*10,p.y,p.size,.1+glow*.48,p.color,now*.0001);}
 bursts=bursts.filter(p=>now-p.born<1800);for(const p of bursts){const age=(now-p.born)/1000;star(p.x+p.vx*age,p.y+p.vy*age+35*age*age,p.size,Math.max(0,1-age/1.8),p.color,age*2);}}
 function sync(){cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,w,h);button.hidden=reduced.matches;button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Выключить блёстки':'Включить блёстки');if(active()){last=performance.now();raf=requestAnimationFrame(draw);}}
 function burst(x,y,n=12){if(!active())return;const now=performance.now();for(let i=0;i<n;i++)bursts.push({x,y,born:now,vx:(Math.random()-.5)*200,vy:-35-Math.random()*100,size:1.5+Math.random()*3,color:colors[i%colors.length]});bursts=bursts.slice(-80);}
 button.onclick=()=>{enabled=!enabled;bursts=[];sync();if(enabled)burst(w*.75,h*.75);};
 document.addEventListener('pointerdown',e=>{if(e.target.closest('#glitter-toggle,dialog'))return;burst(e.clientX,e.clientY,7);},{passive:true});
 document.addEventListener('letter-open',()=>burst(w/2,h*.55,48));
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);window.addEventListener('resize',()=>{resize();sync();},{passive:true});new MutationObserver(sync).observe(document.querySelector('#viewer'),{attributes:true,attributeFilter:['open']});resize();sync();
})();
