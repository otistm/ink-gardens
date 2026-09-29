/* Ink Gardens: the shop counter. Customers arrive on the rail (S.slots) with an order of stems and a patience bar.
   Tap one when the bucket holds their order to sell it. Too slow, and they cross the street to Everbloom. */
"use strict";
let TID=0;
function makeCustomer(){
  const D=DAYS[S.day],pool=unlocked();
  // lean toward what's growing or already picked, so orders feel fair, but keep some surprises
  const weight=p=>1+(S.bucket[p]?3:0)+S.garden.filter(b=>b&&b.p===p&&!b.dead&&!b.weed).length*2;
  const want=[],n=rnd(D.items[0],D.items[1]);
  for(let i=0;i<n;i++){
    // Sunday's judges like the new orchid; everyone else likes what they know
    let tot=0;const w=pool.map(p=>{const x=weight(p)*(p===D.add[D.add.length-1]&&S.day>0?1.6:1);tot+=x;return x});
    let r=Math.random()*tot,k=0;while(r>w[k])r-=w[k++];
    want.push(pool[Math.min(k,pool.length-1)]);
  }
  want.sort((a,b)=>a-b);
  const max=D.wait*(S.up.awning?1.25:1)+n*4;
  return{id:++TID,name:pick(CUSTOMERS),look:rnd(0,5),why:pick(WHY),want,time:max,max,tilt:(Math.random()*3-1.5).toFixed(2)};
}
const counts=want=>want.reduce((m,p)=>(m[p]=(m[p]||0)+1,m),{});
const canServe=t=>Object.entries(counts(t.want)).every(([p,n])=>S.bucket[p]>=n);
function orderText(t){return Object.entries(counts(t.want)).map(([p,n])=>n>1?`${n} ${PLANTS[p].plural}`:`a ${PLANTS[p].name.toLowerCase()}`).join(', ')}
function mood(t){const f=t.time/t.max;return f>.55?'calm':f>.25?'itchy':'mad'}

/* ---------- the rail ---------- */
function ticketHTML(t){
  if(!t)return `<div class="slot-empty"></div>`;
  const c=counts(t.want),st=t.done?' done':t.gone?' gone':' '+mood(t);
  const items=Object.entries(c).map(([p,n])=>`<span class="want${S.bucket[p]>=n?' have':''}" data-p="${p}">${flowerIcon(+p)}${n>1?`<b>×${n}</b>`:''}</span>`).join('');
  const stamp=t.done?`<div class="stamp"><span>Sold<br><em>${'★'.repeat(t.stars)}${'☆'.repeat(3-t.stars)}</em></span></div>`:t.gone?`<div class="stamp"><span>Went to<br>Everbloom</span></div>`:'';
  return `<button class="ticket${st}" data-tid="${t.id}" style="--tilt:${t.tilt}deg" aria-label="${t.name} wants ${orderText(t)}">
    <div class="th">${faceSVG(t.look)}<div><b>${t.name}</b><small>${t.why}</small></div></div>
    <div class="wants">${items}</div>
    <div class="pbar"><i style="width:${Math.max(0,t.time/t.max*100)}%"></i></div>${stamp}</button>`;
}
function drawRail(){
  rail.style.setProperty('--rails',S.slots.length);
  rail.innerHTML=S.slots.map(ticketHTML).join('');
  rail.querySelectorAll('.ticket').forEach(el=>{
    const id=+el.dataset.tid;
    if(!S.seen.has(id)){S.seen.add(id);if(!RM)el.animate([{transform:'translateY(-70px) rotate(var(--tilt))',opacity:0},{transform:'translateY(6px) rotate(var(--tilt)) scaleY(.94)',opacity:1,offset:.7},{transform:'rotate(var(--tilt))'}],{duration:420,easing:'cubic-bezier(.3,.8,.4,1)'})}
    const st=el.querySelector('.stamp span');
    if(st&&!S.stamped.has(id)){S.stamped.add(id);if(!RM)st.animate([{transform:'scale(2.2) rotate(-20deg)',opacity:0},{transform:'scale(.92) rotate(-11deg)',opacity:1,offset:.7},{transform:getComputedStyle(st).transform}],{duration:300,easing:'ease-in'})}
  });
  railCan();
}
// mark who can be served from the bucket right now, and which of their flowers are ready
function railCan(){
  S.slots.forEach(t=>{
    if(!t||t.done||t.gone)return;const el=rail.querySelector(`[data-tid="${t.id}"]`);if(!el)return;
    el.classList.toggle('can',canServe(t));
    const c=counts(t.want);el.querySelectorAll('.want').forEach(w=>w.classList.toggle('have',S.bucket[w.dataset.p]>=c[w.dataset.p]));
  });
}
// cheap per-frame update: patience bars and faces, without rebuilding the rail
function railBars(){
  S.slots.forEach(t=>{
    if(!t||t.done||t.gone)return;const el=rail.querySelector(`[data-tid="${t.id}"]`);if(!el)return;
    el.querySelector('.pbar i').style.width=Math.max(0,t.time/t.max*100)+'%';
    const m=mood(t);if(!el.classList.contains(m)){el.classList.remove('calm','itchy','mad');el.classList.add(m)}
  });
}
const liveTickets=()=>S.slots.filter(t=>t&&!t.done&&!t.gone);

