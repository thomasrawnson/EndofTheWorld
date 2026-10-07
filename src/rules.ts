export type ResidentId='conspiracy'|'traveller'|'raccoon'|'influencer';
export type Phase='choice'|'actions'|'upkeep'|'recruitment'|'results';
export type Disaster={id:string;title:string;numbers:number[];supply:number;integrity:number;flavour:string;icon:string};
export type Game={seed:number;round:number;phase:Phase;card:number[];marked:number[];claimed:number[];supplies:number;integrity:number;residents:ResidentId[];pendingResidents:ResidentId[];used:ResidentId[];repairs:number;offers:Disaster[];chosen?:Disaster;rejected?:Disaster;previousRejected?:Disaster;scrap:number[];log:string[];outcome?:'win'|'loss';bonusUsed:boolean};
export const LINES=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r*5+c)).concat(Array.from({length:5},(_,c)=>Array.from({length:5},(_,r)=>r*5+c)));
export const RESIDENTS:Record<ResidentId,{name:string;quote:string;rule:string;frequency:string;drawback?:string}>={
 conspiracy:{name:'Conspiracy Theorist',quote:'“I told you that number had already happened.”',rule:'Mark any unmarked square. Costs 1 supply.',frequency:'Once per round'},
 traveller:{name:'Time Traveller',quote:'“Good news: I fixed yesterday. Bad news: yesterday noticed.”',rule:'Mark an eligible number from last round’s rejected disaster. Costs 1 integrity.',frequency:'Once per round'},
 raccoon:{name:'Raccoon',quote:'“Neighbourhood resource redistribution.”',rule:'Mark one available number from the neighbour’s scrap. Costs 1 supply.',frequency:'Once per round'},
 influencer:{name:'Doomsday Influencer',quote:'“Don’t forget to like and survive.”',rule:'First line each round earns +1 supply. Upkeep increases by 1.',frequency:'Passive',drawback:'+1 upkeep'}
};
const POOL:Omit<Disaster,'numbers'>[]=[
 {id:'acid',title:'Acid Drizzle',supply:0,integrity:-1,flavour:'A light shower, if your umbrella is made of tungsten.',icon:'drop'},
 {id:'ghost',title:'Pantry Poltergeist',supply:-1,integrity:0,flavour:'The beans have become emotionally unavailable.',icon:'tin'},
 {id:'inspect',title:'Government Inspection',supply:-1,integrity:0,flavour:'An inspector checks whether the apocalypse has planning permission.',icon:'clip'},
 {id:'meteor',title:'Meteor Shower',supply:1,integrity:-2,flavour:'Roof damage, but the debris is surprisingly recyclable.',icon:'meteor'},
 {id:'quiet',title:'Suspiciously Quiet Tuesday',supply:0,integrity:0,flavour:'Nothing happens. This is deeply concerning.',icon:'eye'},
 {id:'mould',title:'Sentient Mould Audit',supply:-1,integrity:0,flavour:'It has a clipboard and several firm recommendations.',icon:'spore'},
 {id:'pigeons',title:'Unionised Pigeons',supply:0,integrity:-1,flavour:'Their collective bargaining position is the roof.',icon:'wing'}
];
export function rng(seed:number){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function shuffle<T>(a:T[],r:()=>number){return[...a].sort(()=>r()-.5)}
export function lineResolution(card:number[],marked:number[],claimed:number[],added:number[]){const set=new Set([...marked,...added]);const fresh=LINES.map((line,i)=>({line,i})).filter(x=>!claimed.includes(x.i)&&x.line.every(pos=>set.has(card[pos]))).map(x=>x.i);return{marked:[...set],fresh,reward:fresh.length*3}}
export function baseUpkeep(round:number){return round<=4?2:3}
export function upkeepBill(round:number,residents:ResidentId[]){const base=baseUpkeep(round),influencer=residents.includes('influencer')?1:0;return{base,influencer,total:base+influencer}}
export function upkeep(supplies:number,integrity:number,bill:number){const paid=Math.min(supplies,bill),short=bill-paid;return{supplies:supplies-paid,integrity:Math.max(0,integrity-short),short}}
function numbersFor(unmarked:number[],r:()=>number){const first=shuffle(unmarked,r).slice(0,Math.min(3,unmarked.length));const fill=shuffle(Array.from({length:25},(_,i)=>i+1).filter(n=>!first.includes(n)),r);return[...first,...fill].slice(0,3)}
export function disasterPreview(g:Pick<Game,'card'|'marked'|'claimed'|'supplies'|'integrity'|'residents'|'bonusUsed'>,d:Disaster){
 const result=lineResolution(g.card,g.marked,g.claimed,d.numbers),newMarks=d.numbers.filter(n=>!g.marked.includes(n));
 const influencerBonus=result.fresh.length>0&&g.residents.includes('influencer')&&!g.bonusUsed?1:0,immediateReward=result.reward+influencerBonus;
 const suppliesAfter=Math.max(0,g.supplies+d.supply)+immediateReward,integrityAfter=Math.min(5,Math.max(0,g.integrity+d.integrity));
 const advancement=LINES.reduce((sum,line,i)=>{if(g.claimed.includes(i)||result.fresh.includes(i))return sum;const before=line.filter(p=>g.marked.includes(g.card[p])).length,after=line.filter(p=>result.marked.includes(g.card[p])).length;return sum+Math.max(0,after*after-before*before)},0);
 return{newMarks,lines:result.fresh.length,lineReward:result.reward,influencerBonus,immediateReward,suppliesAfter,integrityAfter,lethal:integrityAfter===0,advancement};
}
function progressScore(g:Game,d:Disaster){const p=disasterPreview(g,d);return p.newMarks.length+p.lines*6+p.advancement*.35}
function effectiveCost(g:Game,d:Disaster){const p=disasterPreview(g,d);return(g.integrity-p.integrityAfter)*3+Math.max(0,g.supplies-p.suppliesAfter)}
export function isTradeoffPair(g:Game,pair:Disaster[]){const[a,b]=pair,pa=progressScore(g,a),pb=progressScore(g,b),ca=effectiveCost(g,a),cb=effectiveCost(g,b);return(pa>pb+.2&&ca>cb+.2)||(pb>pa+.2&&cb>ca+.2)}
export function selectOffers(g:Game,maxAttempts=12){const r=rng(g.seed+g.round*991),unmarked=g.card.filter(n=>!g.marked.includes(n));let fallback:Disaster[]=[];const limit=Math.max(1,maxAttempts);for(let attempt=1;attempt<=limit;attempt++){const pair=shuffle(POOL,r).slice(0,2).map(d=>({...d,numbers:numbersFor(unmarked,r)}));if(!fallback.length)fallback=pair;if(isTradeoffPair(g,pair))return{offers:pair,foundTradeoff:true,attempts:attempt}}return{offers:fallback,foundTradeoff:false,attempts:limit}}
export function offersFor(g:Game){return selectOffers(g).offers}
export function scrapFor(g:Pick<Game,'seed'|'round'|'card'|'marked'>){const r=rng(g.seed+g.round*313),unmarked=g.card.filter(n=>!g.marked.includes(n));return numbersFor(unmarked,r)}
export function newGame(seed=Math.floor(Math.random()*1e9)):Game{const r=rng(seed),card=shuffle(Array.from({length:25},(_,i)=>i+1),r);const base:Game={seed,round:1,phase:'choice',card,marked:[card[12]],claimed:[],supplies:7,integrity:5,residents:['conspiracy'],pendingResidents:[],used:[],repairs:3,offers:[],scrap:[],log:['Shelter paperwork commenced.'],bonusUsed:false};return{...base,offers:offersFor(base),scrap:scrapFor(base)}}
export function applyMarks(g:Game,numbers:number[],costS=0,costI=0):Game{if(g.supplies<costS||g.integrity<=costI)return g;const res=lineResolution(g.card,g.marked,g.claimed,numbers),bonus=res.fresh.length&&g.residents.includes('influencer')&&!g.bonusUsed?1:0;return{...g,marked:res.marked,claimed:[...g.claimed,...res.fresh],supplies:g.supplies-costS+res.reward+bonus,integrity:g.integrity-costI,bonusUsed:g.bonusUsed||!!bonus,log:[...(res.fresh.length?[`${res.fresh.length} line${res.fresh.length>1?'s':''} claimed: +${res.reward+bonus} supplies.`]:[]),...g.log].slice(0,5)}}
export function chooseDisaster(g:Game,index:number):Game{const d=g.offers[index],rejected=g.offers[1-index];let n:Game={...g,supplies:Math.max(0,g.supplies+d.supply),integrity:Math.min(5,Math.max(0,g.integrity+d.integrity)),chosen:d,rejected,phase:'actions',log:[`${d.title} resolved.`,...g.log].slice(0,5)};n=applyMarks(n,d.numbers);return n.integrity===0?{...n,phase:'results',outcome:'loss'}:n}
export function residentEligibleNumbers(g:Game,id:ResidentId){if(id==='traveller')return(g.previousRejected?.numbers||[]).filter(n=>!g.marked.includes(n));if(id==='raccoon')return g.scrap.filter(n=>!g.marked.includes(n));if(id==='conspiracy')return g.card.filter(n=>!g.marked.includes(n));return[]}
export function residentAvailability(g:Game,id:ResidentId){
 if(g.pendingResidents.includes(id))return{state:'Available next round',reason:'Recruit activates when the next round begins.',canUse:false};
 if(id==='influencer')return{state:g.bonusUsed?'Triggered this round':'Available',reason:g.bonusUsed?'The +1 supply bonus has already paid.':'The next completed line earns +1 supply.',canUse:false};
 if(g.phase!=='actions')return{state:'Unavailable',reason:'Abilities are used after choosing a disaster.',canUse:false};
 if(g.used.includes(id))return{state:'Used this round',reason:'This ability refreshes next round.',canUse:false};
 const eligible=residentEligibleNumbers(g,id);if(!eligible.length)return{state:'Unavailable',reason:id==='traveller'?'No eligible number from last round’s rejected disaster.':'No eligible unmarked number.',canUse:false};
 if(id==='traveller'&&g.integrity<=1)return{state:'Unavailable',reason:'Needs more than 1 integrity to pay the cost.',canUse:false};
 if((id==='conspiracy'||id==='raccoon')&&g.supplies<1)return{state:'Unavailable',reason:'Needs 1 supply to pay the cost.',canUse:false};
 return{state:'Ready',reason:'Ability can be used now.',canUse:true};
}
export function useResident(g:Game,id:ResidentId,num:number){const a=residentAvailability(g,id);if(!a.canUse||!g.residents.includes(id)||g.marked.includes(num)||!residentEligibleNumbers(g,id).includes(num))return g;if(id==='conspiracy'||id==='raccoon')return{...applyMarks(g,[num],1),used:[...g.used,id]};if(id==='traveller')return{...applyMarks(g,[num],0,1),used:[...g.used,id]};return g}
export function payUpkeep(g:Game):Game{const bill=upkeepBill(g.round,g.residents),p=upkeep(g.supplies,g.integrity,bill.total);let n:Game={...g,...p,phase:'upkeep',log:[p.short?`Upkeep shortfall: ${p.short} integrity lost.`:`Upkeep paid: ${bill.total} supplies.`,...g.log].slice(0,5)};if(n.integrity===0)return{...n,phase:'results',outcome:'loss'};if(g.round===8)return{...n,phase:'results',outcome:'win'};if([2,4,6].includes(g.round))return{...n,phase:'recruitment'};return nextRound(n)}
export function nextRound(g:Game){const round=g.round+1,residents=[...g.residents,...g.pendingResidents]as ResidentId[];const base:Game={...g,round,residents,pendingResidents:[],phase:'choice',used:[],chosen:undefined,rejected:undefined,previousRejected:g.rejected,bonusUsed:false};return{...base,offers:offersFor(base),scrap:scrapFor(base)}}
export function recruit(g:Game,id?:ResidentId,replace?:ResidentId){let residents=[...g.residents];if(id){if(residents.includes(id))return g;if(residents.length>=3){if(!replace)return g;residents=residents.filter(x=>x!==replace)}}const staged={...g,residents,pendingResidents:id?[id]:[],log:[id?`${RESIDENTS[id].name} hired; starts next round.`:'Recruitment politely declined.',...g.log].slice(0,5)};return nextRound(staged)}
export function recruitOptions(g:Game){const r=rng(g.seed+g.round*727);return shuffle((Object.keys(RESIDENTS)as ResidentId[]).filter(x=>!g.residents.includes(x)),r).slice(0,2)}
export function replacementUpkeep(round:number,residents:ResidentId[],arriving:ResidentId,leaving?:ResidentId){const next=residents.filter(id=>id!==leaving);if(!next.includes(arriving))next.push(arriving);return upkeepBill(round+1,next)}
