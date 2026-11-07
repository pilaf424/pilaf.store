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
   const part=player.role==='bass'?'bass':['pad','keys','choir'].includes(player.role)?'chords':['arp','bell'].includes(player.role)?'counter':['drums','wood'].includes(player.role)?'drums':'lead';
   const bar=section.parts.findIndex(p=>p[part].length);
   if(bar>=0){for(let slot=0;slot<8;slot++)this.perform(player,slot,bar,section,start+duration*slot+(slot%2?duration*this.song.style.swing:0),duration,0,1);}
   else for(const [i,kind] of ['kick','rim','hat'].entries()){
    const when=start+i*.28;
    if(player.role==='drums')this.drum(kind,when,kind==='kick'?.14:.05);
    else this.voice(player,frequency(this.song.root-12+i*2),when,.16,player.level);
    this.markHit(player.id,when);
   }
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
   const {root,style}=this.song,role=player.role,level=player.level*mix;
   const play=(e,midi=e.midi,scale=1)=>{this.voice(player,frequency(midi),when+e.offset*duration,duration*e.length,level*e.velocity*scale);this.markHit(player.id,when+e.offset*duration);};
   const events=part=>C.events(this.song,section,bar,slot,part);
   if(role==='drums'){
    for(const e of events('drums')){this.drum(e.kind,when+e.offset*duration,(e.kind==='kick'?.19:e.kind==='snare'?.075:e.kind==='rim'?.055:.039)*mix*e.velocity);this.markHit(player.id,when+e.offset*duration);}return;
   }
   if(role==='vocal'){
    const lead=section.parts[bar].lead.filter(e=>e.velocity>.4).slice().sort((a,b)=>a.at-b.at),stride=Math.max(1,Math.ceil(lead.length/3)),phrases=lead.filter((e,i)=>i%stride===0);
    for(const [i,e] of phrases.entries())if(Math.floor(e.at)===slot){
     let midi=e.midi;while(midi<root+7)midi+=12;while(midi>root+26)midi-=12;
     const room=(phrases[i+1]?.at||8)-e.at,length=Math.max(.28,duration*Math.min(Math.max(e.length,1.2),Math.max(1.0,room-.35))),at=when+(e.at-slot)*duration;
     this.voice(player,frequency(midi),at,length,level*e.velocity,['ah','oo','ee'][(i+bar+section.index)%3]);this.markHit(player.id,at);
    }return;
   }
   if(role==='choir'){
    const groups=new Map();for(const e of events('chords')){const key=Math.floor(e.at*4);const group=groups.get(key)||[];if(group.length<3)group.push(e);groups.set(key,group);}
    for(const group of groups.values())for(const e of group){const at=when+e.offset*duration;this.voice(player,frequency(e.midi),at,duration*Math.max(1.2,e.length),level*e.velocity,(bar+section.index)%2?'oo':'ah');this.markHit(player.id,at);}return;
   }
   if(role==='bass'){for(const e of events('bass'))play(e);return;}
   if(role==='pad'||role==='keys'){for(const e of events('chords'))play(e,e.midi,role==='pad'?.8:.68);return;}
   if(role==='wood'){
    for(const e of events('drums').filter(e=>e.kind==='rim'||e.kind==='snare'))play({...e,length:.28},root-12+section.chords[bar][slot%3],.85);return;
   }
   if(role==='arp'||role==='bell'){
    for(const e of events('counter')){if(role==='bell'&&Math.round(e.at*2)%2&&style.groove==='chip')continue;play(e,e.midi+(player.id==='firefly'?0:-12),role==='arp'?.85:1);}return;
   }
   for(const e of events('lead'))play({...e,length:role==='pluck'?Math.min(e.length,.8):e.length},e.midi+(player.id==='axolotl'?12:0));
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
