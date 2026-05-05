// ═══════════════════════════ BACKGROUND CANVAS ═══════════════════════════
(function initBg(){
  const c=document.getElementById('bgCanvas'),ctx=c.getContext('2d');
  let stars=[],w,h;
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight;init();}
  function init(){stars=[];for(let i=0;i<120;i++)stars.push({x:Math.random()*w,y:Math.random()*h*.75,r:Math.random()*1.8+.3,o:Math.random(),d:(Math.random()-.5)*.008});}
  function frame(){ctx.clearRect(0,0,w,h);stars.forEach(s=>{s.o+=s.d;if(s.o<0||s.o>1)s.d*=-1;ctx.fillStyle=`rgba(255,255,255,${s.o*.7})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});requestAnimationFrame(frame);}
  window.addEventListener('resize',resize);resize();frame();
})();

// ═══════════════════════════ SEEDED RANDOM ═══════════════════════════
// Deterministic random so the tree doesn't jitter every frame
let _seed=42;
function seedRandom(s){_seed=s;}
function sRand(){_seed=(_seed*16807+0)%2147483647;return(_seed-1)/2147483646;}

// ═══════════════════════════ TREE CANVAS ═══════════════════════════
const treeCanvas=document.getElementById('treeCanvas');
const treeCtx=treeCanvas.getContext('2d');
let cachedTreePct=-1;
let cachedTreeImage=null;

let birds = [];
for(let i=0;i<5;i++) birds.push({x:Math.random()*600, y:30+Math.random()*150, vx:0.4+Math.random()*0.6, s:0.5+Math.random()*0.5, p:Math.random()*10});

function drawTree(pct){
  const W=treeCanvas.width,H=treeCanvas.height,cx=W/2,ground=H-60;
  const ctx=treeCtx;
  ctx.clearRect(0,0,W,H);

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';

  // Draw birds
  birds.forEach(b=>{
    b.x += b.vx;
    if(b.x>W+30) { b.x=-30; b.y=30+Math.random()*150; }
    const wingY = Math.sin(Date.now()*.006 + b.p) * 8 * b.s;
    ctx.beginPath();
    ctx.moveTo(b.x-12*b.s, b.y-4*b.s + wingY);
    ctx.quadraticCurveTo(b.x-6*b.s, b.y, b.x, b.y);
    ctx.quadraticCurveTo(b.x+6*b.s, b.y, b.x+12*b.s, b.y-4*b.s + wingY);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5; ctx.stroke();
  });

  // Reset seed for deterministic drawing
  seedRandom(12345);

  // Ground glow
  const gg=ctx.createRadialGradient(cx,ground+20,10,cx,ground+20,120);
  gg.addColorStop(0,'rgba(42,122,82,0.2)');gg.addColorStop(1,'transparent');
  ctx.fillStyle=gg;ctx.fillRect(0,ground-60,W,H-ground+60);

  // Ground ellipse
  ctx.fillStyle='#1a3a20';
  ctx.beginPath();ctx.ellipse(cx,ground+10,90,12,0,0,Math.PI*2);ctx.fill();

  if(pct<2){
    ctx.fillStyle='#6a3d0a';ctx.beginPath();ctx.ellipse(cx,ground,10,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a7a2a';ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(cx,ground-6,6,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    return;
  }

  const trH=Math.min(20+pct*2.8,310);
  const trW=Math.max(8,8+pct*.12);

  // Trunk
  const tg=ctx.createLinearGradient(cx,ground,cx,ground-trH);
  tg.addColorStop(0,'#5a3510');tg.addColorStop(.5,'#4a2c0a');tg.addColorStop(1,'#3a2008');
  ctx.fillStyle=tg;ctx.beginPath();
  ctx.moveTo(cx-trW*.7,ground);ctx.lineTo(cx-trW*.4,ground-trH);
  ctx.lineTo(cx+trW*.4,ground-trH);ctx.lineTo(cx+trW*.7,ground);ctx.fill();

  // Bark
  if(pct>15){
    ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;
    for(let i=0;i<5;i++){
      const y=ground-trH*(.15+i*.17);
      ctx.beginPath();ctx.moveTo(cx-trW*.3,y);ctx.lineTo(cx+trW*.3,y+3);ctx.stroke();
    }
  }

  // Roots
  if(pct>25){
    ctx.strokeStyle='#4a2c0a';ctx.lineWidth=3;ctx.lineCap='round';
    [[-1,.3],[1,.28],[-1,.5],[1,.45]].forEach(([dir,len])=>{
      ctx.beginPath();ctx.moveTo(cx+dir*trW*.5,ground);
      ctx.quadraticCurveTo(cx+dir*(trW+15),ground+8,cx+dir*(trW+len*40),ground+12);ctx.stroke();
    });
  }

  const treeTop=ground-trH;
  const depth=pct<18?1:pct<35?2:pct<55?3:pct<80?4:5;
  const branchLen=Math.min(20+pct*1.2,140);
  const leafCol=pct>85?'#4de88a':pct>65?'#38c47a':pct>40?'#2da860':pct>20?'#228048':'#1a6038';
  let leaves=[];
  
  const t = Date.now() * 0.0012; // Time for wind swaying

  function branch(x1,y1,angle,len,w,dep){
    if(dep<=0||len<6)return;
    const sway = Math.sin(t + dep*0.8) * (5-dep) * 0.5; // Wind sway
    const rad=(angle+sway)*Math.PI/180;
    const x2=x1+Math.sin(rad)*len,y2=y1-Math.cos(rad)*len;
    ctx.strokeStyle=dep>2?'#4a2c0a':'#6a4520';ctx.lineWidth=w;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    if(dep>1){
      branch(x2,y2,angle-22-sRand()*8,len*.67,w*.62,dep-1);
      branch(x2,y2,angle+20+sRand()*8,len*.63,w*.58,dep-1);
      if(pct>45)branch(x2,y2,angle+sRand()*6-3,len*.52,w*.48,dep-1);
    }
    if(dep===1&&pct>8){
      const n=Math.ceil(pct/18);
      for(let i=0;i<n;i++){
        const lx=x2+(sRand()-.5)*24,ly=y2+(sRand()-.5)*18;
        const ls=5+sRand()*10;
        leaves.push({x:lx,y:ly,s:ls,a:sRand()*360,op:.6+sRand()*.35, p:sRand()*10});
      }
    }
  }

  const bw=4+pct*.08;
  branch(cx,treeTop,-26,branchLen,bw,depth);
  branch(cx,treeTop,24,branchLen*.88,bw*.88,depth);
  branch(cx,treeTop,-2,branchLen*1.1,bw,depth);
  if(pct>28){
    const my=treeTop+trH*.35;
    branch(cx,my,-50,branchLen*.45,bw*.45,Math.max(1,depth-1));
    branch(cx,my,46,branchLen*.42,bw*.42,Math.max(1,depth-1));
  }

  // Draw leaves (swaying smoothly)
  leaves.forEach(l=>{
    const leafSway = Math.sin(t*2 + l.p) * 12; // Individual leaf rotation
    ctx.save();ctx.translate(l.x,l.y);ctx.rotate((l.a + leafSway)*Math.PI/180);
    ctx.fillStyle=leafCol;ctx.globalAlpha=l.op;
    ctx.beginPath();ctx.ellipse(0,0,l.s,l.s*.55,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(-l.s*.6,0);ctx.lineTo(l.s*.6,0);ctx.stroke();
    ctx.restore();
  });

  // Flowers (pct>55)
  if(pct>55){
    seedRandom(777);
    const fN=Math.floor((pct-55)/8)+1;
    const spots=[[cx-30,treeTop-40],[cx+35,treeTop-30],[cx-8,treeTop-60],[cx+14,treeTop-20],[cx+50,treeTop-50],[cx-45,treeTop-25]];
    spots.slice(0,Math.min(fN,6)).forEach(([fx,fy])=>{
      for(let p=0;p<6;p++){
        const pr=p*60*Math.PI/180;
        const px=fx+Math.cos(pr)*7,py=fy+Math.sin(pr)*7;
        ctx.save();ctx.translate(px,py);ctx.rotate(p*60*Math.PI/180);
        ctx.fillStyle=pct>80?'#f0d070':'#e8d080';ctx.globalAlpha=.8;
        ctx.beginPath();ctx.ellipse(0,0,4.5,2.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      ctx.fillStyle='#c9a84c';ctx.beginPath();ctx.arc(fx,fy,3.5,0,Math.PI*2);ctx.fill();
    });
  }

  // Fruits (pct>80)
  if(pct>80){
    [[cx-20,treeTop-35],[cx+28,treeTop-45],[cx+5,treeTop-55]].forEach(([fx,fy])=>{
      const rg=ctx.createRadialGradient(fx-2,fy-2,1,fx,fy,7);
      rg.addColorStop(0,'#ff6b6b');rg.addColorStop(1,'#cc3333');
      ctx.fillStyle=rg;ctx.beginPath();ctx.arc(fx,fy,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3a7a2a';ctx.fillRect(fx-1,fy-9,2,4);
    });
  }

  // Top glow
  const glowR=20+pct*.8;
  const topY=treeTop-branchLen*.5;
  const tglow=ctx.createRadialGradient(cx,topY,0,cx,topY,glowR);
  tglow.addColorStop(0,`rgba(201,168,76,${.03+pct*.001})`);tglow.addColorStop(1,'transparent');
  ctx.fillStyle=tglow;ctx.fillRect(cx-glowR,topY-glowR,glowR*2,glowR*2);

  // Sparkle stars (pct>80) - stable positions
  if(pct>80){
    seedRandom(999);
    for(let i=0;i<8;i++){
      const sx=cx+(sRand()-.5)*160,sy=treeTop-sRand()*100;
      ctx.fillStyle=isDark?'#e6c97a':'#c9a84c';ctx.globalAlpha=.4+sRand()*.5;
      ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
  }

  // Fireflies at night (these CAN move - smooth sinusoidal motion)
  if(isDark&&pct>20){
    const t=Date.now()*.001;
    for(let i=0;i<6;i++){
      const fx=cx+Math.sin(t*.3+i*1.2)*80,fy=treeTop-20+Math.cos(t*.2+i)*60;
      ctx.fillStyle=`rgba(230,201,122,${.3+Math.sin(t*1.5+i)*.3})`;
      ctx.beginPath();ctx.arc(fx,fy,3,0,Math.PI*2);ctx.fill();
      const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,12);
      fg.addColorStop(0,'rgba(230,201,122,0.15)');fg.addColorStop(1,'transparent');
      ctx.fillStyle=fg;ctx.fillRect(fx-12,fy-12,24,24);
    }
  }
}

// ═══════════════════════════ WATERING ANIMATION ═══════════════════════════
let waterDrops=[];
let sparkles=[];
let waterPhase=0;

function triggerWatering(){
  if(animating)return;
  animating=true;
  waterPhase=1;
  waterDrops=[];

  // More homogeneous rain
  let dropTimer=setInterval(()=>{
    for(let i=0;i<5;i++){
      const W=treeCanvas.width;
      waterDrops.push({
        x:W/2+(Math.random()-.5)*240, // Spread across the tree width
        y:-10-Math.random()*40, // Start above canvas
        vy:6+Math.random()*5,
        vx:(Math.random()-.5)*2 + 1, // Slight drift to the right
        life:1,
        s:1.5+Math.random()*2
      });
    }
  },30);

  setTimeout(()=>{clearInterval(dropTimer);waterPhase=2;
    sparkles=[];
    const cx=treeCanvas.width/2,cy=treeCanvas.height*.35;
    for(let i=0;i<35;i++){
      sparkles.push({
        x:cx+(Math.random()-.5)*150,
        y:cy+(Math.random()-.5)*100,
        vx:(Math.random()-.5)*10,vy:-(3+Math.random()*8),
        life:1,
        color:['#c9a84c','#38c47a','#e6c97a','#7edcef','#fff'][i%5],
        s:2.5+Math.random()*4
      });
    }
    setTimeout(()=>{waterPhase=0;animating=false;render();},1200);
  },2500); // Rains for 2.5 seconds
}

// Tree render loop with effects and smooth growth interpolation
let displayPct = -1;
let currentDayKey = null;

function animateTreeWithEffects(){
  // Smoothly interpolate tree percentage
  const k = selectedDate;
  if(currentDayKey !== k) {
    currentDayKey = k;
    displayPct = getScore(getDay(k)); // Instant jump if changing days
  }
  const targetPct = getScore(getDay(k));
  if(Math.abs(displayPct - targetPct) > 0.1) {
    displayPct += (targetPct - displayPct) * 0.04; // Grow petit a petit
  } else {
    displayPct = targetPct;
  }

  drawTree(displayPct);
  const ctx=treeCtx;

  if(waterPhase>=1){
    waterDrops.forEach(d=>{
      d.y+=d.vy;d.x+=d.vx;d.life-=.012; // Slower fade
      if(d.life<=0)return;
      ctx.fillStyle=`rgba(120,200,232,${d.life})`;
      ctx.beginPath();ctx.ellipse(d.x,d.y,d.s*.6,d.s,0,0,Math.PI*2);ctx.fill();
    });
    waterDrops=waterDrops.filter(d=>d.life>0);
  }

  if(waterPhase===2){
    sparkles.forEach(s=>{
      s.x+=s.vx;s.y+=s.vy;s.vy+=.2;s.life-=.015;
      if(s.life<=0)return;
      ctx.fillStyle=s.color;ctx.globalAlpha=s.life;
      ctx.beginPath();ctx.arc(s.x,s.y,s.s*s.life,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    });
    sparkles=sparkles.filter(s=>s.life>0);
  }

  requestAnimationFrame(animateTreeWithEffects);
}
