/* Ink Gardens: every plant at every stage, the little flower icons, customer faces and the watering can, as ink SVG.
   Plants draw in a 100 × 100 box with the soil at y 88. Shading is hatching, dots and stripes, never color. */
"use strict";
const INK='var(--ink)',PAPER='var(--paper)';
const FILLS={paper:PAPER,dots:'url(#dots)',hatch:'url(#hatch)',stripes:'url(#stripes)',ink:INK,none:'none'};
const sh=(d,f,sw)=>`<path d="${d}" style="fill:${FILLS[f]||f};stroke:${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ln=(d,sw)=>`<path d="${d}" style="fill:none;stroke:${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" style="fill:${INK}"/>`;
const ell=(x,y,rx,ry,rot,f,sw)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" style="fill:${FILLS[f]||f};stroke:${INK}" stroke-width="${sw}"/>`;
const r1=n=>Math.round(n*10)/10;
const GROUND=88;

function stem(top,sw,bend=-3,x=50){return ln(`M${x} ${GROUND} Q${x+bend} ${r1((GROUND+top)/2)} ${x} ${top}`,sw)}
function leaf(x,y,dir,s,sw,f='paper'){
  const d=`M${x} ${y} q${r1(dir*9*s)} ${r1(-11*s)} ${r1(dir*22*s)} ${r1(-6*s)} q${r1(-dir*9*s)} ${r1(10*s)} ${r1(-dir*22*s)} ${r1(6*s)} Z`;
  return sh(d,f,sw)+ln(`M${x} ${y} l${r1(dir*15*s)} ${r1(-5*s)}`,sw*.55);
}
function ring(n,r,fn){let o='';for(let i=0;i<n;i++){const a=i/n*Math.PI*2-Math.PI/2;o+=fn(Math.cos(a)*r,Math.sin(a)*r,a*180/Math.PI+90,i)}return o}
function sprout(sw){return stem(64,sw,-2)+leaf(50,68,-1,.9,sw)+leaf(50,66,1,.95,sw)}
function mound(sw){return sh(`M26 ${GROUND+1} Q50 ${GROUND-24} 74 ${GROUND+1} Z`,'dots',sw)+ell(50,GROUND-15,2.6,3.6,20,'ink',sw*.4)}

/* ---------- flower heads, centred on (x, y) ---------- */
const HEAD={
  daisy:(x,y,sw)=>ring(11,10,(dx,dy,a)=>ell(r1(x+dx),r1(y+dy),3.6,8,r1(a),'paper',sw*.8))+`<circle cx="${x}" cy="${y}" r="6" style="fill:url(#dots);stroke:${INK}" stroke-width="${sw}"/>`,
  tulip:(x,y,sw)=>sh(`M${x-11} ${y-9} L${x-5} ${y-2} L${x} ${y-13} L${x+5} ${y-2} L${x+11} ${y-9} Q${x+13} ${y+10} ${x} ${y+11} Q${x-13} ${y+10} ${x-11} ${y-9} Z`,'hatch',sw)+ln(`M${x-5} ${y-2} Q${x-4} ${y+6} ${x} ${y+11} M${x+5} ${y-2} Q${x+4} ${y+6} ${x} ${y+11}`,sw*.6),
  sunflower:(x,y,sw)=>ring(14,14,(dx,dy,a)=>{const ax=x+dx,ay=y+dy,c=Math.cos((a-90)*Math.PI/180),s=Math.sin((a-90)*Math.PI/180);
      return sh(`M${r1(ax-s*4.5)} ${r1(ay+c*4.5)} L${r1(ax+c*9)} ${r1(ay+s*9)} L${r1(ax+s*4.5)} ${r1(ay-c*4.5)} Z`,'paper',sw*.8)})
    +`<circle cx="${x}" cy="${y}" r="10.5" style="fill:url(#hatch);stroke:${INK}" stroke-width="${sw}"/>`,
  rose:(x,y,sw)=>sh(`M${x-12} ${y+2} Q${x-13} ${y-12} ${x} ${y-12} Q${x+13} ${y-12} ${x+12} ${y+2} Q${x+10} ${y+12} ${x} ${y+12} Q${x-10} ${y+12} ${x-12} ${y+2} Z`,'paper',sw)
    +ln(`M${x} ${y-1} q-4 -1 -3 -5 q3 -3 7 0 q3 5 -2 8 q-7 2 -9 -4 q-1 -8 8 -9 q9 1 9 9`,sw*.7)
    +sh(`M${x-9} ${y+9} q-5 4 -9 3 q5 -6 11 -6 Z M${x+9} ${y+9} q5 4 9 3 q-5 -6 -11 -6 Z`,'hatch',sw*.7),
  orchid:(x,y,sw)=>ell(x,y-8,4,8,0,'paper',sw*.8)+ell(x-8,y+5,3.6,8,-130,'paper',sw*.8)+ell(x+8,y+5,3.6,8,130,'paper',sw*.8)
    +ell(x-8,y-1,5,8.5,-65,'paper',sw*.85)+ell(x+8,y-1,5,8.5,65,'paper',sw*.85)
    +sh(`M${x-4} ${y+1} Q${x} ${y+13} ${x+4} ${y+1} Q${x} ${y-2} ${x-4} ${y+1} Z`,'dots',sw*.8),
};

