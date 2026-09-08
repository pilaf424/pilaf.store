/* Phrase-aligned village music. No samples or network requests. */
(() => {
  class VillageAudio {
    constructor(seed){this.song=SoundGardenComposer.createSong(SoundGardenComposer.styles[3],seed);this.context=null;this.volume=.35;this.muted=false;this.voices=new Set();this.step=0;this.next=0;this.pending={rabbit:false,tanuki:false,robot:false,festival:false};this.layers={...this.pending};this.running=false;this.phrase=-1;}
    async start(){
      if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');this.context=new Audio();this.bus=this.context.createGain();const limiter=this.context.createDynamicsCompressor();limiter.threshold.value=-16;limiter.knee.value=10;limiter.ratio.value=5;this.master=this.context.createGain();this.bus.connect(limiter);limiter.connect(this.master);this.master.connect(this.context.destination);}
      await this.context.resume();this.running=true;this.next=this.context.currentTime+.06;this.applyVolume();
    }
    applyVolume(){if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.025);}
    setLayers(layers){this.pending={...layers};}
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
        this.next+=duration;this.step++;
      }
    }
    stop(){this.running=false;for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();}
  }
  window.VillageAudio=VillageAudio;
})();
