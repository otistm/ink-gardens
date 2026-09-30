/* Ink Gardens: the garden behind the shop. Twelve beds (S.garden), the seed tray along the bottom, and the bucket of
   cut flowers. One tap does the obvious thing: plant an empty bed, water a growing plant, pick a bloom, pull a weed,
   clear a dead stalk. A bed is null (empty) or {p, g growth 0–1, w water 0–1, bl bloom seconds left, dry, dead, weed}. */
"use strict";
const mult={grow:()=>S.up.glass?1.34:1,bloom:()=>S.up.food?1.7:1};
const bloomTime=p=>PLANTS[p].bloom*mult.bloom();
function lookOf(b){
  if(!b)return 'empty';if(b.weed)return 'weed';if(b.dead)return 'dead';
  if(b.g<.25)return 'seed';if(b.g<.6)return 'sprout';if(b.g<1)return 'bud';
  return b.bl<bloomTime(b.p)*.3?'fade':'bloom';
}
const growing=()=>S.garden.some(b=>b&&!b.dead&&!b.weed);
const bucketCount=()=>S.bucket.reduce((a,b)=>a+b,0);

/* ---------- drawing the beds ---------- */
// Only one row of undug beds shows, so the open ones stay big.
function drawGarden(){
  let h='';const rows=Math.min(BEDS/3,Math.ceil((S.beds+1)/3));
  garden.style.setProperty('--rows',rows);
  for(let i=0;i<rows*3;i++){
    if(i>=S.beds){h+=`<div class="bed locked" data-b="${i}"><span>${i===S.beds?`Dig for ${money(BED_COST[i])}<small>in the seed shop</small>`:''}</span></div>`;continue}
    h+=`<button class="bed" data-b="${i}" aria-label="Bed ${i+1}"><div class="art"></div><div class="wbar" aria-hidden="true"><i></i></div><b class="tag"></b></button>`;
  }
  garden.innerHTML=h;
  for(let i=0;i<S.beds;i++)paintBed(i,true);
  coachRedraw();
}
const TAG={bloom:'Pick',fade:'Fading',dead:'Clear',weed:'Pull'};
function paintBed(i,force){
  const el=garden.querySelector(`[data-b="${i}"]`);if(!el||el.classList.contains('locked'))return;
  const b=S.garden[i],look=lookOf(b);
  if(force||el.dataset.look!==look){
    el.dataset.look=look;
    el.querySelector('.art').innerHTML=bedSVG(b&&b.p,look);
    el.querySelector('.tag').textContent=TAG[look]||(look==='empty'?'':'');
    el.setAttribute('aria-label',`Bed ${i+1}: `+(look==='empty'?'empty':look==='weed'?'a weed':look==='dead'?'a dead plant':`${PLANTS[b.p].name}, ${look}`));
    if(!force&&!RM){const svg=el.querySelector('.plant');svg&&svg.animate([{transform:'scale(.9,1.12)'},{transform:'scale(1.06,.95)',offset:.5},{transform:'none'}],{duration:380,easing:'cubic-bezier(.3,.7,.3,1)'})}
  }
  const live=b&&!b.weed&&!b.dead;
  el.classList.toggle('thirsty',!!(live&&b.w<.3));
  el.classList.toggle('dry',!!(live&&b.w<=0));
  el.classList.toggle('ripe',look==='bloom'||look==='fade');
  const bar=el.querySelector('.wbar i');bar.parentNode.hidden=!live;
  if(live)bar.style.width=Math.max(0,b.w*100)+'%';
}

/* ---------- the seed tray and the bucket ---------- */
function drawTray(){
  const ps=unlocked();if(!ps.includes(S.sel))S.sel=ps[0];
  tray.innerHTML=ps.map(p=>`<button class="seed${p===S.sel?' on':''}" data-p="${p}" aria-pressed="${p===S.sel}" aria-label="${PLANTS[p].name} seeds, ${money(PLANTS[p].seed)}">${packetSVG(p)}<b>${money(PLANTS[p].seed)}</b></button>`).join('');
  coachRedraw();
}
tray.addEventListener('click',e=>{
  const b=e.target.closest('.seed');if(!b||S.mode!=='play')return;
  S.sel=+b.dataset.p;snd('pick');drawTray();
  toast(`${PLANTS[S.sel].name}: grows in ${Math.round(PLANTS[S.sel].grow/mult.grow())} s, sells for ${money(PLANTS[S.sel].price)}`);
});
function drawBucket(){
  const have=PLANTS.map((P,p)=>S.bucket[p]?`<span class="chip" data-p="${p}">${flowerIcon(p)}<b>${S.bucket[p]}</b></span>`:'').join('');
  bucketEl.innerHTML=`<span class="blab">Bucket</span>${have||'<span class="bnone">Pick blooms to fill it</span>'}`;
  railCan();
}

