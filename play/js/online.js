/* Ink Gardens: online services through Supabase (feedback). Connects only when a note or crash report is sent.
   Table garden_feedback (see supabase/01-garden-feedback.sql). Does nothing when config.js has no keys. */
"use strict";
const ONLINE=!!(SUPABASE_URL&&SUPABASE_ANON_KEY);
const NET={sb:null,uid:null,err:'',ready:null};
function connect(){
  if(NET.ready)return NET.ready;
  if(!ONLINE){NET.err='online play is not set up';return NET.ready=Promise.resolve()}
  NET.ready=(async()=>{try{
    const{createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'inkgardens-auth'}});
    let{data:{session}}=await sb.auth.getSession();
    if(!session){const r=await sb.auth.signInAnonymously();if(r.error)throw r.error;session=r.data.session}
    NET.sb=sb;NET.uid=session.user.id;
  }catch(e){NET.err='could not reach the online service';console.warn('Online unavailable',e)}})();
  // never let a stalled network call leave a note "sending" forever
  return NET.ready=Promise.race([NET.ready,new Promise(r=>setTimeout(()=>{if(!NET.sb&&!NET.err)NET.err='timed out going online';r()},15000))]);
}
async function sendNote(kind,note){
  await connect();
  if(!NET.sb||!NET.uid)return NET.err||'online play is not connected';
  try{const{error}=await NET.sb.from('garden_feedback').insert({player_id:NET.uid,version:VERSION,kind,note,context:feedbackContext()});
    if(!error)return '';
    return /does not exist|PGRST205|42P01|schema cache/i.test((error.message||'')+(error.code||''))?'the feedback table is not set up yet':error.message||error.code;
  }catch(e){return e.message||String(e)}
}

/* ---------- feedback: testers send notes straight into the garden_feedback table ---------- */
const FB_KINDS=['Bug','Idea','Too hard','Too easy','Other'];
function feedbackContext(){
  const live=S.slots?S.slots.filter(t=>t&&!t.done&&!t.gone):[];
  return{version:VERSION,day:DAYNAMES[S.day]||'',mode:S.fbFrom||S.mode,street:S.loyalty,till:S.till,earned:S.earned,served:S.served,walked:S.walked,
    shift:S.clock?Math.round(S.clock):0,beds:S.beds,upgrades:Object.keys(S.up||{}).join(','),
    garden:(S.garden||[]).map(b=>!b?'-':b.weed?'weed':b.dead?'dead':PLANTS[b.p].k+':'+(b.g<1?Math.round(b.g*100)+'%':'bloom')).join(' '),
    bucket:(S.bucket||[]).map((n,i)=>n?PLANTS[i].k+'×'+n:'').filter(Boolean).join(', '),
    customers:live.map(t=>`${t.name}: ${t.want.map(p=>PLANTS[p].k).join('+')}`).join('; '),
    screen:`${innerWidth}x${innerHeight}`,device:navigator.userAgent.slice(0,160),
    standalone:!!(matchMedia('(display-mode: standalone)').matches||navigator.standalone),best:BEST.best||null}
}
const feedbackLink=()=>ONLINE?`<button class="linkbtn" data-act="feedback">Send feedback</button>`:'';
let fbSeq=0;
// Opens over whatever screen is showing, and Back puts that screen back exactly as it was.
function showFeedback(){
  const prev=scr.innerHTML,my=++fbSeq;S.fbFrom=S.mode;S.mode='feedback';let kind=FB_KINDS[0];
  show(`<h1>Feedback</h1><p class="story">Tell Otis what happened or what you'd change. Your version and where you are in the week get attached automatically.</p>
    <div class="fbk" role="radiogroup" aria-label="Kind of feedback">${FB_KINDS.map((k,i)=>`<button type="button" role="radio" class="fbc${i?'':' on'}" aria-checked="${!i}">${k}</button>`).join('')}</div>
    <textarea id="fbNote" maxlength="1000" rows="5" aria-label="Your note" placeholder="What happened? Which day? What did you expect?"></textarea>
    <p class="fbmsg" id="fbMsg" role="status"></p>
    <button class="btn" id="fbSend">Send</button><button class="btn quiet" id="fbBack">Back</button>`);
  connect();
  const note=$('#fbNote'),msg=$('#fbMsg'),send=$('#fbSend');
  setTimeout(()=>note.focus({preventScroll:true}),120);
  const back=()=>{snd('pick');scr.innerHTML=prev;S.mode=S.fbFrom;S.fbFrom=null;scr.scrollTop=0};
  scr.querySelectorAll('.fbc').forEach(b=>b.onclick=()=>{snd('pick');scr.querySelectorAll('.fbc').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false')});b.classList.add('on');b.setAttribute('aria-checked','true');kind=b.textContent});
  $('#fbBack').onclick=back;
  send.onclick=async()=>{
    const text=note.value.trim();
    if(!text){msg.textContent='Write a quick note first.';note.focus();return}
    send.disabled=true;msg.textContent='Sending…';
    const why=await sendNote(kind,text);
    if(S.mode!=='feedback'||my!==fbSeq)return; // they left while it was sending
    if(!why){snd('serve');show(`<h1>Thank you</h1><p class="story">Your note is on its way to Otis.</p><button class="btn" id="fbOk">Back</button>`);$('#fbOk').onclick=back}
    else{send.disabled=false;snd('bad');msg.textContent=`Couldn't send (${why}). Your note is still here, so you can try again or copy it.`}
  };
}

/* ---------- crash notes: unexpected errors go quietly to the same table (kind "Crash"), at most three a visit ---------- */
let crashes=0;
function reportCrash(where,err){
  if(!ONLINE||crashes>=3||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;
  crashes++;
  const m=err&&(err.stack||err.message)||String(err);
  sendNote('Crash',`${where}: ${m}`.slice(0,1000)).catch(()=>{});
}
addEventListener('error',e=>reportCrash('error',e.error||e.message));
addEventListener('unhandledrejection',e=>reportCrash('promise',e.reason));