/* ---------- each plant, whole, at a stage: bud, bloom, fade ---------- */
function frond(x0,y0,x1,y1,cx,cy,sw,n=7,tight=1){
  let o=ln(`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`,sw*.8);
  for(let i=1;i<=n;i++){
    const t=i/(n+1),mt=1-t,px=mt*mt*x0+2*mt*t*cx+t*t*x1,py=mt*mt*y0+2*mt*t*cy+t*t*y1;
    const tx=2*mt*(cx-x0)+2*t*(x1-cx),ty=2*mt*(cy-y0)+2*t*(y1-cy),L=Math.hypot(tx,ty)||1,nx=-ty/L,ny=tx/L,s=(1-t*.6)*5.5*tight;
    o+=ell(r1(px+nx*s),r1(py+ny*s),s*.55,s,r1(Math.atan2(ny,nx)*180/Math.PI+90),'paper',sw*.55)
      +ell(r1(px-nx*s),r1(py-ny*s),s*.55,s,r1(Math.atan2(-ny,-nx)*180/Math.PI+90),'paper',sw*.55);
  }
  return o;
}
function spike(x,top,sw,n=6,bloom=true){
  let o=ln(`M${x} ${top+n*5+4} V${top}`,sw*.6);
  for(let i=0;i<n;i++){const y=top+i*5+2;o+=bloom?ell(x-2.6,y,2.2,3,-35,i%2?'paper':'dots',sw*.55)+ell(x+2.6,y+1.5,2.2,3,35,i%2?'dots':'paper',sw*.55):dot(x+(i%2?1.5:-1.5),y+1,1.3)}
  return o;
}
function cactusBody(h,sw,arm){
  const top=GROUND-h,w=12;
  let o='';
  if(arm)o+=sh(`M${50+w-2} ${GROUND-h*.45} H${50+w+8} Q${50+w+12} ${GROUND-h*.45} ${50+w+12} ${GROUND-h*.45-4} V${GROUND-h*.8} Q${50+w+12} ${GROUND-h*.8-6} ${50+w+6} ${GROUND-h*.8-6} Q${50+w+1} ${GROUND-h*.8-6} ${50+w+1} ${GROUND-h*.8} V${GROUND-h*.45-7} H${50+w-2} Z`,'paper',sw);
  o+=sh(`M${50-w} ${GROUND} V${top+w} Q${50-w} ${top} 50 ${top} Q${50+w} ${top} ${50+w} ${top+w} V${GROUND} Z`,'paper',sw);
  o+=ln(`M${50-4} ${GROUND-2} V${top+6} M${50+4} ${GROUND-2} V${top+6}`,sw*.5);
  for(let y=top+10;y<GROUND-6;y+=9)o+=ln(`M${50-w-3} ${y} l3 1 M${50+w+3} ${y+4} l-3 1 M${50-1} ${y+3} l-2 -2`,sw*.45);
  return o;
}
function plantBody(p,stage,sw){
  const k=PLANTS[p].k;
  if(stage==='seed')return mound(sw);
  if(stage==='sprout'){
    if(k==='cactus')return cactusBody(16,sw,false);
    if(k==='fern')return frond(50,GROUND,40,66,44,70,sw,2)+frond(50,GROUND,60,68,57,72,sw,2);
    return sprout(sw);
  }
  const bud=stage==='bud';
  switch(k){
    case 'daisy':{const t=bud?40:30;return stem(t,sw)+leaf(50,74,-1,.8,sw)+leaf(50,64,1,.7,sw)+(bud?ell(50,t-4,4.5,6,0,'dots',sw):HEAD.daisy(50,t-8,sw))}
    case 'tulip':{const t=bud?36:30;return stem(t,sw,2)+sh(`M50 ${GROUND} Q36 70 34 50 Q46 62 50 ${GROUND-4}`,'paper',sw)+sh(`M50 ${GROUND} Q64 72 68 54 Q55 64 50 ${GROUND-6}`,'paper',sw)
      +(bud?ell(50,t-6,5,8,0,'hatch',sw):HEAD.tulip(50,t-9,sw))}
    case 'sunflower':{const t=bud?30:24;return stem(t,sw*1.2,-4)+leaf(50,70,-1,1,sw)+leaf(50,56,1,1,sw)+leaf(50,42,-1,.8,sw)
      +(bud?`<circle cx="50" cy="${t-6}" r="7" style="fill:url(#hatch);stroke:${INK}" stroke-width="${sw}"/>`+ring(8,7,(dx,dy)=>ln(`M${r1(50+dx)} ${r1(t-6+dy)} l${r1(dx*.45)} ${r1(dy*.45)}`,sw*.7)):HEAD.sunflower(50,t-8,sw))}
    case 'fern':return bud?frond(50,GROUND,34,56,38,64,sw,4)+frond(50,GROUND,66,58,62,66,sw,4)+ln('M50 88 Q50 60 52 52 q4 -4 1 -7 q-4 -1 -3 3',sw*.8)
      :frond(50,GROUND,18,58,26,66,sw,5)+frond(50,GROUND,82,56,74,64,sw,5)+frond(50,GROUND,34,30,40,48,sw,5)+frond(50,GROUND,68,30,62,48,sw,5)+frond(50,GROUND,51,16,48,40,sw,6,.9);
    case 'lavender':{let o='';[[36,44,-6],[50,32,0],[64,42,6]].forEach(([x,t,b])=>{o+=ln(`M50 ${GROUND} Q${50+b*.4} ${(GROUND+t)/2} ${x} ${t+30}`,sw*.7)+spike(x,t,sw,6,!bud)});
      return o+ln('M44 86 q-8 -8 -12 -6 M56 86 q8 -8 12 -6',sw*.7)}
    case 'rose':{const t=bud?38:30;let o=stem(t,sw,-3)+leaf(50,72,-1,.85,sw,'hatch')+leaf(50,58,1,.8,sw,'hatch');
      [80,66,50].forEach((y,i)=>o+=sh(`M${49-(i%2?-1:0)} ${y} l${i%2?5:-5} -2 l${i%2?-4:4} -3 Z`,'ink',sw*.4));
      return o+(bud?sh(`M50 ${t+2} Q42 ${t-4} 50 ${t-14} Q58 ${t-4} 50 ${t+2} Z`,'hatch',sw)+sh(`M50 ${t+2} q-7 0 -8 -6 q5 1 8 4 q3 -3 8 -4 q-1 6 -8 6 Z`,'paper',sw*.7):HEAD.rose(50,t-9,sw))}
    case 'cactus':{const o=cactusBody(bud?44:50,sw,true);const t=GROUND-(bud?44:50);
      return o+(bud?ell(50,t-3,3.5,5,0,'hatch',sw*.8):ring(6,5,(dx,dy,a)=>ell(r1(50+dx),r1(t-5+dy),3,5,r1(a),'paper',sw*.7))+dot(50,t-5,2.2))}
    case 'orchid':{let o=sh('M50 88 Q24 86 20 72 Q38 70 50 86 Z','paper',sw)+sh('M50 88 Q78 86 82 74 Q64 72 50 86 Z','paper',sw)+ln('M50 86 Q46 50 58 32 Q66 22 74 24',sw*.8);
      return o+(bud?ell(62,30,3.5,5,30,'dots',sw*.8)+ell(72,26,3,4,60,'dots',sw*.8):HEAD.orchid(60,34,sw*.9)+HEAD.orchid(76,24,sw*.75))}
  }
  return sprout(sw);
}
// Faded: the head nods over and a petal or two lies on the soil.
function fadeBody(p,sw){
  const body=plantBody(p,'bloom',sw);
  return `<g transform="rotate(12 50 ${GROUND}) translate(4 4)">${body}</g>`+ell(28,GROUND-3,3.4,1.8,20,'paper',sw*.6)+ell(74,GROUND-2.5,3.4,1.8,-15,'paper',sw*.6);
}
function deadBody(sw){
  return ln(`M50 ${GROUND} Q47 66 52 52 Q58 44 66 50`,sw)+sh(`M50 76 q-10 -2 -14 4 q8 2 14 -4 Z`,'hatch',sw*.7)+sh(`M51 62 q9 -4 13 1 q-7 3 -13 -1 Z`,'hatch',sw*.7)+ell(67,53,3,4,40,'hatch',sw*.7);
}
function weedBody(sw){
  return sh('M50 88 L38 62 L45 66 L42 50 L50 60 L54 44 L57 60 L64 50 L61 66 L68 62 Z','hatch',sw)+sh('M50 88 L30 76 L40 76 L34 70 L50 82 Z','paper',sw*.8)+sh('M50 88 L70 74 L61 76 L66 69 L50 82 Z','paper',sw*.8);
}
// The whole bed: soil strip plus whatever grows in it. look: seed, sprout, bud, bloom, fade, dead, weed or empty.
function bedSVG(p,look,sw=2.6){
  let body='';
  if(look==='dead')body=deadBody(sw);else if(look==='weed')body=weedBody(sw);
  else if(look==='fade')body=fadeBody(p,sw);else if(look!=='empty')body=plantBody(p,look,sw);
  return `<svg class="plant" viewBox="0 0 100 100" aria-hidden="true"><g class="sway">${body}</g><rect x="6" y="${GROUND}" width="88" height="8" rx="4" style="fill:url(#dots);stroke:${INK}" stroke-width="${sw*.8}"/></svg>`;
}
// The little flower icons used on tickets, the bucket and the seed tray: the blooming plant, cropped to its best part.
const ICON_BOX=['28 4 44 44','30 6 40 40','26 0 48 48','12 12 76 76','24 18 52 52','30 6 42 42','30 20 40 40','40 6 48 48'];
function flowerIcon(p,cls='ico'){return `<svg class="${cls}" viewBox="${ICON_BOX[p]}" aria-hidden="true">${plantBody(p,'bloom',p===3?4.2:3.6)}</svg>`}
// A seed packet: the plant's icon on a little paper envelope.
function packetSVG(p){
  return `<svg class="pk" viewBox="0 0 40 48" aria-hidden="true"><path d="M3 6 H37 V45 H3 Z" style="fill:${PAPER};stroke:${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M3 6 L8 1 H32 L37 6" style="fill:url(#stripes);stroke:${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <svg x="5" y="9" width="30" height="30" viewBox="${ICON_BOX[p]}">${plantBody(p,'bloom',p===3?4.8:4.2)}</svg></svg>`;
}
// Customers: one face with a few hats and hairdos (look 0–5), and three moods switched by CSS on the ticket.
const LOOKS=['','<path d="M5 9 Q6 2 12 2 Q18 2 19 9 Q15 5 12 7 Q9 5 5 9 Z" style="fill:var(--ink)"/>',
  '<circle cx="12" cy="2.6" r="2.6" style="fill:var(--paper);stroke:var(--ink)" stroke-width="1.6"/><path d="M4.5 9 Q6 3 12 3 Q18 3 19.5 9" style="fill:none;stroke:var(--ink)" stroke-width="1.8"/>',
  '<path d="M3 8 Q4 1 12 1 Q20 1 21 8 Z" style="fill:url(#hatch);stroke:var(--ink)" stroke-width="1.6"/><path d="M2 8 H23" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/>',
  '<circle cx="8.5" cy="10.5" r="3" style="fill:none;stroke:var(--ink)" stroke-width="1.3"/><circle cx="15.5" cy="10.5" r="3" style="fill:none;stroke:var(--ink)" stroke-width="1.3"/><path d="M11.5 10.5 H12.5" style="stroke:var(--ink)" stroke-width="1.3"/>',
  '<path d="M1 7 Q12 -1 23 7 Q12 4 1 7 Z" style="fill:var(--paper);stroke:var(--ink)" stroke-width="1.6"/><path d="M5 5.4 Q12 -2 19 5.4" style="fill:url(#stripes);stroke:var(--ink)" stroke-width="1.4"/>'];
function faceSVG(look){
  return `<svg class="face" viewBox="0 -1 24 26" aria-hidden="true"><circle cx="12" cy="12.5" r="9.6" style="fill:var(--paper);stroke:var(--ink)" stroke-width="2"/>
    <circle cx="8.5" cy="11" r="1.4" style="fill:var(--ink)"/><circle cx="15.5" cy="11" r="1.4" style="fill:var(--ink)"/>
    <path class="brow" d="M6.5 7.5 L10 8.8 M17.5 7.5 L14 8.8"/><path class="m happy" d="M7.5 15 Q12 19.3 16.5 15"/><path class="m meh" d="M8.5 16.5 H15.5"/><path class="m grr" d="M8 18 Q12 14.5 16 18"/>${LOOKS[look%LOOKS.length]}</svg>`;
}
const CAN=`<svg viewBox="0 0 40 32" aria-hidden="true"><g style="fill:var(--paper);stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M8 12 H28 V29 H8 Z"/><path d="M28 16 L38 7 M36 5 l4 4"/><path d="M8 15 Q1 15 2 21 Q3 26 8 25" style="fill:none"/><path d="M11 12 Q18 2 25 12" style="fill:none"/><path d="M8 19 H28" style="fill:none"/></g></svg>`;
