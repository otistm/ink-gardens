/* Ink Gardens: the day's flow and every screen. Title, the morning intro, the shift itself, closing time, the seed
   shop between days, the win and lose cards, pause. The week in progress is saved each morning (inkgardens-run). */
"use strict";

/* ---------- a day in the shop ---------- */
function newWeek(){
  restore({v:1,day:0,loyalty:START.loyalty,till:START.till,earned:0,beds:START.beds,up:{},sel:0,
    garden:Array.from({length:BEDS},(_,i)=>{const s=START.garden.find(x=>x.b===i);return s?{p:s.p,g:s.g,w:1,bl:0,dry:0}:null})});
}
function startShift(){
  const D=DAYS[S.day];
  S.slots=Array(D.rail).fill(null);S.queue=[];S.spawned=0;S.nextAt=D.first;S.clock=0;
  S.served=0;S.walked=0;S.dayTake=0;S.weedAt=rnd(10,16);S.sprinkleAt=12;S.did={};
  S.seen.clear();S.stamped.clear();
  // morning dew: everything starts the day with a full drink
  S.garden.forEach(b=>{if(b&&!b.weed&&!b.dead){b.w=1;b.dry=0}});
  $('#hint').hidden=S.day>0;
  hide();drawGarden();drawTray();drawBucket();drawRail();hud();
  S.mode='play';last=performance.now();
}
function endShift(){if(S.mode!=='play')return;S.mode='ending';setTimeout(endDay,800)}
// Monday's hints: one line above the seed tray, naming the next useful thing to do until you've done each once.
function hints(){
  if(S.day>0||S.tut)return;
  const live=S.garden.filter(b=>b&&!b.weed&&!b.dead);let h='';
  if(!S.did.water&&live.some(b=>b.g<1&&b.w<.3))h='A plant is thirsty. Tap it to water it.';
  else if(!S.did.pick&&live.some(b=>b.g>=1))h='Something is in bloom. Tap it to pick it.';
  else if(!S.did.sell&&liveTickets().some(canServe))h='The bucket has their order. Tap the customer to sell it.';
  else if(!S.did.plant&&S.garden.slice(0,S.beds).some(b=>!b))h='Pick a seed below, then tap an empty bed to plant it.';
  const el=$('#hint');if(el.textContent!==h)el.textContent=h;
}

