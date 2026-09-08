/* Five chosen voices, arranged together. Auditions use the concert instruments. */
(() => {
 const C=SoundGardenComposer,frequency=C.frequency;
 class OrchestraAudio {
  constructor(){this.style=0;this.song=C.createSong(C.styles[0],this.seed());this.volume=.45;this.muted=false;this.voices=new Set();this.players=[];this.running=false;this.epoch=0;this.step=0;this.lastHits=new Map();this.hitEvents=new Map();this.playedHits=new Map();this.vocalEvents=[];}
  seed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
  newSong(style=this.style){const previous=this.song.title;this.style=style;do{this.song=C.createSong(C.styles[style],this.seed());}while(this.song.title===previous);}
  async ready(){
   if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio is unavailable in this browser.');this.context=new Audio();this.bus=this.context.createGain();this.limiter=this.context.createDynamicsCompressor();this.limiter.threshold.value=-18;this.limiter.knee.value=12;this.limiter.ratio.value=5;this.master=this.context.createGain();this.bus.connect(this.limiter);this.limiter.connect(this.master);this.master.connect(this.context.destination);
    this.noise=this.context.createBuffer(1,this.context.sampleRate*.3,this.context.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   }await this.context.resume();this.applyVolume();
  }
  applyVolume(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.03);}
  stop(){this.epoch++;this.running=false;for(const node of this.voices){try{node.stop();}catch{}}this.voices.clear();this.lastHits.clear();this.hitEvents.clear();this.playedHits.clear();this.vocalEvents=[];}
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
   if(player.role==='vocal'){this.vocal(player,freq,when,length,level,vowel);return;}
   if(!this.context||this.voices.size>90)return;const c=this.context,osc=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
   osc.type=player.wave;osc.frequency.setValueAtTime(freq,when);filter.type='lowpass';filter.frequency.setValueAtTime(player.role==='bass'?900:player.id==='shrimp'?1600:5000,when);filter.Q.value=.5;
   const attack=player.role==='pad'?.16:player.role==='lead'?.05:.008;
   gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),when+attack);gain.gain.exponentialRampToValueAtTime(.0001,when+Math.max(attack+.1,length));
   osc.connect(filter);filter.connect(gain);gain.connect(this.bus);osc.start(when);osc.stop(when+Math.max(attack+.1,length)+.03);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();filter.disconnect();};
   if(player.role==='bell'){const overtone=c.createOscillator(),g=c.createGain();overtone.frequency.value=freq*2.76;g.gain.setValueAtTime(level*.22,when);g.gain.exponentialRampToValueAtTime(.0001,when+.24);overtone.connect(g);g.connect(this.bus);overtone.start(when);overtone.stop(when+.26);this.voices.add(overtone);overtone.onended=()=>{this.voices.delete(overtone);overtone.disconnect();g.disconnect();};}
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
   const c=this.context;if(!c||this.voices.size>90)return;const gain=c.createGain(),filter=c.createBiquadFilter();let source;
   if(kind==='kick'){source=c.createOscillator();source.frequency.setValueAtTime(145,when);source.frequency.exponentialRampToValueAtTime(45,when+.15);filter.type='lowpass';filter.frequency.value=500;}
   else{source=c.createBufferSource();source.buffer=this.noise;filter.type='highpass';filter.frequency.value=kind==='hat'?6500:1600;}
   const length=kind==='kick'?.22:kind==='hat'?.045:.13;gain.gain.setValueAtTime(level,when);gain.gain.exponentialRampToValueAtTime(.0001,when+length);source.connect(filter);filter.connect(gain);gain.connect(this.bus);source.start(when);source.stop(when+length+.01);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();filter.disconnect();};
  }
  perform(player,slot,bar,section,when,duration,index=0,mix=1){
   const {root,style}=this.song,chord=section.chords[bar],role=player.role,offset=index%2,level=player.level*mix,bright=section.bright;
   const note=(midi,length=duration*1.1,velocity=1)=>{this.voice(player,frequency(midi),when,length,level*velocity);this.markHit(player.id,when);};
   if(role==='drums'){const kicks=style.kicks.length?style.kicks:[0],snares=style.snares;
    if(kicks.includes(slot))this.drum('kick',when,.19*mix);if(snares.includes(slot))this.drum('snare',when,.075*mix);if(style.groove!=='ambient'&&slot%2)this.drum('hat',when,.045*mix);if(kicks.includes(slot)||snares.includes(slot)||style.groove!=='ambient'&&slot%2)this.markHit(player.id,when);return;
   }
   if(role==='vocal'){
    const sparse=section.sparse||style.groove==='ambient',slots=sparse?[0,4]:[0,3,6];
    if(slots.includes(slot)){const vowel=['ah','oo','ee'][(Math.floor(slot/3)+bar+section.index)%3],length=duration*(sparse?3.45:slot===6?1.5:2.55),midi=root+12+chord[(bar+slots.indexOf(slot))%3];this.voice(player,frequency(midi),when,length,level,vowel);this.markHit(player.id,when);}
   }
   else if(role==='bass'){if(style.bass.includes(slot))note(root-12+chord[slot===3||slot===7?2:0],duration*(style.groove==='ambient'?5:.85));}
   else if(role==='pad'){if(slot===offset*4)chord.forEach(n=>note(root+n,duration*(style.groove==='disco'?3:6),.75));}
   else if(role==='keys'){if((style.groove==='bossa'?[0,3,6]:style.groove==='disco'?[1,3,5,7]:[0,4]).includes(slot))chord.forEach(n=>note(root+n+12,duration*1.7,.55));}
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
