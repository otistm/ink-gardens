/* Ink Gardens: the plants, the days of the week, customers, beds and upgrades. Never reorder PLANTS; add new ones at the end. */
"use strict";
// grow: seconds from seed to bloom while watered. bloom: seconds a bloom stays fresh on the stem.
// thirst: seconds for a full drink to run dry. seed: cost to plant. price: what one stem sells for.
const PLANTS=[
  {id:0,k:'daisy',    name:'Daisy',    plural:'daisies',    grow:9,  bloom:30,thirst:16,seed:1,price:4},
  {id:1,k:'tulip',    name:'Tulip',    plural:'tulips',     grow:13, bloom:28,thirst:15,seed:2,price:7},
  {id:2,k:'sunflower',name:'Sunflower',plural:'sunflowers', grow:18, bloom:34,thirst:12,seed:3,price:10},
  {id:3,k:'fern',     name:'Fern',     plural:'ferns',      grow:14, bloom:45,thirst:10,seed:3,price:9},
  {id:4,k:'lavender', name:'Lavender', plural:'lavender',   grow:16, bloom:36,thirst:22,seed:4,price:11},
  {id:5,k:'rose',     name:'Rose',     plural:'roses',      grow:22, bloom:26,thirst:11,seed:6,price:16},
  {id:6,k:'cactus',   name:'Cactus',   plural:'cacti',      grow:26, bloom:60,thirst:60,seed:4,price:13},
  {id:7,k:'orchid',   name:'Orchid',   plural:'orchids',    grow:30, bloom:24,thirst:9, seed:9,price:24},
];
// A line about each plant for the seed tray intro.
const PLANT_NOTE=[
  'Quick to grow and cheap. Everyone likes a daisy.',
  'A little slower, and worth nearly twice as much.',
  'Tall, proud and thirsty. Keep the can handy.',
  'Not a flower, but people love them in pots. Drinks a lot.',
  'Slow to dry out, so you can leave it be for a while.',
  'The one everyone asks for. Thirsty, and quick to fade.',
  'Barely needs water at all, but takes its time.',
  'Fussy, slow and very thirsty. Sells for a small fortune.',
];

const DAYNAMES=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// How each day plays. add: the plant that joins the seed tray that morning. n: customers. first/gap: seconds before the
// first and between customers. wait: seconds of patience. items: smallest and largest order, in stems.
const DAYS=[
  {add:[0,1],n:6, first:13,gap:15,wait:46,items:[1,2],rail:2,
    story:"Nana left you the shop and the garden behind it. Across the street, Everbloom just opened: plastic flowers that never die, never smell, and never cost much."},
  {add:[2],  n:8, first:10,gap:12,wait:38,items:[1,3],rail:3,
    story:"Everbloom put up a giant plastic sunflower on its roof. People keep asking you for a real one."},
  {add:[3],  n:9, first:9, gap:11,wait:35,items:[1,3],rail:3,
    story:"The café next door wants ferns for its windows. Everbloom's ferns are dusty and everyone can tell."},
  {add:[4],  n:10,first:9, gap:10,wait:33,items:[1,4],rail:3,
    story:"Everbloom sprays its flowers with a scent called Meadow No. 5. Real lavender says otherwise."},
  {add:[5],  n:11,first:8, gap:9, wait:31,items:[2,4],rail:3,
    story:"A wedding on Saturday means roses all week. Everbloom is selling a dozen plastic ones for the price of two real ones."},
  {add:[6],  n:15,first:8, gap:7, wait:28,items:[1,4],rail:3,
    story:"Market day. The whole town is out, and Everbloom has a man in a flower suit handing out coupons."},
  {add:[7],  n:11,first:9, gap:9, wait:36,items:[3,5],rail:3,
    story:"The town flower show. The judges want something real, and so does everyone who came to watch."},
];
// A fresh week starts with these beds open and these plants already growing.
const START={till:12,beds:6,loyalty:60,garden:[{b:0,p:0,g:.55},{b:1,p:0,g:.3},{b:3,p:1,g:.2}]};
// 12 beds in a 3 by 4 grid. The first six are open; the rest cost this much to dig.
const BEDS=12,BED_COST=[0,0,0,0,0,0,20,30,45,60,80,100];
// Things to buy between days. Each one is bought once and lasts the week.
const UPGRADES=[
  {k:'sprinkler',name:'Sprinkler',cost:120,does:'Waters every bed on its own every 12 seconds.'},
  {k:'glass',    name:'Cold frame',cost:150,does:'Everything grows a third faster.'},
  {k:'food',     name:'Flower food',cost:80,does:'Blooms stay fresh on the stem much longer.'},
  {k:'awning',   name:'Striped awning',cost:100,does:'Customers wait a quarter longer in the shade.'},
];
const CUSTOMERS=['Mrs Pell','Dev','Old Tom','Rosa','Kit','Priya','Mr Ash','June','Ollie','Nell','Sam','Bea','Mo','Iris','Hal','Wren','Ada','Otto','Faye','Lou','Vic','Pip','Cleo','Abe'];
const WHY=['for the table','for my mum','just because','for a date','for the office','to say sorry','for the café','for a birthday','for the wedding','for the show','for my window','for a friend'];
