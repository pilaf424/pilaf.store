/* Phrase-aligned village music. No samples or network requests. */
(() => {
  // Sparse, distinct parts. Every note follows the current chord.
  const parts={
    onigiri:{slots:[2,6],degrees:[2,1],octave:12,type:'sine',length:1.3,level:.065},
    cat:{slots:[0,5],degrees:[0,2],octave:0,type:'sine',length:2.5,level:.085},
    fox:{slots:[1,4,7],degrees:[1,0,2],octave:12,type:'triangle',length:.35,level:.07},
    axolotl:{slots:[1,3,6],degrees:[0,1,2],octave:12,type:'sine',length:1.5,level:.06},
    daruma:{slots:[0,2,4,6],degrees:[0,0,1,0],octave:-12,type:'triangle',length:.14,level:.08},
    mushroom:{slots:[0],degrees:[0],octave:0,type:'sine',length:5,level:.025,chord:true},
    origami:{slots:[2,3,7],degrees:[0,1,2],octave:12,type:'triangle',length:.65,level:.055},
    lion:{slots:[0,3,4,7],degrees:[0,2,0,2],octave:-12,type:'sine',length:1.4,level:.14},
    firefly:{slots:[3,7],degrees:[2,1],octave:24,type:'sine',length:1.2,level:.045},
    scope:{slots:[0,6],degrees:[1,2],octave:0,type:'triangle',length:2,level:.06},
    fuzz:{slots:[1,5],degrees:[0,2],octave:0,type:'sawtooth',length:.3,level:.028},
    trio:{slots:[4],degrees:[0],octave:12,type:'triangle',length:2,level:.025,chord:true}
  };
  class VillageAudio {
    constructor(seed){this.style=3;this.song=SoundGardenComposer.createSong(SoundGardenComposer.styles[this.style],seed);this.context=null;this.volume=.35;this.muted=false;this.voices=new Set();this.step=0;this.next=0;this.pending={rabbit:false,tanuki:false,robot:false,festival:false};this.layers={...this.pending};this.running=false;this.phrase=-1;}
    changeSong(style=this.style){
      if(!Number.isInteger(style)||!SoundGardenComposer.styles[style])return false;
      const running=this.running,previous=this.song;this.stop();this.style=style;
      do{this.song=SoundGardenComposer.createSong(SoundGardenComposer.styles[style],crypto.getRandomValues(new Uint32Array(1))[0]);}while(this.song.seed===previous.seed||this.song.title===previous.title);
      this.step=0;this.phrase=-1;this.section=SoundGardenComposer.sectionFor(this.song,0);this.layers={...this.pending,guests:[...(this.pending.guests||[])]};this.next=(this.context?.currentTime||0)+.06;this.running=running;
      return true;
    }
    async start(){
      if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');this.context=new Audio();this.createOutput();}
      await this.context.resume();this.running=true;this.next=this.context.currentTime+.06;this.applyVolume();
    }
    createOutput(){const c=this.context;this.bus=c.createGain();const limiter=c.createDynamicsCompressor();limiter.threshold.value=-16;limiter.knee.value=10;limiter.ratio.value=5;limiter.attack.value=.008;limiter.release.value=.24;this.master=c.createGain();this.master.gain.value=this.muted?0:this.volume;this.bus.connect(limiter);limiter.connect(this.master);this.master.connect(c.destination);this.synth=new SoundGardenSynth(c,this.bus,this.voices,34);}
    applyVolume(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.025);}
    setLayers(layers){this.pending={...layers,guests:[...new Set((layers.guests||[]).filter(id=>parts[id]))]};}
    guestPart(id,slot,chord,when,duration,level=1,variation=0){
      const C=SoundGardenComposer,section=this.section||C.sectionFor(this.song,0),bar=Math.floor(this.step/8)%4,p=parts[id];
      if(!p)return;
      const part=id==='lion'?'bass':['cat','mushroom','trio'].includes(id)?'chords':['onigiri','origami','firefly'].includes(id)?'counter':id==='daruma'?'drums':'lead';
      const voice=({lion:'bass',onigiri:'bell',cat:'keys',fox:'pluck',axolotl:'lead',daruma:'wood',mushroom:'pad',origami:'pluck',firefly:'bell',scope:'lead',fuzz:'fuzz',trio:'pad'})[id];
      let events=C.events(this.song,section,bar,slot,part);
      if(part==='drums')events=events.filter(e=>e.kind==='rim'||e.kind==='snare');
      for(const e of events){
        let midi=e.midi;
        if(part==='counter')midi+=p.octave-24;
        if(part==='drums')midi=this.song.root+p.octave+chord[(slot+variation)%3];
        const length=part==='drums'?.14:part==='bass'?e.length:id==='fox'||id==='fuzz'?Math.min(e.length,.75):e.length;
        this.note(C.frequency(midi),when+e.offset*duration,duration*length,p.level*level*e.velocity/(id==='cat'?2.5:1),p.type,id==='axolotl',voice);
      }
    }
    audition(id){
      if(!this.context||!this.running||this.muted||!parts[id])return;
      const section=this.section||SoundGardenComposer.sectionFor(this.song,0),part=id==='lion'?'bass':['cat','mushroom','trio'].includes(id)?'chords':['onigiri','origami','firefly'].includes(id)?'counter':id==='daruma'?'drums':'lead';
      const previous=this.step;let heard=0;
      try{for(let bar=0;bar<4&&heard<3;bar++){
        const events=section.parts[bar][part].filter(e=>part!=='drums'||e.kind==='rim'||e.kind==='snare');
        for(const slot of new Set(events.map(e=>Math.floor(e.at)))){
          this.step=bar*8;this.guestPart(id,slot,section.chords[bar],this.context.currentTime+.025+heard*.3,.3,.8);if(++heard===3)break;
        }
      }}finally{this.step=previous;}
      // Ambient arrangements intentionally rest the percussion. An audition
      // still demonstrates the instrument without adding drums to the song.
      if(!heard)this.note(SoundGardenComposer.frequency(this.song.root-12),this.context.currentTime+.025,.18,.065,'triangle',false,'wood');
    }
    note(freq,when,length=.4,level=.08,type='sine',wobble=false,voice='keys'){
      if(!this.context||!this.running||!this.synth)return;
      this.synth.note(freq,when,length,level,{voice,wave:type,slide:wobble,pan:voice==='pad'?.16:voice==='bell'?-.18:0});
    }
    preview(index){if(this.context)this.note([261.63,329.63,392][index],this.context.currentTime+.02,.45,.12,'triangle');}
    chime(){if(this.context)[261.63,329.63,392].forEach((f,i)=>this.note(f,this.context.currentTime+i*.14,.7,.1));}
    tapePart(slot,chord,when,duration){
      const C=SoundGardenComposer,section=this.section||C.sectionFor(this.song,0),bar=Math.floor(this.step/8)%4;
      for(const e of C.events(this.song,section,bar,slot,'chords'))this.note(C.frequency(e.midi),when+e.offset*duration,duration*e.length,.033*e.velocity,'triangle',true,e.voice);
    }
    tick(){
      if(!this.context||!this.running||this.context.state!=='running')return;
      const now=this.context.currentTime;if(this.next<now-.15)this.next=now+.04;
      const duration=60/this.song.bpm/2;
      while(this.next<now+.12){
        const slot=this.step%8,bar=Math.floor(this.step/8)%4,phrase=Math.floor(this.step/32);
        if(slot===0){this.layers={...this.pending};}
        if(this.phrase!==phrase){this.phrase=phrase;this.section=SoundGardenComposer.sectionFor(this.song,phrase);}
        const chord=this.section.chords[bar],root=this.song.root,style=this.song.style,when=this.next+(slot%2?duration*style.swing:0);
        const C=SoundGardenComposer,play=(e,level,voice=e.voice,type=style.voice)=>this.note(C.frequency(e.midi),when+e.offset*duration,duration*e.length,level*e.velocity,type,false,voice);
        if(!this.layers.tanuki)for(const e of C.events(this.song,this.section,bar,slot,'chords'))play(e,.022,e.voice,'triangle');
        if(this.layers.tanuki)this.tapePart(slot,chord,when,duration);
        if(this.layers.rabbit)for(const e of C.events(this.song,this.section,bar,slot,'lead'))play(e,.064,'lead',style.groove==='chip'?'square':'sine');
        if(this.layers.robot)for(const e of C.events(this.song,this.section,bar,slot,'drums'))this.synth.drum(e.kind,when+e.offset*duration,(e.kind==='kick'?.14:e.kind==='snare'?.065:e.kind==='rim'?.05:.029)*e.velocity);
        if(this.layers.festival)for(const e of C.events(this.song,this.section,bar,slot,'counter'))play(e,.032,e.voice,'sine');
        // Lion anchors the bass when invited. Up to three other guests rotate;
        // the total still stays at four, and every other neighbor gets a turn.
        const guests=this.layers.guests||[],lion=guests.includes('lion'),others=guests.filter(id=>id!=='lion'),count=Math.min(4-Number(lion),others.length),total=count+Number(lion);
        if(!lion&&(this.layers.rabbit||this.layers.tanuki))for(const e of C.events(this.song,this.section,bar,slot,'bass'))play(e,.065,'bass','triangle');
        if(lion)this.guestPart('lion',slot,chord,when,duration,.85);
        for(let i=0;i<count;i++)this.guestPart(others[(phrase*3+i)%others.length],slot,chord,when,duration,.85/Math.sqrt(total),phrase%3);
        this.next+=duration;this.step++;
      }
    }
    stop(){this.running=false;for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();this.synth?.clear();}
  }
  window.VillageAudio=VillageAudio;
})();
