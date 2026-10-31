import assert from 'node:assert/strict';
import {leagueData,europeanLeagues,allEuropeanClubs,starPlayers,roundRobin,createSeason,freshTable} from '../src/leagues.js';
import {createManager,acceptOffer,beginLiveMatch,advanceLiveMatch,closeSeason,resolvePlayoff,buyItem,shopItems} from '../src/engine.js';

assert.equal(leagueData[0].clubs.length,20,'Premier League has 20 clubs');
for(const l of leagueData.slice(1)) assert.equal(l.clubs.length,24,`${l.name} has 24 clubs`);
assert.equal(roundRobin(leagueData[0].clubs).length,38,'20-team double round robin has 38 rounds');
assert.equal(roundRobin(leagueData[1].clubs).length,46,'24-team double round robin has 46 rounds');
assert.ok(europeanLeagues.length>=8,'eight major overseas leagues are present');
assert.ok(allEuropeanClubs.length>=100,'European club database is populated');
assert.equal(starPlayers['맨체스터 시티'],'엘링 홀란','Manchester City star player is mapped');
assert.equal(starPlayers['맨체스터 유나이티드'],'브루노 페르난데스','Manchester United star player is mapped');

for(const route of ['legend','youth','license','unknown']){
  const initial=createManager(route,'게겐프레싱');
  assert.ok(initial.offers.length>=3&&initial.offers.length<=5,'3–5 manager offers');
  const gm=acceptOffer(initial,initial.offers[0].id);
  assert.ok(gm.club&&gm.salary>0&&gm.fixtures.length>=38,'offer acceptance initializes career');
  assert.equal(gm.table.length,gm.tier===1?20:24,'league table matches division size');
}

const manager=createManager('unknown','게겐프레싱');
let gm=acceptOffer(manager,manager.offers[0].id);
let matches=0;
while(matches<2){
 const started=beginLiveMatch(gm,{rotation:'부분 로테이션',press:'높은 압박',line:'높은 수비라인',tempo:'빠른 템포'});
 assert.ok(started.match,'live match starts');
 let live=started.match,done=null,guard=0;
 while(!done&&guard++<30){
   const step=advanceLiveMatch(gm,live);
   if(step.result){done=step;break;}
   live=step.match;
   if(live.prompt){const decision=advanceLiveMatch(gm,live,live.prompt.options[0]);live=decision.match;}
 }
 assert.ok(done,'match reaches full time');gm=done.gm;matches++;
}
assert.equal(gm.played,2,'league appearances update');
assert.ok(gm.lastResult.fanReactions.length>=3,'fan community reactions are generated per match');
const itemResult=buyItem(gm,shopItems[0]);
assert.ok(itemResult.gm||itemResult.error,'shop purchase returns valid state');
console.log('Smoke tests passed: league sizes, fixture rounds, manager offers, career initialization, live match flow and shop, European league database, club stars and fan reactions.');

// 해외 9개 리그 모두 1·2부를 보유하고, 시즌 종료 시 2개 구단씩 승강한다.
const {createEuropeanWorld,simulateEuropeanWorld}=await import('../src/leagues.js');
const world=createEuropeanWorld();
assert.equal(Object.keys(world).length,9);
for(const [name,league] of Object.entries(world)){
  const beforeTop=league.top.length,beforeSecond=league.second.length;
  const after=simulateEuropeanWorld({[name]:league},2)[name];
  assert.equal(after.lastMovement.filter(x=>x.direction==='승격').length,2,`${name} 승격 수`);
  assert.equal(after.lastMovement.filter(x=>x.direction==='강등').length,2,`${name} 강등 수`);
  assert.equal(after.top.length,beforeTop,`${name} 1부 팀 수 유지`);
  assert.equal(after.second.length,beforeSecond,`${name} 2부 팀 수 유지`);
}
console.log('European promotion/relegation simulation tests passed.');
const seasonReady={...gm,played:gm.tier===1?38:46,fixtures:[],fa:'탈락',carabao:'탈락',table:gm.table.map((r,i)=>({...r,p:gm.tier===1?38:46,pts:i===0?90:35,gf:50,ga:40}))};
const seasonResult=closeSeason(seasonReady);
assert.ok(seasonResult.gm?.europeanWorld,'season close persists overseas league world state');
assert.equal(seasonResult.gm.europeanMovementHistory.length,1,'season close records overseas promotion/relegation history');
console.log('Season close integration test passed.');