/* ---------- screens ---------- */
function show(html){scr.innerHTML=`<div class="sc">${html}</div>`;scr.classList.add('show');scr.scrollTop=0;const b=scr.querySelector('.btn');b&&b.focus({preventScroll:true})}
function hide(){scr.classList.remove('show');scr.innerHTML=''}
function meterHTML(){return `<div class="meter bigmeter"><div class="mlab"><span>Ink Gardens ${S.loyalty}%</span><span>Everbloom ${100-S.loyalty}%</span></div><div class="mbar"><i style="display:block;height:100%;width:${S.loyalty}%;background:var(--paper);border-right:2px solid var(--ink)"></i></div></div>`}
function recordBest(won){
  const B=BEST.best||{};
  const better=won?(!B.won||S.earned>B.earned):(!B.won&&(B.day==null||S.day>B.day||(S.day===B.day&&S.earned>B.earned)));
  if(better){BEST.best={day:S.day,earned:S.earned,till:S.till,won:!!(won||B.won)};saveBest()}
}
function bestLine(){
  const B=BEST.best;
  if(!B)return '';
  if(B.won)return `Best: won the week, ${money(B.earned)} in sales`;
  return `Best: reached ${DAYNAMES[B.day]}, ${money(B.earned)} in sales`;
}
function titleScreen(){
  leaveTutorial();S.mode='menu';const R=loadRun();
  // a brand-new player is offered the soft opening first; everyone else can replay it from a quiet button
  const fresh=!R&&!BEST.tutDone&&!BEST.best;
  show(`<div class="logo">${bedSVG(0,'bloom',2.4)}</div>
    <h1>Ink Gardens</h1>
    <p class="tag">Grow flowers. Sell them fresh. Beat the plastic place across the street.</p>
    ${R?`<button class="btn" data-act="carry">Carry on: ${DAYNAMES[R.day]}</button><button class="btn quiet" data-act="new">Start a new week</button>`
      :fresh?`<button class="btn" data-act="tut">Soft opening</button><p class="kick soft">A short, calm evening with Nana to learn the ropes.</p><button class="btn quiet" data-act="new">Skip to Monday</button>`
      :`<button class="btn" data-act="new">Open the shop</button>`}
    ${fresh?'':`<button class="btn quiet" data-act="tut">Play the soft opening</button>`}
    <p class="best">${bestLine()}</p>
    <p class="ver">Version ${VERSION}${ONLINE?' · ':''}${feedbackLink()}</p>`);
  if(!RM){const looks=['seed','sprout','bud','bloom'],box=scr.querySelector('.logo');let k=0;
    box.innerHTML=bedSVG(0,'seed',2.4);
    const grow=()=>{if(!box.isConnected)return;k++;if(k<looks.length){box.innerHTML=bedSVG(0,looks[k],2.4);box.firstChild.animate([{transform:'scale(.9,1.14)'},{transform:'scale(1.05,.96)',offset:.55},{transform:'none'}],{duration:420,easing:'cubic-bezier(.3,.7,.3,1)'});setTimeout(grow,420)}};
    setTimeout(grow,420)}
}
function introScreen(){
  S.mode='intro';const D=DAYS[S.day];
  S.morning=snapshot();saveRun(S.morning);
  const fresh=D.add.map(p=>`<div class="newp">${packetSVG(p)}<div><b>${PLANTS[p].name}</b><span>${PLANT_NOTE[p]}</span><small>Seed ${money(PLANTS[p].seed)} · sells for ${money(PLANTS[p].price)}</small></div></div>`).join('');
  show(`<p class="kick">Day ${S.day+1} of ${DAYNAMES.length}</p><h1>${DAYNAMES[S.day]}</h1>
    <p class="story">${D.story}</p>
    <div class="fresh"><p>${S.day===0?'In the seed tray':'New in the seed tray'}</p>${fresh}</div>
    ${meterHTML()}
    <button class="btn" data-act="start">Open the shop</button>
    ${S.day===0?`<div class="howto"><h2>How to run the shop</h2>
      <p><b>Plant.</b> Pick a seed packet at the bottom, then tap an empty bed. Seeds cost a little from the till.</p>
      <p><b>Water.</b> Each plant has a water bar. Tap a plant when it gets low. Dry too long and it dies.</p>
      <p><b>Pick.</b> Tap a flower in bloom to cut it into the bucket. Leave it too long and it fades.</p>
      <p><b>Sell.</b> Customers wait at the top. When the bucket holds their order, tap them. Quick service tips more.</p>
      <p>Anyone who waits too long walks over to Everbloom, and the street tips their way. Lose the whole street and the day is over.</p></div>`:''}`);
}
function endDay(){
  const lastDay=S.day===DAYNAMES.length-1;
  recordBest(lastDay);S.mode='end';
  if(lastDay){
    saveRun(null);
    show(`<p class="kick">Sunday evening</p><h1>The street is yours</h1>
      <p class="story">On Monday the sign at Everbloom said "Closing down: everything must go". Nobody wanted it. They were all at your door, smelling the roses.</p>
      <div class="stats"><div><b>${money(S.earned)}</b><span>sold this week</span></div><div><b>${S.loyalty}%</b><span>of the street</span></div></div>
      <button class="btn" data-act="new">Grow another week</button><button class="btn quiet" data-act="menu">Back to the menu</button>
      <p class="ver">${feedbackLink()}</p>`);
    return;
  }
  show(`<p class="kick">${DAYNAMES[S.day]}, closing time</p><h1>Shop's shut</h1>
    <div class="stats"><div><b>${S.served}</b><span>served</span></div><div><b>${S.walked}</b><span>went to Everbloom</span></div><div><b>${money(S.dayTake)}</b><span>taken today</span></div></div>
    ${meterHTML()}
    <p class="story">Whatever's growing will keep overnight, and cut flowers stay fresh in the bucket.</p>
    <button class="btn" data-act="shop">To the seed shop</button>
    <p class="ver">${feedbackLink()}</p>`);
}
function shopScreen(){
  S.mode='shop';const next=S.beds<BEDS?S.beds:-1;
  const row=(act,name,does,cost,owned,extra='')=>`<div class="buy${owned?' owned':''}"><div><b>${name}</b><span>${does}</span></div>
    ${owned?'<em>Yours</em>':`<button class="price" data-act="${act}"${extra}${S.till<cost?' disabled':''}>${money(cost)}</button>`}</div>`;
  show(`<p class="kick">Evening, before ${DAYNAMES[S.day+1]}</p><h1>Seed shop</h1>
    <p class="till-big">In the till: <b>${money(S.till)}</b></p>
    <div class="buys">
      ${next>=0?row('dig',`Dig bed ${next+1}`,`More room to grow. You have ${S.beds} of ${BEDS}.`,BED_COST[next],false)
        :`<div class="buy owned"><div><b>Every bed dug</b><span>The whole garden is yours.</span></div></div>`}
      ${UPGRADES.map(u=>row('up',u.name,u.does,u.cost,!!S.up[u.k],` data-k="${u.k}"`)).join('')}
    </div>
    <button class="btn" data-act="next">Open on ${DAYNAMES[S.day+1]}</button>`);
}
function loseScreen(){
  recordBest(false);S.mode='end';
  show(`<p class="kick">${DAYNAMES[S.day]}</p><h1>Everbloom took the street</h1>
    <p class="story">The queue at Everbloom went round the block. You turn the sign to Closed and water the garden in the quiet.</p>
    <div class="stats"><div><b>${S.served}</b><span>served</span></div><div><b>${S.walked}</b><span>walked out</span></div></div>
    <button class="btn" data-act="retry">Try ${DAYNAMES[S.day]} again</button><button class="btn quiet" data-act="menu">Back to the menu</button>
    <p class="ver">${feedbackLink()}</p>`);
}
function pauseScreen(){
  if(S.mode!=='play')return;S.mode='paused';
  show(`<h1>Paused</h1><p class="story">The garden waits for you. The customers do too, for now.</p>
    <button class="btn" data-act="resume">Resume</button>
    <button class="btn quiet" data-act="retry">Restart ${S.tut?'the soft opening':DAYNAMES[S.day]}</button>
    <button class="btn quiet" data-act="sound">Sound: ${S.muted?'off':'on'}</button>
    <button class="btn quiet" data-act="menu">Quit to the menu</button>
    <p class="ver">${feedbackLink()}</p>`);
}
scr.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;snd('pick');
  if(a==='new'){newWeek();introScreen()}
  else if(a==='tut')startTutorial();
  else if(a==='carry'){const R=loadRun();if(R){restore(R);introScreen()}else{newWeek();introScreen()}}
  else if(a==='start')startShift();
  else if(a==='shop')shopScreen();
  else if(a==='dig'){S.till-=BED_COST[S.beds];S.beds++;snd('coin');shopScreen()}
  else if(a==='up'){const u=UPGRADES.find(x=>x.k===b.dataset.k);if(u&&!S.up[u.k]&&S.till>=u.cost){S.till-=u.cost;S.up[u.k]=true;snd('coin');shopScreen()}}
  else if(a==='next'){S.day++;introScreen()}
  else if(a==='retry'){if(S.tut){hideCoach();startTutorial()}else{restore(S.morning);startShift()}}
  else if(a==='resume'){hide();S.mode='play';last=performance.now();coachRedraw()}
  else if(a==='sound'){S.muted=!S.muted;BEST.muted=S.muted;saveBest();b.textContent='Sound: '+(S.muted?'off':'on')}
  else if(a==='menu')titleScreen();
  else if(a==='feedback')showFeedback();
});

/* ---------- loop and startup ---------- */
let last=performance.now(),hintT=0;
function loop(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(S.mode==='play'){S.clock+=dt;tickGarden(dt);tickShop(dt);if((hintT+=dt)>.4){hintT=0;hints();coach('tick')}}
  requestAnimationFrame(loop);
}
function start(){
  $('#pauseBtn').addEventListener('click',pauseScreen);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseScreen()});
  newWeek();S.slots=[null,null];drawGarden();drawTray();drawBucket();drawRail();hud();
  requestAnimationFrame(loop);
  titleScreen();
}
