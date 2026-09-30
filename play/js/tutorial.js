/* Ink Gardens: the soft opening. A short guided evening before Monday with Nana as coach: plant, water, pick, sell,
   pull a weed, then a bigger order. No clock pressure: customers wait forever, plants never die and blooms never fade.
   The game reports what just happened with coach(event): plant, water, bloom, pick, sell, pull. S.tut is {i, on}. */
"use strict";
/* Each step: when (the event that shows it; none = right after the previous one), until (the event that moves on,
   or 'next' / 'finish' for explanations closed with the x), target (what to ring), pos (top or bottom of the screen),
   show (something to set up as the step appears), ready (true once the step is done anyway, checked a few times a second,
   so doing things out of order never leaves the tutorial stuck). */
const noneWaiting=()=>!S.queue.length&&!liveTickets().length;
const TUT=[
  {until:'next',pos:'top',text:"Evening, love. Before Everbloom's big week, let's have a soft opening. Just friends and neighbours, and nobody in a hurry."},
  {until:'plant',pos:'top',target:'.garden',ready:()=>S.tutBed>=0,text:"These are your beds. The daisy packet is picked below. Tap an empty bed to plant one."},
  {when:'plant',until:'water',pos:'top',target:'.bed[data-tut]',show:()=>{const b=S.garden[S.tutBed];if(b){b.w=.2;paintBed(S.tutBed)}},
    text:"See the bar on top of the bed? That's its water. It only grows while it has some. Tap the plant to water it."},
  {until:'bloom',pos:'top',target:'.bed[data-tut]',ready:()=>S.garden.some(b=>b&&!b.weed&&!b.dead&&b.g>=1)||bucketCount()>0,text:"Now we wait. Keep it watered and it goes seed, sprout, bud, bloom. Daisies are quick."},
  {when:'bloom',until:'pick',pos:'top',target:'.bed.ripe',ready:()=>bucketCount()>0,text:"It's in bloom. Tap it to cut it into the bucket. Leave a bloom too long on a real day and it fades."},
  {when:'pick',until:'sell',pos:'bottom',target:'.ticket',ready:noneWaiting,show:()=>tutCustomer('Mrs Pell',[0]),
    text:"Here's Mrs Pell from next door. When the bucket holds someone's order, their ticket bobs. Tap it to sell."},
  {when:'sell',until:'next',pos:'bottom',target:'.meter',text:"Every happy customer wins you a bit of the street. On a real day, anyone kept waiting too long goes to Everbloom."},
  {until:'pull',pos:'top',target:'.bed[data-look="weed"]',ready:()=>!S.garden.some(b=>b&&b.weed),show:()=>{const i=S.garden.findIndex((b,k)=>k<S.beds&&!b);if(i>=0){S.garden[i]={weed:true};paintBed(i)}},
    text:"Oh, a weed. They creep into empty beds. Tap it to pull it out."},
  {when:'pull',until:'next',pos:'bottom',target:'.ticket',show:()=>tutCustomer('Old Tom',[0,1]),
    text:"Old Tom wants a daisy and a tulip. You'll need to grow them both. You can grow lots of things at once."},
  {until:'sell',pos:'top',target:'.seed[data-p="1"]',ready:noneWaiting,text:"Tap the tulip packet, then plant it. Tulips are slower but sell for more. Water, pick, then sell to Tom."},
  {when:'sell',until:'finish',pos:'top',text:"That's all there is to it. Tomorrow is Monday and Everbloom opens its doors. Keep them coming to us, love."},
];
function tutCustomer(name,want){
  const t=makeCustomer();Object.assign(t,{name,want:want.slice(),why:'soft opening',look:name==='Old Tom'?3:2});
  S.queue.push(t);
}
function startTutorial(){
  newWeek();
  // a clean slate: bare beds, and the daisy packet picked
  S.garden=S.garden.map(()=>null);S.sel=0;S.tutBed=-1;
  S.tut={i:0,on:false};
  startShift();S.spawned=DAYS[0].n;$('#hint').hidden=true;
  setTimeout(()=>coach('start'),500);
}
function finishTutorial(done){
  hideCoach();S.tut=null;
  if(done!==false){BEST.tutDone=true;saveBest()}
  newWeek();introScreen();
}
function leaveTutorial(){hideCoach();S.tut=null}