rail.addEventListener('click',e=>{
  const el=e.target.closest('.ticket');if(!el||S.mode!=='play')return;
  const t=S.slots.find(x=>x&&x.id===+el.dataset.tid);if(!t||t.done||t.gone)return;
  if(!canServe(t)){
    const c=counts(t.want),miss=Object.entries(c).filter(([p,n])=>S.bucket[p]<n).map(([p,n])=>{const k=n-S.bucket[p];return k>1?`${k} more ${PLANTS[p].plural}`:`a ${PLANTS[p].name.toLowerCase()}`});
    snd('bad');wiggle(el);toast(`Still need ${miss.join(' and ')}`);return;
  }
  sell(t,el);
});
function sell(t,el){
  const from=bucketEl.getBoundingClientRect();
  t.want.forEach((p,i)=>{S.bucket[p]--;setTimeout(()=>flyIcon(p,from,()=>el.getBoundingClientRect()),i*70)});
  const f=t.time/t.max,stars=f>.55?3:f>.25?2:1;
  const pay=t.want.reduce((a,p)=>a+PLANTS[p].price,0)+[0,0,1,3][stars];
  t.done=true;t.stars=stars;t.removeAt=S.clock+1.1;
  S.till+=pay;S.earned+=pay;S.dayTake+=pay;S.served++;S.did.sell=true;
  drawBucket();drawRail();hud();
  const r=el.getBoundingClientRect();floatText('+'+money(pay),r.left+r.width/2,r.top+r.height*.35);
  addLoyalty(1+stars);snd('sell');setTimeout(()=>snd('coin'),200);haptic([12,40,12]);
}
function walkout(t){
  t.gone=true;t.removeAt=S.clock+1.3;S.walked++;
  addLoyalty(-14);snd('walk');haptic(60);drawRail();
  if(S.loyalty<=0&&S.mode==='play'){S.mode='lost';setTimeout(loseScreen,1200)}
}
function tickShop(dt){
  const D=DAYS[S.day];
  if(S.spawned<D.n&&S.clock>=S.nextAt){S.queue.push(makeCustomer());S.spawned++;S.nextAt=S.clock+D.gap*(.8+Math.random()*.4)}
  let ch=false;
  S.slots.forEach((t,i)=>{if(t&&t.removeAt!=null&&S.clock>=t.removeAt){S.slots[i]=null;ch=true}});
  while(S.queue.length){const i=S.slots.indexOf(null);if(i<0)break;S.slots[i]=S.queue.shift();ch=true;snd('ding')}
  S.slots.forEach(t=>{if(t&&!t.done&&!t.gone){t.time-=dt;if(t.time<=0)walkout(t)}});
  if(ch)drawRail();else railBars();
  if(S.mode==='play'&&S.spawned>=D.n&&!S.queue.length&&S.slots.every(t=>!t))endShift();
}

/* ---------- street meter, till, floating text, toast ---------- */
function hud(){$('#till').textContent=money(S.till);$('#mfill').style.width=S.loyalty+'%'}
function addLoyalty(d){
  S.loyalty=Math.max(0,Math.min(100,S.loyalty+d));hud();
  const r=$('.mbar').getBoundingClientRect();floatText((d>0?'+':'')+d,r.left+r.width*S.loyalty/100,r.bottom+14,'small');
}
function floatText(txt,x,y,cls=''){
  const el=document.createElement('div');el.className='float '+cls;el.textContent=txt;
  el.style.left=x+'px';el.style.top=y+'px';fx.appendChild(el);
  el.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,-90%) scale(1.15)',opacity:1,offset:.25},{transform:'translate(-50%,-190%) scale(1)',opacity:0}],{duration:1000,easing:'ease-out'}).onfinish=()=>el.remove();
}
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),1600)}
function wiggle(el){if(!el||RM)return;el.animate([{transform:'translateX(0)'},{transform:'translateX(-5px) rotate(-2deg)'},{transform:'translateX(5px) rotate(2deg)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:260})}
