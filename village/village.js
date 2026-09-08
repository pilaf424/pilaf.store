/* The Listening Village: a self-contained first musical RPG chapter. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('village'),ctx=canvas.getContext('2d');
  const W=VillageWorld,ink='#40573f',paper='#fff5db',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveKey='pilaf-listening-village-v1';
  const encoreQuests=[
    {giver:'rabbit',name:'Moon Rabbit',title:'A melody around the pond',guests:['onigiri','cat','axolotl','firefly'],request:'Our first song is lovely. Imagine a few more friends answering the melody! Could you invite Onigiri, Cat Nap, Axolotl and Circuit Firefly, then come back to me?',thanks:'Hear those little answers? The melody has friends now. Tanuki has an idea for the next part.'},
    {giver:'tanuki',name:'Tanuki',title:'A little warmth and wobble',guests:['fox','lion','fuzz','scope'],request:'Rabbit brought the sparkle. How about some warmth underneath? Find Fox, Little Lion, Fuzz Critter and Oscilloscope Smile, then tell me how it went.',thanks:'Warm bass, fuzzy edges, tiny samples. That is a very good tape! Robot has been planning our big finish.'},
    {giver:'robot',name:'Robot',title:'Room for the whole village',guests:['origami','daruma','mushroom','trio'],request:'FINAL FRIENDSHIP MISSION. Invite Origami Bird, Daruma, Mushroom Garden and Transistor Trio. Report back when everyone has a part!',thanks:'ALL FRIENDS ACCOUNTED FOR. The whole village is our band! Meet at the lantern stage for our encore.'}
  ];
  const fresh=()=>({version:1,seed:crypto.getRandomValues(new Uint32Array(1))[0],invited:false,rabbit:false,tanuki:false,robot:false,tape:false,battery:false,metTanuki:false,metRobot:false,festival:false,guests:[],encore:0,encoreAccepted:false,encoreFinale:false,x:690,y:685,volume:.35,muted:false});
  let saveAvailable=true,state=fresh();
  try{const s=JSON.parse(localStorage.getItem(saveKey)||'null');if(s?.version===1){for(const k of ['invited','rabbit','tanuki','robot','tape','battery','metTanuki','metRobot','festival','muted'])state[k]=s[k]===true;if(Number.isInteger(s.seed))state.seed=s.seed>>>0;if(Number.isFinite(s.volume))state.volume=Math.max(0,Math.min(1,s.volume));if(Number.isFinite(s.x)&&Number.isFinite(s.y)&&!W.blocked(s.x,s.y)){state.x=s.x;state.y=s.y;}if(!state.invited){state.rabbit=state.tanuki=state.robot=state.festival=false;}if(!(state.rabbit&&state.tanuki&&state.robot))state.festival=false;else if(Array.isArray(s.guests))state.guests=[...new Set(s.guests.filter(id=>VillageResidents.entities.some(e=>e.id===id)))];}}catch{saveAvailable=false;}
  let sound=new VillageAudio(state.seed),started=false,paused=false,time=0,last=0,route=[],destination=null,arrival=null,nearest=null,modal=null,toastUntil=0,lastSave=0;
  // Older villages keep their band and guests, then pick up the new story at Rabbit.
  try{const s=JSON.parse(localStorage.getItem(saveKey)||'null');if(state.festival&&Number.isInteger(s?.encore)&&s.encore>=0&&s.encore<=encoreQuests.length){state.encore=s.encore;while(state.encore>0&&!encoreQuests.slice(0,state.encore).every(q=>q.guests.every(id=>state.guests.includes(id))))state.encore--;state.encoreAccepted=state.encore<encoreQuests.length&&s.encoreAccepted===true;state.encoreFinale=state.encore===encoreQuests.length&&s.encoreFinale===true;}}catch{}
  let villageTime=0;
  const residentOffsets=new Map();
  const player={x:state.x,y:state.y,face:1,moving:false},camera={x:0,y:0},view={w:1000,h:640,zoom:1},keys=new Set();
  const pad=$('mobile-controls'),padPointers=new Map(),padDirections=new Set(),padButtons=[...pad.querySelectorAll('[data-move]')];
  function syncPad(){padDirections.clear();for(const {direction} of padPointers.values())padDirections.add(direction);for(const button of padButtons){const pressed=padDirections.has(button.dataset.move);button.classList.toggle('pressed',pressed);button.setAttribute('aria-pressed',String(pressed));}}
  function releasePad(id){padPointers.delete(id);syncPad();}
  function clearControls(){keys.clear();const held=[...padPointers];padPointers.clear();syncPad();for(const [id,{button}] of held)if(typeof id==='number'&&button.hasPointerCapture(id))button.releasePointerCapture(id);}
  function pressPad(id,button){if(!started||paused||modal)return;padPointers.set(id,{button,direction:button.dataset.move});route=[];destination=null;arrival=null;syncPad();}
  for(const button of padButtons){
    button.addEventListener('pointerdown',e=>{if(e.button!==0||!started||paused||modal)return;e.preventDefault();canvas.focus({preventScroll:true});button.setPointerCapture(e.pointerId);pressPad(e.pointerId,button);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>releasePad(e.pointerId));
    button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();pressPad('key:'+e.key,button);}});
    button.addEventListener('blur',()=>{for(const [id,entry] of padPointers)if(typeof id==='string'&&entry.button===button)releasePad(id);});
  }
  for(const type of ['contextmenu','selectstart','dragstart'])pad.addEventListener(type,e=>e.preventDefault());
  for(const type of ['touchstart','touchmove'])pad.addEventListener(type,e=>e.preventDefault(),{passive:false});
  const joined=()=>['rabbit','tanuki','robot'].filter(k=>state[k]).length;
  const currentQuest=()=>state.festival?encoreQuests[state.encore]:null;
  const questCount=()=>currentQuest()?.guests.filter(id=>state.guests.includes(id)).length||0;
  const canInvite=id=>!!(state.encoreAccepted&&currentQuest()?.guests.includes(id));
  function persist(){state.x=player.x;state.y=player.y;try{localStorage.setItem(saveKey,JSON.stringify(state));saveAvailable=true;}catch{saveAvailable=false;}}
  function entities(){return W.entities.filter(e=>e.id!=='tape'||!state.tape&&!state.tanuki).map(e=>{
    if(state[e.id]&&['rabbit','tanuki','robot'].includes(e.id))return {...e,x:{rabbit:570,tanuki:720,robot:870}[e.id],y:295};
    const offset=reduced.matches?null:residentOffsets.get(e.id);
    return offset?{...e,x:e.x+offset.x,y:e.y+offset.y}:e;
  });}
  function moveResidents(dt){
    if(reduced.matches)return;
    villageTime+=dt;
    for(const [i,e] of VillageResidents.entities.entries()){
      // Plants stay rooted. Friends stop to chat, and wait for anyone walking over.
      if(e.id==='mushroom'||state.guests.includes(e.id)||arrival===e.id||Math.hypot(player.x-e.x,player.y-e.y)<115)continue;
      const previous=residentOffsets.get(e.id)||{x:0,y:0};
      const target={x:Math.sin(villageTime*.24+i*1.7)*14,y:Math.sin(villageTime*.18+i*.9)*8};
      const next={x:previous.x+(target.x-previous.x)*Math.min(1,dt*.7),y:previous.y+(target.y-previous.y)*Math.min(1,dt*.7)};
      if(!W.blocked(e.x+next.x,e.y+next.y))residentOffsets.set(e.id,next);
    }
  }
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;toastUntil=time+4;}
  function objective(){
    if(!state.invited)return 'Say hello to Crane by the village sign.';
    if(state.festival){const q=currentQuest();if(!q)return state.encoreFinale?'The whole village is playing. Stay and dance!':'Everyone is ready! Return to the lantern stage for the encore.';if(!state.encoreAccepted)return `Talk to ${q.name} at the stage: a new quest is waiting.`;return questCount()===q.guests.length?`All four friends are in! Return to ${q.name}.`:`${q.title}: invite ${questCount()} / ${q.guests.length} friends.`;}
    if(joined()===3)return 'The band is ready! Play your first concert at the lantern stage.';
    if(state.tape&&!state.tanuki)return 'Bring the ribbon-wrapped tape back to Tanuki.';
    if(state.battery&&!state.robot)return 'Take Sprout’s garden battery to Robot.';
    return 'Invite Rabbit, Tanuki and Robot to the little stage.';
  }
  function refresh(){
    $('objective').textContent=objective();const q=currentQuest();$('band-count').textContent=state.festival?`${q?questCount():state.guests.length} / ${q?q.guests.length:VillageResidents.entities.length}`:`${joined()} / 3`;
    $('band-label').textContent=state.festival?(q?'quest friends':'neighbors'):'bandmates';$('chapter-label').textContent=state.festival?(q?`QUEST ${state.encore+2} · ${q.title}`:'THE VILLAGE ENCORE'):'QUEST 1 · A BAND, TOGETHER';$('guest-count').textContent=state.festival?`${state.guests.length} neighbors in the music`:'';
    sound.setLayers({rabbit:state.rabbit,tanuki:state.tanuki,robot:state.robot,festival:state.festival,guests:state.guests});
    sound.volume=state.volume;sound.muted=state.muted;sound.applyVolume();
    $('volume').value=Math.round(state.volume*100);$('sound').textContent=started&&!state.muted?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(started&&!state.muted));
    $('music-caption').textContent=state.guests.length?`${state.guests.length} neighbor parts · taking turns in the song`:state.festival?'The village band · a song that keeps growing':joined()?`${joined()} voices in the garden`:'A quiet garden';
  }
  function focusPanel(id){modal=id;clearControls();route=[];arrival=null;destination=null;player.moving=false;$(id).hidden=false;$('interact').hidden=true;pad.hidden=true;$(id).querySelector('button')?.focus({preventScroll:true});}
  function closePanels(){for(const id of ['dialogue','journal'])$(id).hidden=true;modal=null;keys.clear();pad.hidden=!started||paused;canvas.focus({preventScroll:true});}
  function portrait(kind){const c=$('portrait'),p=c.getContext('2d');p.clearRect(0,0,120,120);if(kind.startsWith('resident:'))VillageResidents.draw(p,kind.slice(9),60,111,{scale:1.2,still:true});else if(['sprout','tape','stage'].includes(kind)){p.fillStyle='#577750';p.font='40px serif';p.textAlign='center';p.fillText(kind==='sprout'?'❧':'♫',60,78);}else PilafSprites.draw(p,kind,60,97,{scale:1.2,time:0});}
  function say(entity,text,actions=[]){
    closePanels();$('dialogue-name').textContent=entity.name;$('dialogue-role').textContent=entity.role;$('dialogue-text').textContent=text;$('dialogue-extra').replaceChildren();$('dialogue-actions').replaceChildren();portrait(entity.kind);
    for(const [label,action] of actions){const b=document.createElement('button');b.textContent=label;b.className='primary';b.addEventListener('click',action);$('dialogue-actions').append(b);}
    if(!actions.length){const b=document.createElement('button');b.textContent='See you in a little while';b.onclick=closePanels;$('dialogue-actions').append(b);}
    focusPanel('dialogue');
  }
  function recruit(id){state[id]=true;persist();refresh();sound.chime();toast(`${{rabbit:'Rabbit’s melody',tanuki:'Tanuki’s warm bass',robot:'Robot’s pocket rhythm'}[id]} joins the song.`);}
  function melodyPuzzle(e){
    say(e,'It goes Leaf, Star, Moon. Can you play it back? Take your time; the notes are written down below.');
    const extra=$('dialogue-extra'),pattern=document.createElement('div');pattern.className='note-pattern';pattern.textContent='Leaf ♩ → Star ♫ → Moon ♪';extra.append(pattern);
    const row=document.createElement('div');row.className='note-buttons';const status=document.createElement('p');status.className='puzzle-status';status.setAttribute('role','status');status.textContent='Your turn. Start with Leaf.';let sequence=[];
    for(const [index,name] of ['Leaf ♩','Moon ♪','Star ♫'].entries()){const b=document.createElement('button');b.textContent=name;b.dataset.note=index;b.onclick=()=>{sound.preview(index);sequence.push(index);if(sequence[sequence.length-1]!==[0,2,1][sequence.length-1]){sequence=[];status.textContent='A new little tune! Try Leaf, Star, Moon again.';}else if(sequence.length===3){recruit('rabbit');say(e,'That’s it! It sounds like sunlight on the pond. I’ll bring my theremin to the stage.',['Lovely. See you there!'].map(label=>[label,closePanels]));}else status.textContent=`${sequence.length} / 3 notes remembered.`;};row.append(b);}
    extra.append(row,status);const listen=document.createElement('button');listen.textContent='Hear it again';listen.onclick=()=>{if(sound.context)[0,2,1].forEach((n,i)=>sound.note([261.63,329.63,392][n],sound.context.currentTime+i*.5,.4,.1));};extra.append(listen);
  }
  function bandmateQuest(e){
    const q=currentQuest();
    if(!q){say(e,state.encoreFinale?'Look at everyone dancing! A little band became a whole village.':'Everyone has a part now. Visit the lantern stage and start our village encore.');return;}
    if(e.id!==q.giver){say(e,`${q.name} has our next idea. Have a little chat with them here at the stage.`,[[`Go to ${q.name}`,()=>{closePanels();goTo(q.giver);}]]);return;}
    if(!state.encoreAccepted){say(e,q.request,[['I will invite them',()=>{state.encoreAccepted=true;persist();refresh();say(e,questCount()?`You already know ${questCount()} of these musical friends! Their invitations count. Your field notes show who is left.`:'Four names, tucked into your field notes. Come back when they have joined our song.',[['Open my quest notes',openJournal],['Let me wander',closePanels]]);}],['In a little while',closePanels]]);return;}
    if(questCount()<q.guests.length){say(e,`${questCount()} / ${q.guests.length} friends have joined. There is still room in our song! Your field notes show the friends we are waiting for.`,[['Check the invitations',openJournal],['Back to the village',closePanels]]);return;}
    say(e,'All four invitations delivered! Ready to hear how our band has grown?',[['Everyone is ready',()=>{if(currentQuest()!==q||questCount()!==q.guests.length)return;state.encore++;state.encoreAccepted=false;persist();refresh();sound.chime();say(e,q.thanks,[['On to the next little adventure',closePanels]]);toast(`${q.title} complete!`);}]]);
  }
  function talk(id){
    const e=entities().find(e=>e.id===id);if(!e)return;
    if(e.ambient){
      if(state.guests.includes(id))say(e,`Listen for my ${e.part.toLowerCase()} in our song. We take turns, so everybody gets a little space to shine.`,[['Listen to my part',()=>sound.audition(id)],['See you around the village',closePanels]]);
      else if(!canInvite(id))say(e,e.dialogue+(state.festival?` Your bandmates have more invitations planned. Check in with ${currentQuest()?.name||'the band'} at the stage.`:' Play your first concert, then ask the bandmates about inviting more of us.'));
      else say(e,e.invitation,[['Join our music',()=>{if(!canInvite(id)||state.guests.includes(id))return;state.guests.push(id);persist();refresh();sound.audition(id);say(e,`I’m in! Listen for my ${e.part.toLowerCase()}. I’ll play and dance right here, so the whole village can be our stage.`,[['Lovely. Let’s keep wandering',closePanels]]);toast(questCount()===currentQuest().guests.length?`All four friends are in! Return to ${currentQuest().name}.`:`${e.name} joins: ${e.part.toLowerCase()}.`);}],['Maybe in a little while',closePanels]]);
      return;
    }
    if(state.festival&&['rabbit','tanuki','robot'].includes(id)){bandmateQuest(e);return;}
    if(id==='crane'){
      if(!state.invited)say(e,'Oh, Tempura! Perfect timing. The lanterns are up, but our stage is terribly quiet. Could you invite Rabbit, Tanuki and Robot? They each have a little something on their mind.',[['I’ll get the band together',()=>{state.invited=true;persist();refresh();say(e,'Three invitations, tucked safely in your pocket. Rabbit is by the pond, Tanuki by the tape cottage, and Robot down in the garden. Your field notes can show you the way.',[['Let’s wander',closePanels]]);}]]);
      else say(e,state.festival?objective():joined()===3?'Three invitations delivered! Play your first concert at the stage. Your bandmates might have some ideas after that.':'No rush. A good band starts with being a good neighbor. Your field notes will help you find everyone.');
    }else if(id==='rabbit'){
      if(state.rabbit)say(e,state.festival?'Listen! Our little tune has grown branches. I wonder where it will wander next.':'My theremin is all warmed up. I’m saving a place for you.');
      else if(!state.invited)say(e,'Hello, little microphone. I’m trying to remember a tune. Crane was looking for you, by the village sign.');
      else say(e,'A concert? How lovely. But the last three notes of my melody have floated right out of my ears. Will you help me remember them?', [['Let’s find your melody',()=>melodyPuzzle(e)]]);
    }else if(id==='tanuki'){
      if(state.tanuki)say(e,'The tape still has a little wobble. That’s the nice part. Every loop is a tiny bit different.');
      else if(!state.invited)say(e,'Welcome! Mind the ribbons. I’m quite organized, except for all the things I’ve misplaced. Have you met Crane?');
      else if(state.tape)say(e,'My favorite tape! You found it! There’s a lovely warm bass line on here. I’ll bring it to the concert.',[['Give Tanuki the tape',()=>{recruit('tanuki');closePanels();}]]);
      else{state.metTanuki=true;persist();say(e,'I’d love to play, but my ribbon-wrapped tape has gone wandering. I was having tea on the little bench south of my cottage. Perhaps I left it there?', [['I’ll look by the bench',()=>{closePanels();goTo('tape');}]]);}
    }else if(id==='tape'){
      if(!state.invited)say(e,'A little tape with a pink ribbon. Someone is going to miss this. Perhaps Crane knows who lives here.');
      else say(e,'A pink ribbon, a handwritten label: “a very good bass line.” This must be Tanuki’s missing tape.',[['Pick up the tape',()=>{state.tape=true;persist();refresh();sound.chime();toast('A ribbon-wrapped tape, safely in your pocket.');closePanels();}]]);
    }else if(id==='robot'){
      if(state.robot)say(e,'BUM. tick. BUM. tick. Friendship tempo: just right.');
      else if(!state.invited)say(e,'HELLO, NEW FRIEND. Concert plans are handled by Crane. Rhythm plans are handled by me. Usually.');
      else if(state.battery)say(e,'A garden battery! It smells faintly of clover. My rhythm is coming back. May I join your band?', [['Share the battery',()=>{recruit('robot');closePanels();}]]);
      else{state.metRobot=true;persist();say(e,'I have eight excellent beats and zero battery. Capacitor Sprout grows spare garden batteries, just west of here. Could you ask for one?', [['Let’s visit Sprout',()=>{closePanels();goTo('sprout');}]]);}
    }else if(id==='sprout'){
      if(state.battery||state.robot)say(e,'Sprout sways happily. A little spare energy goes a long way. The leaves seem to be keeping time.');
      else if(!state.invited)say(e,'A tiny face peeks out between the leaves. Sprout gives you a shy little wave.');
      else say(e,'Sprout rustles, thinks for a moment, and offers a tiny seed-shaped battery. A tag reads: “for a friend who needs a little rhythm.”', [['Thank you, Sprout',()=>{state.battery=true;persist();refresh();sound.chime();toast('A garden battery for Robot.');closePanels();}]]);
    }else if(id==='stage'){
      if(state.festival&&state.encore===encoreQuests.length&&!state.encoreFinale)say(e,'Every invitation has found a friend. From the pond to the garden, the whole village is ready. Shall we play our encore?',[['Start the village encore',()=>{state.encoreFinale=true;persist();refresh();sound.chime();closePanels();toast('A whole village, one song. Your encore!');}]]);
      else if(state.festival)say(e,`“${sound.song.title}.” Our song keeps changing. ${objective()}`,state.encoreFinale?[['Stay and listen',closePanels]]:[['Find my next quest',openJournal]]);
      else if(joined()<3)say(e,'Lanterns overhead. A little microphone stand. Three empty places for three very good friends. The concert can begin once everyone is here.',[['Check my field notes',()=>{closePanels();openJournal();}]]);
      else say(e,'Rabbit has a melody. Tanuki has a bass line. Robot has a pocket full of rhythm. All they need now is you.',[['Let’s play our song',()=>{state.festival=true;persist();refresh();sound.chime();closePanels();toast('A village, listening together. Your first concert!');}]]);
    }
  }
  function goTo(id){const e=entities().find(e=>e.id===id);if(!e)return;walkTo({x:e.x,y:e.y+42},id);toast(`Wandering over to ${id==='stage'?'the lantern stage':e.name}…`);}
  function walkTo(point,id=null){route=W.path(player,point);destination=route.at(-1)||null;arrival=id;if(!route.length){arrival=null;toast('Try a little patch of open ground.');}}
  function openJournal(){
    if(!started||paused)return;closePanels();const q=currentQuest();
    $('journal-title').textContent=state.festival?(q?q.title:'The village encore.'):'A band, together.';
    $('neighbors-button').textContent='Meet the neighbors';$('neighbors-button').onclick=openNeighbors;$('new-game').hidden=false;
    $('journal-intro').textContent=state.festival?objective():state.invited?'Little favors make a very good band. Tap Visit and Tempura will walk over.':'Crane has something for you. Find the postbird by the village sign.';
    $('journal-list').replaceChildren();
    let entries;
    if(state.festival){
      if(!q)entries=[['stage','The lantern stage',state.encoreFinale?'The whole village is playing!':'Start the village encore.',state.encoreFinale]];
      else if(!state.encoreAccepted)entries=[[q.giver,q.name,'Talk at the stage and accept the next invitation quest.',false]];
      else entries=[...q.guests.map(id=>{const e=VillageResidents.entities.find(e=>e.id===id);return [id,e.name,state.guests.includes(id)?'Invited and playing.':e.part+' - invite this friend.',state.guests.includes(id)];}),[q.giver,q.name,questCount()===q.guests.length?'All four joined! Return and complete your quest.':'Return after all four friends have joined.',false]];
    }else entries=(state.invited?[['rabbit','Moon Rabbit','Remember a three-note tune.'],['tanuki','Tanuki Tape Courier',state.tape?'Return the tape.':'Find the tape by the tea bench.'],['robot','Pocket Sequencer Robot',state.battery?'Bring over the garden battery.':'Ask Capacitor Sprout for a battery.'],['stage','The lantern stage','Meet here when all three friends are ready.']]:[['crane','Crane Note Delivery','Pick up the invitations.']]).map(([id,name,task])=>[id,name,state[id]?'At the stage, ready to play.':task,!!state[id]]);
    for(const [id,name,task,done] of entries){const row=document.createElement('div');row.className='journal-row';const mark=document.createElement('span');mark.className='mark';mark.textContent=done?'\u2713':'!';const content=document.createElement('div'),title=document.createElement('h3'),copy=document.createElement('p');title.textContent=name;copy.textContent=task;content.append(title,copy);const visit=document.createElement('button');visit.textContent='Visit';visit.dataset.visit=id;visit.onclick=()=>{closePanels();goTo(id);};row.append(mark,content,visit);$('journal-list').append(row);}
    const bag=[];if(state.invited)bag.push('invitations');if(state.tape&&!state.tanuki)bag.push('ribbon-wrapped tape');if(state.battery&&!state.robot)bag.push('garden battery');
    $('inventory').textContent=state.festival?`${state.guests.length} / ${VillageResidents.entities.length} neighbors in the song. Already invited friends count toward each quest.`:'In your pocket: '+(bag.join(', ')||'a little curiosity')+'.';
    $('save-status').textContent=saveAvailable?'Your progress saves in this browser on this device.':'Browser storage is unavailable. You can play, but progress may not survive closing this page.';$('new-game').textContent='Start a new village';$('new-game').onclick=confirmNew;focusPanel('journal');
  }
  function confirmNew(){say({name:'A fresh little beginning?',role:'Your current village will be replaced',kind:'shrimp'},'This clears this village’s quest progress and starts a new song. Your other PILAF games are untouched.',[['Keep my village',closePanels],['Start fresh',()=>{sound.stop();state=fresh();residentOffsets.clear();villageTime=0;sound=new VillageAudio(state.seed);Object.assign(player,{x:state.x,y:state.y});persist();closePanels();refresh();sound.start().catch(audioFailed);toast('A fresh morning in the village.');}]]);}
  function openNeighbors(){
    closePanels();$('journal-title').textContent='A village full of friends.';$('journal-intro').textContent='Your bandmates suggest new friends after the first concert. Green notes mark the invitations in your current quest.';$('journal-list').replaceChildren();
    for(const e of VillageResidents.entities){const row=document.createElement('div');row.className='journal-row';const content=document.createElement('div'),name=document.createElement('h3'),role=document.createElement('p');name.textContent=e.name;role.textContent=state.guests.includes(e.id)?'Playing: '+e.part:canInvite(e.id)?'Quest invitation: '+e.part:e.role;content.append(name,role);const button=document.createElement('button');button.textContent=state.guests.includes(e.id)?'Listen':'Visit';button.dataset.visit=e.id;button.onclick=()=>{closePanels();goTo(e.id);};row.append(content,button);$('journal-list').append(row);}
    $('inventory').textContent=joined()===3?`${state.guests.length} / ${VillageResidents.entities.length} neighbors in the music. Gold ! = quest; green music note = invitation.`:'Gold ! markers show your next quest conversations.';$('neighbors-button').textContent='Back to my quest';$('neighbors-button').onclick=openJournal;$('new-game').hidden=true;focusPanel('journal');
  }
  function audioFailed(){state.muted=true;refresh();toast('Sound couldn’t start. Tap Sound off to try again.');}
  async function start(){started=true;paused=false;pad.hidden=false;$('welcome').hidden=true;$('pause').disabled=false;canvas.focus({preventScroll:true});refresh();if(!state.muted)await sound.start().catch(audioFailed);persist();}
  function pause(){if(!started||paused)return;paused=true;clearControls();pad.hidden=true;route=[];arrival=null;destination=null;sound.stop();persist();closePanels();$('pause-panel').hidden=false;$('resume').focus();$('pause').textContent='Resume';}
  function resume(){paused=false;pad.hidden=false;$('pause-panel').hidden=true;$('pause').textContent='Pause';last=performance.now();if(!state.muted)sound.start().catch(audioFailed);canvas.focus({preventScroll:true});}
  $('start').onclick=start;$('pause').onclick=()=>paused?resume():pause();$('resume').onclick=resume;$('journal-button').onclick=openJournal;$('close-journal').onclick=closePanels;$('close-dialogue').onclick=closePanels;$('interact').onclick=()=>nearest&&talk(nearest.id);
  $('sound').onclick=async()=>{state.muted=!state.muted;if(started&&!paused&&!state.muted)await sound.start().catch(audioFailed);refresh();persist();};
  $('volume').oninput=()=>{state.volume=Number($('volume').value)/100;refresh();persist();};
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Tab'&&(modal||paused||!started)){const panel=$(paused?'pause-panel':modal||'welcome'),buttons=[...panel.querySelectorAll('button,a[href],input')].filter(b=>!b.disabled);if(buttons.length){const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
    if(e.key==='Escape'&&!e.repeat&&started){e.preventDefault();if(paused)resume();else if(modal)closePanels();else pause();return;}
    if(e.target!==canvas||!started||paused||modal)return;
    const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e',' ','j'].includes(k))e.preventDefault();
    if((k==='e'||k===' ')&&!e.repeat){if(nearest)talk(nearest.id);return;}if(k==='j'&&!e.repeat){openJournal();return;}keys.add(k);route=[];destination=null;arrival=null;
  });
  window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());releasePad('key:'+e.key);});canvas.addEventListener('blur',()=>keys.clear());
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',persist);
  for(const type of ['contextmenu','selectstart','dragstart'])canvas.addEventListener(type,e=>e.preventDefault());
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{if(!started||paused||modal||!e.isPrimary||e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const press=pointer;pointer=null;if(!started||paused||modal||Math.hypot(e.clientX-press.x,e.clientY-press.y)>30)return;const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)/view.zoom+camera.x,y:(e.clientY-r.top)/view.zoom+camera.y};const badge=entities().find(t=>{if(!markerFor(t))return false;const m=markerPosition(t);return Math.hypot(p.x-t.x,p.y-m.y)<24/view.zoom;});if(badge){if(Math.hypot(player.x-badge.x,player.y-badge.y)<85)talk(badge.id);else goTo(badge.id);return;}const target=entities().map(t=>({e:t,d:Math.hypot(p.x-t.x,p.y-(t.kind==='stage'?t.y+20:t.y-22))})).sort((a,b)=>a.d-b.d)[0];if(target&&target.d<Math.max(40,28/view.zoom)){if(Math.hypot(player.x-target.e.x,player.y-target.e.y)<85)talk(target.e.id);else goTo(target.e.id);}else walkTo(p);});
  for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>pointer=null);
  function update(dt){
    if(!started||paused||modal){player.moving=false;return;}
    moveResidents(dt);
    let dx=(keys.has('arrowright')||keys.has('d')||padDirections.has('right')?1:0)-(keys.has('arrowleft')||keys.has('a')||padDirections.has('left')?1:0),dy=(keys.has('arrowdown')||keys.has('s')||padDirections.has('down')?1:0)-(keys.has('arrowup')||keys.has('w')||padDirections.has('up')?1:0);
    const manual=!!(dx||dy);
    if(route.length&&!dx&&!dy){let p=route[0],dist=Math.hypot(p.x-player.x,p.y-player.y);if(dist<5){route.shift();p=route[0];}if(p){dx=p.x-player.x;dy=p.y-player.y;}else{destination=null;if(arrival){const id=arrival;arrival=null;const e=entities().find(e=>e.id===id);if(e&&Math.hypot(player.x-e.x,player.y-e.y)<90){talk(id);return;}}}}
    const len=Math.hypot(dx,dy),speed=165*dt;player.moving=len>0;
    if(len){const step=manual?speed:Math.min(speed,len);dx=dx/len*step;dy=dy/len*step;if(Math.abs(dx)>.01)player.face=dx>0?1:-1;if(!W.blocked(player.x+dx,player.y))player.x+=dx;if(!W.blocked(player.x,player.y+dy))player.y+=dy;}
    nearest=entities().filter(e=>Math.hypot(e.x-player.x,e.y-player.y)<85).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
    $('interact').hidden=!nearest;if(nearest)$('interact').textContent=(nearest.id==='stage'?'Visit ':nearest.id==='tape'?'Inspect ':'Talk to ')+nearest.name;
    const place=player.y<365&&player.x>500&&player.x<900?'The Lantern Stage':player.x<480&&player.y<550?'Moonwater Pond':player.x>950&&player.y<700?'Ribbon Cottage':player.y>740?'The Battery Garden':'Lantern Lane';$('location').textContent=place;
    if(time-lastSave>3&&player.moving){persist();lastSave=time;}
  }
  function ellipse(x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.7;ctx.stroke();}}
  function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.7;ctx.stroke();}}
  function line(points,color,width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  function label(text,x,y,size=12,color=ink){ctx.fillStyle=color;ctx.font=`${size}px system-ui`;ctx.textAlign='center';ctx.fillText(text,x,y);}
  function sprout(x,y){const sway=reduced.matches?0:Math.sin(time*1.7+x)*2;ellipse(x,y+2,22,7,'#586c3820');line([[x-8,y],[x-8,y-10]],ink);line([[x+8,y],[x+8,y-10]],ink);round(x-18,y-44,36,33,10,'#a6c388',ink);line([[x-16,y-34],[x+16,y-34]],'#7f9f66');line([[x,y-44],[x+sway,y-61]],'#6e8f58',2);ellipse(x-10+sway,y-57,11,5,'#a6bf80','#7b9861');ellipse(x+10+sway,y-63,12,5,'#bbcd99','#7b9861');ellipse(x-6,y-27,1.8,2.3,ink);ellipse(x+6,y-27,1.8,2.3,ink);ctx.beginPath();ctx.arc(x,y-22,4,0,Math.PI);ctx.strokeStyle=ink;ctx.stroke();}
  function tree(t){ellipse(t.x+10,t.y+8,t.r*.95,18,'#71895120');round(t.x-8,t.y-65,16,69,5,'#9a9c6b');ellipse(t.x,t.y-62,t.r,t.r*.8,'#819d70');ellipse(t.x-18,t.y-80,t.r*.65,t.r*.6,'#93ad7b');ellipse(t.x+16,t.y-87,t.r*.65,t.r*.65,'#a2ba84');ellipse(t.x-4,t.y-101,t.r*.5,t.r*.5,'#b1c58e');for(let i=0;i<4;i++)ellipse(t.x-25+i*17,t.y-75-(i%2)*25,3,3,'#d9ce8c');}
  function landscape(){
    ctx.fillStyle='#dae4c0';ctx.fillRect(0,0,W.width,W.height);
    for(const [x,y,rx,ry] of [[340,600,360,280],[1140,520,350,300],[660,970,510,150]])ellipse(x,y,rx,ry,'#e1e8c9');
    const paths=[[[720,1020],[700,730],[720,535],[715,315]],[[720,550],[525,535],[390,420]],[[720,550],[905,510],[1090,470]],[[710,745],[850,815],[1040,840]],[[710,745],[590,815],[485,825]],[[1085,485],[1125,560],[1150,665]]];
    for(const p of paths){line(p,'#cdd5b0',86);line(p,'#eae3c7',76);line(p,'#f0e9d0',56);}
    for(let i=0;i<140;i++){const x=(i*173+71)%1390+25,y=(i*227+111)%970+60;if(W.blocked(x,y))continue;const shade=['#b2c38e','#b9c99a','#ced4a1'][i%3];line([[x-3,y],[x,y-5],[x+3,y]],shade,1.2);if(i%4===0){ellipse(x+4,y-5,3,2,'#efce9d');ellipse(x+4,y-5,1,1,'#ad9d65');}}
    // The pond and its tiny wave-shaped fish.
    ellipse(235,295,137,100,'#bdcba6');ellipse(235,288,124,92,'#a9c9bc','#97b6a3');ellipse(217,270,102,73,'#b8d4c2');
    for(let i=0;i<5;i++){const y=240+i*22,x=166+(i%2)*45;line([[x,y],[x+30,y-2],[x+55,y]],'#dbe7cd',2);}
    for(let i=0;i<3;i++){const a=(reduced.matches?0:time*.13)+i*2,x=235+Math.cos(a)*70,y=285+Math.sin(a)*48;ellipse(x,y,12,5,i%2?'#e9d8b5':'#d6ad83');line([[x-10,y],[x-18,y-5],[x-16,y+5],[x-10,y]],'#c8b387',2);}
    for(const [x,y] of [[160,335],[285,230],[310,320]]){ellipse(x,y,13,6,'#86ae8c');ellipse(x+3,y-3,4,3,'#f0d4c3');}
    // Raised lantern stage, open at the front.
    ellipse(720,325,175,42,'#9bad8120');round(555,255,330,78,20,'#adba88','#829568');round(555,245,330,73,20,'#dfd5af','#96a275');for(let i=0;i<5;i++)line([[565,255+i*12],[875,255+i*12]],'#c4bb97',1);round(665,318,110,15,5,'#c9c79e');
    for(const x of [560,880]){round(x-4,125,8,140,4,'#8c9d70');ellipse(x,115,15,18,'#b1c38e');}
    ctx.beginPath();ctx.moveTo(552,153);ctx.quadraticCurveTo(720,100,888,153);ctx.lineTo(888,173);ctx.quadraticCurveTo(720,126,552,173);ctx.closePath();ctx.fillStyle='#e8cf9c';ctx.fill();ctx.strokeStyle='#a5ac7b';ctx.stroke();
    ctx.beginPath();ctx.moveTo(560,170);ctx.quadraticCurveTo(720,245,880,170);ctx.strokeStyle='#8d9c70';ctx.stroke();
    for(let i=0;i<9;i++){const x=560+i*40,y=170+Math.sin(i/8*Math.PI)*36;ellipse(x,y+10,12,16,state.festival?'#f0d78b55':'#e8d49633');round(x-5,y,10,17,4,i%2?'#ddbd78':'#b9c693');}
    round(665,153,110,25,8,'#f6edd0','#b1b18a');label('the little stage',720,170,10,'#7a8967');
    for(const x of [580,848]){round(x,262,20,36,5,'#829776',ink);ellipse(x+10,283,6,8,'#bccbaa',ink);}
    line([[720,287],[720,314]],ink,2);ellipse(720,281,5,9,'#acc0a1',ink);
    // Tanuki's cottage, with a cassette-shaped window.
    ellipse(1110,374,130,18,'#788b5820');round(1010,240,200,130,14,'#f1dfb8','#a6ac7b');
    ctx.beginPath();ctx.moveTo(988,248);ctx.lineTo(1040,190);ctx.quadraticCurveTo(1110,166,1180,190);ctx.lineTo(1232,248);ctx.closePath();ctx.fillStyle='#acb889';ctx.fill();ctx.strokeStyle='#889a70';ctx.stroke();for(let i=0;i<6;i++)line([[1020+i*34,240],[1048+i*25,198]],'#bbc697',2);
    round(1088,305,43,65,18,'#a8b48c','#8fa079');ellipse(1120,341,2,2,'#f7dc92');round(1030,275,47,35,8,'#a2b7a0','#889d7c');ellipse(1042,290,7,7,'#e2dec0');ellipse(1064,290,7,7,'#e2dec0');line([[1043,304],[1064,304]],'#dce3bf');
    round(1148,276,43,31,5,'#c6d1a8');line([[1169,277],[1169,306]],'#96a780');round(1143,309,54,9,3,'#b29f75');for(let i=0;i<4;i++)ellipse(1150+i*13,306,6,6,'#879f6d');
    round(1038,387,146,24,7,'#f7edcc','#b6ba8c');label('ribbon & reel',1111,404,11,'#7c8d65');
    // A tea bench and its mug.
    round(1100,610,95,16,5,'#c3ad82','#989e70');line([[1110,625],[1110,650]],'#999970',4);line([[1185,625],[1185,650]],'#999970',4);round(1100,586,95,18,5,'#d3bd91','#989e70');round(1172,598,12,13,4,'#f8ebcf');
    // Robot's workbench, garden rows and quietly inhabited planting beds.
    round(922,755,130,54,9,'#c7bb90','#95a076');round(932,766,40,24,4,'#adc39f');for(let i=0;i<4;i++)ellipse(987+i*15,778,4,4,['#cf9b7c','#c6c58d','#a0bba1','#e0cc8e'][i]);
    for(let i=0;i<3;i++){round(390,874+i*24,185,16,8,'#c7bb95');for(let j=0;j<7;j++){const x=403+j*24,y=876+i*24;line([[x,y],[x,y-12]],'#889e6b');ellipse(x-4,y-8,5,3,'#9eb67a');ellipse(x+4,y-12,5,3,'#b2c58a');}}
    // The village sign and a few residents who simply belong here.
    line([[925,662],[925,710]],'#9aa676',4);round(872,637,107,27,6,'#f5e5bb','#a5ac7c');label('make a little music',926,655,9,'#819067');
    sprout(370,730);sprout(1000,620);
    for(let i=0;i<4;i++){const x=570+i*15+(reduced.matches?0:Math.sin(time*.5)*8),y=915+(reduced.matches?0:Math.sin(time*2+i)*2);ellipse(x,y,10,8,i===3?'#aec18d':'#d5c293','#8ca072');if(i<3)line([[x-3,y-6],[x-3,y+6]],'#a98865',2);else{ellipse(x+2,y-2,1,2,ink);line([[x+1,y-7],[x-2,y-16]],'#879d71');}}
    for(const [x,y] of [[570,465],[920,570],[655,840]]){round(x,y-30,5,35,2,'#8e9f73');ellipse(x+2,y-42,15,20,'#f7dea13b');round(x-5,y-59,15,27,6,'#e6cc8d','#a5aa75');}
  }
  function drawEntity(e){
    if(e.ambient){ellipse(e.x,e.y+1,24,7,'#526c431a');VillageResidents.draw(ctx,e.id,e.x,e.y,{time:villageTime,still:reduced.matches,dance:state.guests.includes(e.id)&&state.festival,bpm:sound.song.bpm});}
    else if(e.kind==='sprout')sprout(e.x,e.y);
    else if(e.kind==='tape'){ellipse(e.x,e.y+2,20,6,'#7c8f5720');round(e.x-17,e.y-22,34,22,4,'#e7c9b0','#9b9672');ellipse(e.x-8,e.y-12,5,5,'#fbebcf','#9b9672');ellipse(e.x+8,e.y-12,5,5,'#fbebcf','#9b9672');line([[e.x,e.y-23],[e.x,e.y]],'#ba7f78',3);ellipse(e.x-4,e.y-25,6,3,'#d9a29b');ellipse(e.x+4,e.y-25,6,3,'#d9a29b');}
    else if(e.kind!=='stage'){ellipse(e.x,e.y+1,26,8,'#526c4320');PilafSprites.draw(ctx,e.kind,e.x,e.y,{scale:1.12,time:reduced.matches?0:villageTime,dance:state[e.id]&&state.festival});}
    if(e.kind!=='stage'){const names={crane:'Crane',rabbit:'Moon Rabbit',tanuki:'Tanuki',robot:'Robot',sprout:'Sprout',tape:'a lost tape',onigiri:'Onigiri',cat:'Cat Nap',fox:'Fox',axolotl:'Axolotl',daruma:'Daruma',mushroom:'Mushroom Garden',origami:'Origami Bird',lion:'Little Lion',firefly:'Firefly',scope:'Oscilloscope',fuzz:'Fuzz Critter',trio:'Transistor Trio'};label(names[e.id]||e.name,e.x,e.y+21,10,'#708362');}
  }
  function markerFor(e){
    if(e.ambient)return state.guests.includes(e.id)?'playing':canInvite(e.id)?'invite':null;
    if(e.id==='crane')return !state.invited?'quest':null;
    if(e.id==='stage')return joined()===3&&!state.festival||state.festival&&state.encore===encoreQuests.length&&!state.encoreFinale?'quest':null;
    const q=currentQuest();if(q&&e.id===q.giver)return !state.encoreAccepted||questCount()===q.guests.length?'quest':null;
    if(['rabbit','tanuki','robot'].includes(e.id))return state.invited&&!state[e.id]?'quest':null;
    return state.invited&&(e.id==='tape'||e.id==='sprout'&&!state.battery&&!state.robot)?'quest':null;
  }
  // Draw markers after scenery and characters: trees can never cover a quest.
  // Screen-sized badges stay readable when the phone camera zooms out.
  function markerPosition(e){
    const playing=markerFor(e)==='playing',radius=(playing?11:17)/view.zoom;
    const bob=reduced.matches||playing?0:Math.sin(time*2.5+e.x)*3/view.zoom;
    return {y:Math.max(radius+8/view.zoom,e.y+(e.kind==='stage'?48:-102)-radius/2+bob)};
  }
  function drawMarker(e){
    const kind=markerFor(e);if(!kind)return;
    const playing=kind==='playing',{y}=markerPosition(e);
    ctx.save();ctx.translate(e.x,y);ctx.scale(1/view.zoom,1/view.zoom);
    ctx.shadowColor='#334b3c55';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.arc(0,0,playing?11:17,0,Math.PI*2);ctx.fillStyle=kind==='quest'?'#ffce54':playing?'#fff5db':'#34715a';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#fff9e8';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=kind==='quest'?'#413919':playing?'#34715a':'#fff9e8';ctx.font=`bold ${playing?15:24}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(kind==='quest'?'!':'♪',0,1);ctx.restore();
  }
  function draw(){
    const tx=Math.max(0,Math.min(W.width-view.w,player.x-view.w*.5)),ty=Math.max(0,Math.min(W.height-view.h,player.y-view.h*.55));camera.x+=(tx-camera.x)*.14;camera.y+=(ty-camera.y)*.14;
    ctx.setTransform(canvas.width/view.w,0,0,canvas.height/view.h,0,0);ctx.clearRect(0,0,view.w,view.h);ctx.save();ctx.translate(-camera.x,-camera.y);landscape();
    if(destination){ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(player.x,player.y);for(const p of route)ctx.lineTo(p.x,p.y);ctx.strokeStyle='#8a9e7180';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);ellipse(destination.x,destination.y,10,5,'#fff6d880','#9aad77');}
    const things=[...W.trees.map(t=>({...t,type:'tree'})),...entities().map(e=>({...e,type:'entity'})),{...player,type:'player'}].sort((a,b)=>a.y-b.y);
    for(const item of things){if(item.x<camera.x-100||item.x>camera.x+view.w+100||item.y<camera.y-80||item.y>camera.y+view.h+150)continue;if(item.type==='tree')tree(item);else if(item.type==='entity')drawEntity(item);else{ellipse(player.x,player.y+2,24,8,'#53664029');PilafSprites.draw(ctx,'shrimp',player.x,player.y,{scale:1.15,time:reduced.matches?0:time,moving:player.moving,face:player.face,dance:state.festival&&Math.hypot(player.x-720,player.y-330)<100});}}
    for(const e of entities())drawMarker(e);
    if(state.festival&&!reduced.matches)for(let i=0;i<12;i++){const x=580+(i*37)%290+Math.sin(time+i)*8,y=270-((time*18+i*19)%100);label(i%2?'♪':'♫',x,y,13,['#b29464','#9aaa73','#c29585'][i%3]);}
    ctx.restore();
    // Soft edge shade keeps the world feeling like a little illustrated diorama.
    const shade=ctx.createLinearGradient(0,0,0,view.h);shade.addColorStop(0,'#80966c10');shade.addColorStop(.2,'#80966c00');shade.addColorStop(.8,'#80966c00');shade.addColorStop(1,'#7e936818');ctx.fillStyle=shade;ctx.fillRect(0,0,view.w,view.h);
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),base=r.width<700?(r.height>r.width?.62:.78):1;view.zoom=Math.max(base,r.width/W.width,r.height/W.height);view.w=r.width/view.zoom;view.h=r.height/view.zoom;canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);camera.x=Math.max(0,Math.min(W.width-view.w,player.x-view.w/2));camera.y=Math.max(0,Math.min(W.height-view.h,player.y-view.h*.55));$('hint').textContent=matchMedia('(any-pointer: coarse)').matches||r.width<700?'Tap to walk, or hold the arrows · Tap a friend to talk':'Click to walk · WASD / arrows to move · E to talk';draw();}
  function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;pad.hidden=!started||paused||!!modal;if(started&&!paused){time+=dt;update(dt);sound.tick();}if(toastUntil&&time>toastUntil){$('toast').hidden=true;toastUntil=0;}draw();requestAnimationFrame(frame);}
  if(state.invited)$('start').textContent='Back to my village ↗';refresh();resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
})();
