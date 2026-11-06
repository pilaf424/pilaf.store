/* Five chosen voices, arranged together. Auditions use the concert instruments. */
(() => {
 const C=SoundGardenComposer,frequency=C.frequency;
 class OrchestraAudio {
  constructor(){this.style=0;this.song=C.createSong(C.styles[0],this.seed());this.volume=.65;this.muted=false;this.voices=new Set();this.players=[];this.running=false;this.epoch=0;this.step=0;this.lastHits=new Map();this.hitEvents=new Map();this.playedHits=new Map();this.vocalEvents=[];}
  seed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
  newSong(style=this.style){const previous=this.song.title;this.style=style;do{this.song=C.createSong(C.styles[style],this.seed());}while(this.song.title===previous);}
  async ready(){
   if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio is unavailable in this browser.');this.context=new Audio();this.createOutput();}
   await this.context.resume();this.applyVolume();
  }
  createOutput(){
   const c=this.context;this.bus=c.createGain();this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-18;this.limiter.knee.value=12;this.limiter.ratio.value=5;
   // Restore level after compression for both auditions and the full band.
   this.makeup=c.createGain();this.makeup.gain.value=3;
   // Keep quiet signals linear; round only loud peaks before the volume fader.
   this.ceiling=c.createWaveShaper();const curve=new Float32Array(8193);
   for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.abs(x)<=.75?x:Math.sign(x)*(.75+.23*Math.tanh((Math.abs(x)-.75)/.23));}
   this.ceiling.curve=curve;
   this.master=c.createGain();this.master.gain.value=this.muted?0:this.volume;
   this.bus.connect(this.limiter);this.limiter.connect(this.makeup);this.makeup.connect(this.ceiling);this.ceiling.connect(this.master);this.master.connect(c.destination);
   this.synth=new SoundGardenSynth(c,this.bus,this.voices,48);this.noise=this.synth.noise;
  }
  applyVolume(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.03);}
  stop(){this.epoch++;this.running=false;for(const node of this.voices){try{node.stop();}catch{}}this.voices.clear();this.synth?.clear();this.lastHits.clear();this.hitEvents.clear();this.playedHits.clear();this.vocalEvents=[];}
  markHit(id,when){this.lastHits.set(id,when);const events=this.hitEvents.get(id)||[];if(events.at(-1)!==when)events.push(when);if(events.length>32)events.shift();this.hitEvents.set(id,events);}
  performance(id,now=this.context?.currentTime||0){const events=this.hitEvents.get(id)||[];while(events.length&&events[0]<=now)this.playedHits.set(id,events.shift());const last=this.playedHits.get(id),age=last===undefined?Infinity:now-last;
   this.vocalEvents=this.vocalEvents.filter(e=>e.when+e.length>now);const sung=this.vocalEvents.findLast(e=>e.id===id&&e.when<=now);
   const singing=sung?Math.min(1,Math.max(0,(now-sung.when)/.09),Math.max(0,(sung.when+sung.length-now)/.14)):0;
   return {hit:age>=0&&age<.6?Math.exp(-age*10):0,age,singing,vowel:sung?.vowel||'ah'};
  }
  async play(players){this.stop();const epoch=this.epoch;this.players=[...players];await this.ready();if(epoch!==this.epoch)return;this.running=true;this.step=0;this.next=this.context.currentTime+.08;this.startedAt=this.next;}
  async preview(player){this.stop();const epoch=this.epoch;await this.ready();if(epoch!==this.epoch)return;const duration=60/this.song.bpm/2,section=C.sectionFor(this.song,0),start=this.context.currentTime+.04;
   for(let slot=0;slot<8;slot++)this.perform(player,slot,0,section,start+duration*slot+(slot%2?duration*this.song.style.swing:0),duration,0,1);
  }
  voice(player,freq,when,length,level,vowel='ah'){
   if(player.role==='vocal'||player.role==='choir'){this.vocal(player,freq,when,length,level,vowel);return;}
   if(!this.synth)return;
   const voice=({cat:'keys',tanuki:'pad',scope:'lead',crane:'mallet',origami:'pluck',fox:'pluck',fuzz:'fuzz'})[player.id]||player.role;
   const pan=({rabbit:-.14,cat:-.26,lion:0,origami:.28,fox:.18,axolotl:.16,mushroom:.12,firefly:.28,scope:-.12,tanuki:.22,crane:-.22})[player.id]||0;
   this.synth.note(freq,when,length,level,{voice,wave:player.wave,pan,slide:['rabbit','axolotl','tanuki'].includes(player.id)});
  }
  vocal(player,freq,when,length,level,vowel='ah'){
   if(!this.context||this.voices.size>84)return;
   const c=this.context,end=when+Math.max(.24,length),amp=c.createGain(),sourceMix=c.createGain(),vibrato=c.createOscillator(),depth=c.createGain();
   const vowels={ah:[750,1200,2600],oo:[350,850,2300],ee:[350,2100,2900]},formants=vowels[vowel]||vowels.ah,weights=vowel==='ee'?[1.5,4,1.2]:[2.3,1.3,.55];
   // Parallel resonances turn a soft harmonic source into rounded vowel sounds.
   sourceMix.gain.value=.48;const connections=[sourceMix,amp,depth];
   for(const [i,center] of formants.entries()){const f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.Q.value=[2.7,4.5,7][i];f.frequency.setValueAtTime(center*.92,when);f.frequency.exponentialRampToValueAtTime(center,when+.12);g.gain.value=weights[i];sourceMix.connect(f);f.connect(g);g.connect(amp);connections.push(f,g);}
   amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(Math.max(.001,level),when+.09);amp.gain.setValueAtTime(Math.max(.001,level*.86),end-.14);amp.gain.exponentialRampToValueAtTime(.0001,end);amp.connect(this.bus);
   vibrato.frequency.value=5.2;depth.gain.setValueAtTime(0,when);depth.gain.linearRampToValueAtTime(11,when+.26);vibrato.connect(depth);
   const sources=[vibrato];for(const detune of [-3,3]){const osc=c.createOscillator();osc.type='sawtooth';osc.frequency.setValueAtTime(freq*.992,when);osc.frequency.exponentialRampToValueAtTime(freq,when+.075);osc.detune.value=detune;depth.connect(osc.detune);osc.connect(sourceMix);sources.push(osc);}
   let remaining=sources.length;for(const source of sources){this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();if(--remaining===0)for(const node of connections)node.disconnect();};source.start(when);source.stop(end+.02);}
   this.vocalEvents.push({id:player.id,when,length:end-when,vowel});if(this.vocalEvents.length>32)this.vocalEvents.shift();
  }
  drum(kind,when,level){
   this.synth?.drum(kind,when,level);
  }
  perform(player,slot,bar,section,when,duration,index=0,mix=1){
   const {root,style}=this.song,chord=section.chords[bar],role=player.role,offset=index%2,level=player.level*mix,bright=section.bright;
   const note=(midi,length=duration*1.1,velocity=1,delay=0)=>{this.voice(player,frequency(midi),when+delay,length,level*velocity);this.markHit(player.id,when+delay);};
   if(role==='drums'){const kicks=style.kicks.length?style.kicks:[0],snares=style.snares;
    const soft=['bossa','mallets','ambient'].includes(style.groove),space=section.sparse&&bar<2;
    if(kicks.includes(slot)&&(!space||slot===0))this.drum('kick',when,.19*mix*(soft?.65:1));
    if(snares.includes(slot)&&!space)this.drum(soft?'rim':'snare',when,.075*mix);
    if(style.groove!=='ambient'&&!space)this.drum(slot===7&&bright?'openhat':'hat',when,(slot%2?.037:.017)*mix);
    if(bar===3&&slot===section.fill&&!space&&style.groove!=='ambient')this.drum(soft?'rim':'snare',when+duration*.5,.035*mix);
    if(kicks.includes(slot)||snares.includes(slot)||!space&&style.groove!=='ambient')this.markHit(player.id,when);return;
   }
   if(role==='vocal'){
    const sparse=section.sparse||style.groove==='ambient',slots=sparse?[0,4]:[0,3,6];
    if(slots.includes(slot)){const vowel=['ah','oo','ee'][(Math.floor(slot/3)+bar+section.index)%3],length=duration*(sparse?3.45:slot===6?1.5:2.55),midi=root+12+chord[(bar+slots.indexOf(slot))%3];this.voice(player,frequency(midi),when,length,level,vowel);this.markHit(player.id,when);}
   }
   else if(role==='bass'){if(style.bass.includes(slot)){const tone=slot===7&&style.groove==='swing'?section.chords[(bar+1)%4][0]-1:chord[slot===3||slot===7?2:0];note(root-12+tone+(style.groove==='disco'&&slot%2?12:0),duration*(style.groove==='ambient'?5:style.groove==='dub'?1.8:.95),slot===0?1:.82);}}
   else if(role==='choir'){
    if((style.groove==='ambient'?[0]:[0,4]).includes(slot)){const vowel=(bar+section.index+slot/4)%2?'oo':'ah';for(const n of chord)this.voice(player,frequency(root+n),when,duration*(style.groove==='ambient'?6.5:3.3),level,vowel);this.markHit(player.id,when);}
   }
   else if(role==='pad'){if(slot===offset*4)C.voicing(this.song,chord,bar,true,bright).forEach((midi,i)=>note(midi,duration*(style.groove==='disco'?3:6),.62,i*.018));}
   else if(role==='keys'){const slots=section.sparse?[0]:style.groove==='bossa'?[0,3,6]:style.groove==='disco'?[1,3,5,7]:style.groove==='swing'?[0,3,6]:[0,5];if(slots.includes(slot))C.voicing(this.song,chord,bar,true,bright).forEach((midi,i)=>note(midi,duration*(style.groove==='ambient'?4:style.groove==='disco'?.8:2.1),.48,i*.014));}
   else if(role==='wood'){if((style.groove==='ambient'?[0,6]:[0,2,4,7]).includes(slot))note(root-12+chord[slot%3],.07);}
   else if(role==='arp'){if((section.sparse?[0,3,6]:[0,2,3,5,6,7]).includes(slot))note(root+12+chord[(slot+index+section.index)%3],duration*.9);}
   else if(role==='bell'){if([2+offset,6+offset].includes(slot))note(root+(player.id==='firefly'?24:12)+chord[(slot+section.index)%3],duration*2);}
   else {const gate=role==='pluck'?[1,3,4,7]:style.groove==='ambient'?[0,4]:[0,2,4,6,7];if(gate.includes(slot)&&section.gate[slot]){let freq=section.melody[(slot+index*2)%8];if(player.id==='axolotl')freq*=2;this.voice(player,freq,when,duration*(role==='pluck'?.45:bright?1.4:1.1),level*section.accents[slot]);this.markHit(player.id,when);}}
  }
  tick(){if(!this.running||!this.context||this.context.state!=='running')return;const now=this.context.currentTime,duration=60/this.song.bpm/2;if(this.next<now-.2)this.next=now+.04;
   while(this.next<now+.12){const slot=this.step%8,bar=Math.floor(this.step/8)%4,phrase=Math.floor(this.step/32),section=C.sectionFor(this.song,phrase),when=this.next+(slot%2?duration*this.song.style.swing:0);
    for(const [index,p] of this.players.entries()){const duplicates=this.players.filter(other=>other.role===p.role).length;this.perform(p,slot,bar,section,when,duration,index,.8/Math.sqrt(duplicates));}
    this.next+=duration;this.step++;
   }
  }
 }
 window.OrchestraAudio=OrchestraAudio;
})();
