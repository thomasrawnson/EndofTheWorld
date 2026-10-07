import{describe,expect,it}from'vitest';
import{Disaster,Game,applyMarks,baseUpkeep,chooseDisaster,disasterPreview,isTradeoffPair,lineResolution,newGame,payUpkeep,recruit,replacementUpkeep,residentAvailability,selectOffers,upkeepBill,useResident}from'./rules';
const ordered=()=>({...newGame(42),card:Array.from({length:25},(_,i)=>i+1),marked:[13]})as Game;
const disaster=(over:Partial<Disaster>={}):Disaster=>({id:'test',title:'Test',numbers:[1,2,3],supply:0,integrity:0,flavour:'',icon:'',...over});
describe('bingo resolver',()=>{
 it('pays a line only once',()=>{const a=lineResolution(ordered().card,[1,2,3,4],[],[5]);expect(a.reward).toBe(3);expect(lineResolution(ordered().card,a.marked,a.fresh,[5]).reward).toBe(0)});
 it('pays two simultaneous lines through a shared square',()=>expect(lineResolution(ordered().card,[1,2,3,4,6,11,16,21,13],[],[5]).reward).toBe(6));
});
describe('upkeep',()=>{
 it('changes base upkeep exactly between rounds 4 and 5',()=>{expect(baseUpkeep(4)).toBe(2);expect(baseUpkeep(5)).toBe(3)});
 it('includes resident modifiers and replacement previews',()=>{expect(upkeepBill(5,['influencer']).total).toBe(4);expect(replacementUpkeep(4,['conspiracy','raccoon','traveller'],'influencer','raccoon').total).toBe(4);expect(replacementUpkeep(4,['conspiracy','influencer','traveller'],'raccoon','influencer').total).toBe(3)});
 it('damages for the exact shortfall',()=>{const n=payUpkeep({...ordered(),round:5,phase:'actions',supplies:1,integrity:5});expect(n.supplies).toBe(0);expect(n.integrity).toBe(3)});
});
describe('disaster offers',()=>{
 it('preview agrees with committed marks, rewards and resources',()=>{const g:Game={...ordered(),marked:[1,2,3,4,13],residents:['influencer'],offers:[disaster({numbers:[5,8,9],supply:-1,integrity:-1}),disaster({id:'other'})]};const p=disasterPreview(g,g.offers[0]),n=chooseDisaster(g,0);expect(n.marked.length-g.marked.length).toBe(p.newMarks.length);expect(n.claimed.length-g.claimed.length).toBe(p.lines);expect(n.supplies).toBe(p.suppliesAfter);expect(n.integrity).toBe(p.integrityAfter)});
 it('is deterministic and respects the bounded fallback',()=>{const g=ordered();expect(selectOffers(g)).toEqual(selectOffers(g));const fallback=selectOffers(g,1);expect(fallback.attempts).toBe(1);expect(fallback.offers).toHaveLength(2)});
 it('accepts costly progress tradeoffs and rejects obvious dominance',()=>{const g:Game={...ordered(),marked:[1,2,3,4,6,11,16,21,13]};const costly=disaster({id:'costly',numbers:[5,10,15],integrity:-1}),safe=disaster({id:'safe',numbers:[7,8,9]});expect(isTradeoffPair(g,[costly,safe])).toBe(true);expect(isTradeoffPair(g,[disaster({id:'bad',numbers:[7,8,9],integrity:-1}),safe])).toBe(false)});
});
describe('residents',()=>{
 it('charges and limits once-per-round abilities',()=>{let g:Game={...ordered(),phase:'actions',residents:['conspiracy']};g=useResident(g,'conspiracy',1);expect(g.supplies).toBe(6);expect(useResident(g,'conspiracy',2)).toBe(g)});
 it('reports availability using the same activation rules',()=>{let g:Game={...ordered(),phase:'actions',residents:['conspiracy'],supplies:0};expect(residentAvailability(g,'conspiracy')).toMatchObject({state:'Unavailable',canUse:false});g={...g,supplies:1};expect(residentAvailability(g,'conspiracy')).toMatchObject({state:'Ready',canUse:true});g={...g,used:['conspiracy']};expect(residentAvailability(g,'conspiracy').state).toBe('Used this round')});
 it('requires a prior rejected eligible call and safe integrity for traveller',()=>{let g:Game={...ordered(),phase:'actions',residents:['traveller'],previousRejected:disaster({numbers:[7,8,9]})};expect(residentAvailability(g,'traveller').state).toBe('Ready');g={...g,integrity:1};expect(residentAvailability(g,'traveller').reason).toContain('more than 1 integrity')});
 it('applies influencer bonus once',()=>{let g:Game={...ordered(),residents:['influencer'],marked:[1,2,3,4,13]};g=applyMarks(g,[5]);expect(g.supplies).toBe(11);g={...g,marked:[...g.marked,6,7,8,9]};expect(applyMarks(g,[10]).supplies).toBe(14)});
 it('activates a replacement next round',()=>{const g:Game={...ordered(),round:2,phase:'recruitment',residents:['conspiracy','raccoon','traveller']};const n=recruit(g,'influencer','raccoon');expect(n.round).toBe(3);expect(n.residents).toContain('influencer');expect(n.residents).not.toContain('raccoon')});
});
describe('outcomes and seeds',()=>{
 it('wins after round-eight upkeep',()=>expect(payUpkeep({...ordered(),round:8,phase:'actions',supplies:9}).outcome).toBe('win'));
 it('loses at zero integrity',()=>expect(payUpkeep({...ordered(),round:3,phase:'actions',supplies:0,integrity:1}).outcome).toBe('loss'));
 it('retries deterministically and resets completely',()=>expect(newGame(99)).toEqual(newGame(99)));
});