/* ---------- a tap on a bed ---------- */
garden.addEventListener('click',e=>{
  const el=e.target.closest('.bed');if(!el||S.mode!=='play')return;
  const i=+el.dataset.b;
  if(el.classList.contains('locked')){snd('bad');toast('Dig more beds in the seed shop, between days');return}
  const b=S.garden[i],look=lookOf(b),r=el.getBoundingClientRect();
  if(look==='empty')plantBed(i,r);
  else if(look==='weed'||look==='dead'){S.garden[i]=null;snd('pull');haptic(15);puff(el);paintBed(i);coach('pull')}
  else if(look==='bloom'||look==='fade')pickBed(i,el);
  else if(b.w>.75){snd('bad');toast('Not thirsty yet');wiggle(el.querySelector('.plant'))}
  else{b.w=1;b.dry=0;snd('water');haptic(8);splash(r);paintBed(i);S.did.water=true;coach('water')}
});
function plantBed(i,r){
  const P=PLANTS[S.sel];let cost=P.seed;
  if(S.till<cost){
    // Never stuck: with nothing growing, nothing picked and no money, Nana's seed tin has a free daisy.
    const cheapest=Math.min(...unlocked().map(p=>PLANTS[p].seed));
    if(S.till<cheapest&&!growing()&&!bucketCount()){S.sel=0;cost=0;drawTray();toast("A daisy seed from Nana's old tin")}
    else{snd('bad');toast(`Not enough in the till for ${P.plural}`);wiggle($('.till'));return}
  }
  S.till-=cost;hud();
  S.garden[i]={p:S.sel,g:0,w:1,bl:0,dry:0};
  snd('plant');haptic(10);paintBed(i);S.did.plant=true;coach('plant',i);
  if(cost)floatText('-'+money(cost),r.left+r.width/2,r.top+r.height*.4,'small');
}
function pickBed(i,el){
  const b=S.garden[i];S.garden[i]=null;S.bucket[b.p]++;
  snd('snip');haptic(12);S.did.pick=true;
  flyIcon(b.p,el.getBoundingClientRect(),()=>{const c=bucketEl.querySelector(`[data-p="${b.p}"]`);return c?c.getBoundingClientRect():bucketEl.getBoundingClientRect()});
  paintBed(i);drawBucket();coach('pick');
}

/* ---------- growing, drinking, blooming and fading, every frame ---------- */
function tickGarden(dt){
  const g=mult.grow();
  for(let i=0;i<S.beds;i++){
    const b=S.garden[i];if(!b||b.weed||b.dead){continue}
    b.w=Math.max(0,b.w-dt/PLANTS[b.p].thirst);
    if(b.g<1){
      if(b.w>0){b.g=Math.min(1,b.g+dt*g/PLANTS[b.p].grow);if(b.g>=1){b.bl=bloomTime(b.p);snd('bloom');coach('bloom')}}
      else if((b.dry+=dt)>8&&!S.tut){b.dead=true;snd('wilt');bedFloat(i,'Dried out')}
    }else{
      if(!S.tut)b.bl-=dt*(b.w>0?1:2.2);
      if(b.bl<=0){b.dead=true;snd('wilt');bedFloat(i,'Went to seed')}
    }
    paintBed(i);
  }
  // weeds creep into empty beds from Tuesday on
  if(S.day>0&&S.clock>=S.weedAt){
    S.weedAt=S.clock+rnd(13,22);
    const free=[];for(let i=0;i<S.beds;i++)if(!S.garden[i])free.push(i);
    if(free.length>1){const i=pick(free);S.garden[i]={weed:true};paintBed(i)}
  }
  if(S.up.sprinkler&&S.clock>=S.sprinkleAt){
    S.sprinkleAt=S.clock+12;let any=false;
    S.garden.forEach(b=>{if(b&&!b.weed&&!b.dead){b.w=1;b.dry=0;any=true}});
    if(any){snd('sprinkle');splash(garden.getBoundingClientRect(),18)}
  }
}
function bedFloat(i,txt){const el=garden.querySelector(`[data-b="${i}"]`);if(!el)return;const r=el.getBoundingClientRect();floatText(txt,r.left+r.width/2,r.top+r.height*.35,'small')}

/* ---------- little effects: water drops, a puff of soil, a flower flying to the bucket or a customer ---------- */
function splash(r,n=7){
  if(RM)return;
  for(let k=0;k<n;k++){
    const d=document.createElement('i');d.className='drop';fx.appendChild(d);
    const x=r.left+r.width*(.2+Math.random()*.6),y=r.top+r.height*(n>10?Math.random()*.6:.1);
    d.style.left=x+'px';d.style.top=y+'px';
    d.animate([{transform:'translate(0,-20px) scale(.6)',opacity:0},{transform:'translate(0,0) scale(1)',opacity:1,offset:.3},{transform:`translate(${(Math.random()-.5)*16}px,${r.height*.45}px) scale(.8,1.3)`,opacity:0}],
      {duration:520+Math.random()*260,delay:k*40,easing:'cubic-bezier(.5,0,.9,.6)',fill:'backwards'}).onfinish=()=>d.remove();
  }
}
function puff(el){
  if(RM)return;const r=el.getBoundingClientRect();
  for(let k=0;k<5;k++){
    const d=document.createElement('i');d.className='puff';fx.appendChild(d);
    d.style.left=(r.left+r.width/2)+'px';d.style.top=(r.top+r.height*.8)+'px';
    const a=Math.PI*(1.1+k*.2);
    d.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*30}px),calc(-50% + ${Math.sin(a)*26}px)) scale(1)`,opacity:0}],{duration:420,easing:'ease-out'}).onfinish=()=>d.remove();
  }
}
// to is a function so the target is measured after the bucket or rail has redrawn
function flyIcon(p,from,to,done){
  const el=document.createElement('div');el.className='fly';el.innerHTML=flowerIcon(p);fx.appendChild(el);
  const x0=from.left+from.width/2,y0=from.top+from.height*.35;
  requestAnimationFrame(()=>{
    const t=to(),x1=t.left+t.width/2,y1=t.top+t.height/2;
    el.style.left=x0+'px';el.style.top=y0+'px';
    if(RM){el.remove();done&&done();return}
    el.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(calc(-50% + ${(x1-x0)*.5}px),calc(-50% + ${(y1-y0)*.5-50}px)) scale(1.35) rotate(-12deg)`,offset:.45},
      {transform:`translate(calc(-50% + ${x1-x0}px),calc(-50% + ${y1-y0}px)) scale(.7)`}],{duration:520,easing:'cubic-bezier(.4,0,.6,1)'}).onfinish=()=>{el.remove();done&&done()};
  });
}