/* ---------- Nana's bubble ---------- */
function hideCoach(){const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'))}
// How long a tip stays up before its ring turns into the close button: longer tips get more reading time.
const readMs=text=>Math.max(2600,Math.min(7000,1400+text.split(/\s+/).length*190));
const XSVG='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>';
// The bubble lets taps through, so it never blocks the garden underneath; only its own buttons take taps.
function bubble(text,o){
  hideCoach();
  const dur=RM?1200:readMs(text);
  const c=document.createElement('div');c.id='coach';c.className='coach calm at-'+(o.pos||'top');c.setAttribute('role','status');c.setAttribute('aria-live','polite');
  c.innerHTML=`${faceSVG(2)}<div class="coach-body"><small>${o.label}</small><p>${text}</p><div class="coach-btns">${o.links||''}</div></div>
    <span class="ctimer" style="--dur:${dur}ms" aria-hidden="true"><svg viewBox="0 0 28 28"><circle class="track" cx="14" cy="14" r="11"/><circle class="prog" cx="14" cy="14" r="11" pathLength="100"/></svg></span>`;
  document.body.appendChild(c);
  if(o.pos==='bottom')c.style.bottom=`calc(${tray.offsetHeight+18}px + env(safe-area-inset-bottom,0px))`;
  highlight(o.target);
  c._t=setTimeout(()=>{if(!c.isConnected)return;
    const t=c.querySelector('.ctimer'),x=document.createElement('button');
    x.className='cx';x.setAttribute('aria-label','Close tip');x.innerHTML=XSVG;x.onclick=o.onClose;
    t.classList.add('out');setTimeout(()=>t.isConnected&&t.replaceWith(x),180)},dur);
  return c;
}
function highlight(target){
  document.querySelectorAll('.coach-hi').forEach(e=>e.classList.remove('coach-hi'));
  if(!target)return;const el=document.querySelector(target);if(el)el.classList.add('coach-hi');
}
function showStep(){
  const T=S.tut,st=TUT[T.i];T.on=true;
  st.show&&st.show();
  const u=st.until;
  // closing: explanations move on, the last one finishes, and action steps just tuck the tip away until you do the thing
  const onClose=u==='finish'?()=>{snd('pick');finishTutorial()}:u==='next'?()=>{snd('pick');advance()}:()=>{const c=document.getElementById('coach');if(c){clearTimeout(c._t);c.remove()}};
  const c=bubble(st.text,{pos:st.pos,target:st.target,label:`Nana · ${T.i+1} of ${TUT.length}`,onClose,
    links:u==='finish'?'':`<button class="linkbtn" data-c="skip">Skip to Monday</button>`});
  const sk=c.querySelector('[data-c=skip]');if(sk)sk.onclick=()=>{snd('pick');finishTutorial()};
  // the ring stays on its target as the screen redraws
  requestAnimationFrame(()=>highlight(st.target));
}
function advance(ev){
  const T=S.tut;hideCoach();T.i++;T.on=false;const nx=TUT[T.i];
  if(nx&&(!nx.when||nx.when===ev))setTimeout(()=>{if(S.tut&&!S.tut.on&&TUT[S.tut.i]===nx)showStep()},350);
}
function coach(ev,bed){
  if(!S.tut)return;
  if(ev==='plant'&&S.tutBed<0){S.tutBed=bed;const el=garden.querySelector(`[data-b="${bed}"]`);el&&el.setAttribute('data-tut','')}
  const T=S.tut,st=TUT[T.i];if(!st)return;
  if(T.on){if(st.until===ev||(ev==='tick'&&st.ready&&st.ready()))advance(st.until);return}
  if(ev!=='tick'&&(!st.when||st.when===ev))showStep();
}
// Redraws replace the beds and tickets, so put the ring and the first-bed mark back after each one.
function coachRedraw(){
  if(!S.tut)return;
  if(S.tutBed>=0){const el=garden.querySelector(`[data-b="${S.tutBed}"]`);el&&el.setAttribute('data-tut','')}
  const st=TUT[S.tut.i];if(S.tut.on&&st&&st.target)highlight(st.target);
}
