/* Ink Gardens: procedural sound effects. */
"use strict";
let AC=null;
function tone(f,d,type,v,when=0,slide){
  const t0=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+d);
  g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.0008,t0+d);
  o.connect(g).connect(AC.destination);o.start(t0);o.stop(t0+d+.03);
}
function snd(k){
  if(S.muted)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    if(k==='pick')tone(720,.05,'triangle',.05);
    else if(k==='plant'){tone(260,.08,'triangle',.08,0,180);tone(420,.05,'triangle',.04,.07)}
    else if(k==='water'){for(let i=0;i<5;i++)tone(900+Math.random()*700,.05,'sine',.025,i*.035)}
    else if(k==='sprinkle'){for(let i=0;i<9;i++)tone(1000+Math.random()*900,.05,'sine',.018,i*.04)}
    else if(k==='bloom'){tone(880,.12,'sine',.03);tone(1320,.18,'sine',.025,.06)}
    else if(k==='snip'){tone(1400,.03,'square',.025);tone(1800,.04,'triangle',.04,.04)}
    else if(k==='pull')tone(240,.14,'sawtooth',.03,0,520);
    else if(k==='sell'){[660,880,1320].forEach((f,i)=>tone(f,.16,'triangle',.06,i*.07))}
    else if(k==='coin'){tone(1568,.08,'square',.025);tone(2093,.16,'square',.025,.07)}
    else if(k==='walk')tone(190,.4,'sawtooth',.045,0,80);
    else if(k==='wilt')tone(420,.35,'triangle',.04,0,160);
    else if(k==='bad')tone(150,.12,'square',.035);
    else if(k==='ding'){tone(1568,.35,'sine',.05);tone(1318,.4,'sine',.04,.08)}
  }catch(e){}
}
