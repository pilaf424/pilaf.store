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
    lion:{slots:[2,6],degrees:[0,1],octave:-12,type:'sine',length:1.7,level:.10},
    firefly:{slots:[3,7],degrees:[2,1],octave:24,type:'sine',length:1.2,level:.045},
    scope:{slots:[0,6],degrees:[1,2],octave:0,type:'triangle',length:2,level:.06},
    fuzz:{slots:[1,5],degrees:[0,2],octave:0,type:'sawtooth',length:.3,level:.028},
    trio:{slots:[4],degrees:[0],octave:12,type:'triangle',length:2,level:.025,chord:true}
  };
  class VillageAudio {
    constructor(seed){this.song=SoundGardenComposer.createSong(SoundGardenComposer.styles[3],seed);this.context=null;this.volume=.35;this.muted=false;this.voices=new Set();this.step=0;this.next=0;this.pending={rabbit:false,tanuki:false,robot:false,festival:false};this.layers={...this.pending};this.running=false;this.phrase=-1;}
    async start(){
      if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');this.context=new Audio();this.bus=this.context.createGain();const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-16;limiter.knee.value=10;limiter.ratio.value=5;this.master=this.context.createGain();this.bus.connect(limiter);limiter.connect(this.master);this.master.connect(this.context.destination);}
      await this.context.resume();this.running=true;this.next=this.context.currentTime+.06;this.applyVolume();
    }
    applyVolume(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.025);}
    setLayers(layers){this.pending={...layers,guests:[...new Set((layers.guests||[]).filter(id=>parts[id]))]};}
    guestPart(id,slot,chord,when,duration,level=1,variation=0){
      const p=parts[id],i=p?.slots.indexOf(slot);if(i===undefined||i<0)return;
      const tones=p.chord?chord:[chord[(p.degrees[i]+variation)%chord.length]];
      tones.forEach((tone,j)=>this.note(SoundGardenComposer.frequency(this.song.root+p.octave+tone),when+j*.025,duration*p.length,p.level*level,p.type));
    }
    audition(id){
      if(!this.context||!this.running||this.muted||!parts[id])return;
      const chord=(this.section||SoundGardenComposer.sectionFor(this.song,0)).chords[Math.floor(this.step/8)%4];
      parts[id].slots.slice(0,3).forEach((slot,i)=>this.guestPart(id,slot,chord,this.context.currentTime+.025+i*.24,.3,.8));
    }
    note(freq,when,length=.4,level=.08,type='sine'){
      if(!this.context||!this.running||this.context.state!=='running')return;
      const o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.value=freq;
      g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(level,when+.025);g.gain.exponentialRampToValueAtTime(.001,when+length);o.connect(g);g.connect(this.bus);o.start(when);o.stop(when+length+.03);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};
    }
    preview(index){if(this.context)this.note([261.63,329.63,392][index],this.context.currentTime+.02,.45,.12,'triangle');}
    chime(){if(this.context)[261.63,329.63,392].forEach((f,i)=>this.note(f,this.context.currentTime+i*.14,.7,.1));}
    tick(){
      if(!this.context||!this.running||this.context.state!=='running')return;
      const now=this.context.currentTime;if(this.next<now-.15)this.next=now+.04;
      const duration=60/this.song.bpm/2;
      while(this.next<now+.12){
        const slot=this.step%8,bar=Math.floor(this.step/8)%4,phrase=Math.floor(this.step/32);
        if(slot===0){this.layers={...this.pending};}
        if(this.phrase!==phrase){this.phrase=phrase;this.section=SoundGardenComposer.sectionFor(this.song,phrase);}
        const chord=this.section.chords[bar],root=this.song.root;
        if(slot===0)chord.forEach((n,i)=>this.note(SoundGardenComposer.frequency(root+n),this.next+i*.045,duration*5,.023));
        if(this.layers.tanuki&&[0,3,4,7].includes(slot))this.note(SoundGardenComposer.frequency(root-12+chord[slot===3?1:0]),this.next,duration*.8,.14,'triangle');
        if(this.layers.rabbit&&slot%2===0&&this.section.gate[slot])this.note(this.section.melody[slot],this.next,duration*1.4,.065);
        if(this.layers.robot){if(slot%2===0)this.note(slot%4===0?65:155,this.next,.09,.12,'triangle');if(slot%2)this.note(1400+(slot%3)*150,this.next,.035,.017,'triangle');}
        if(this.layers.festival&&slot%2)this.note(SoundGardenComposer.frequency(root+24+chord[this.section.counter[slot]]),this.next,duration*.6,.045);
        // Up to four guests trade places every phrase; recruiting never makes
        // too many simultaneous layers overwhelm the original band.
        const guests=this.layers.guests||[],count=Math.min(4,guests.length);
        for(let i=0;i<count;i++)this.guestPart(guests[(phrase*3+i)%guests.length],slot,chord,this.next,duration,.85/Math.sqrt(count),phrase%3);
        this.next+=duration;this.step++;
      }
    }
    stop(){this.running=false;for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();}
  }
  window.VillageAudio=VillageAudio;
})();
