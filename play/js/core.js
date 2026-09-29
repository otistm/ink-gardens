/* Ink Gardens: small helpers, saved progress and the game state S. */
"use strict";
const $=s=>document.querySelector(s);
const app=$('#app'),rail=$('#rail'),garden=$('#garden'),bucketEl=$('#bucket'),tray=$('#tray'),fx=$('#fx'),scr=$('#screen');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const haptic=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const money=n=>'$'+Math.round(n);

// inkgardens: {best:{day,till,earned,won}, muted}. inkgardens-run: the week in progress, saved each morning.
// Never rename or remove a field here; add new ones with defaults.
let BEST={};
try{BEST=JSON.parse(localStorage.getItem('inkgardens')||'{}')||{}}catch(e){BEST={}}
function saveBest(){try{localStorage.setItem('inkgardens',JSON.stringify(BEST))}catch(e){}}
function loadRun(){try{const r=JSON.parse(localStorage.getItem('inkgardens-run')||'null');return r&&r.v===1&&r.day<DAYNAMES.length?r:null}catch(e){return null}}
function saveRun(r){try{r?localStorage.setItem('inkgardens-run',JSON.stringify(r)):localStorage.removeItem('inkgardens-run')}catch(e){}}

const S={mode:'menu',day:0,loyalty:60,till:0,earned:0,beds:6,up:{},garden:[],bucket:[],sel:0,muted:!!BEST.muted,seen:new Set(),stamped:new Set()};
// The parts of S that make up a week in progress, copied so a lost day can be replayed from its morning.
function snapshot(){return JSON.parse(JSON.stringify({v:1,day:S.day,loyalty:S.loyalty,till:S.till,earned:S.earned,beds:S.beds,up:S.up,garden:S.garden,bucket:S.bucket,sel:S.sel}))}
function restore(r){
  S.day=r.day|0;S.loyalty=r.loyalty??60;S.till=r.till|0;S.earned=r.earned|0;S.beds=r.beds||6;S.up=Object.assign({},r.up||{});S.sel=r.sel|0;
  S.garden=Array.from({length:BEDS},(_,i)=>r.garden&&r.garden[i]?Object.assign({},r.garden[i]):null);
  S.bucket=PLANTS.map((_,i)=>r.bucket&&r.bucket[i]|0||0);
}
// Plants on sale by a given day.
const unlocked=(day=S.day)=>DAYS.slice(0,day+1).flatMap(d=>d.add);
