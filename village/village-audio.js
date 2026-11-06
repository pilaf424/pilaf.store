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
      if(id==='lion'){
        const style=this.song.style;if(!style.bass.includes(slot))return;
        const degree=slot===0||slot===4?0:2,length=style.groove==='ambient'?3.6:1.1;
        this.note(SoundGardenComposer.frequency(this.song.root-12+chord[degree]),when,duration*length,parts.lion.level*level,'sine',false,'bass');return;
      }
      const p=parts[id],i=p?.slots.indexOf(slot);if(i===undefined||i<0)return;
      const voice=({onigiri:'bell',cat:'keys',fox:'pluck',axolotl:'lead',daruma:'wood',mushroom:'pad',origami:'pluck',firefly:'bell',scope:'lead',fuzz:'fuzz',trio:'pad'})[id];
      const tones=p.chord||id==='cat'?SoundGardenComposer.voicing(this.song,chord,variation,true,this.section?.bright):[this.song.root+p.octave+chord[(p.degrees[i]+variation)%chord.length]];
      tones.forEach((midi,j)=>this.note(SoundGardenComposer.frequency(midi),when+j*.018,duration*p.length,p.level*level/(id==='cat'?2.5:1),p.type,id==='axolotl',voice));
    }
    audition(id){
      if(!this.context||!this.running||this.muted||!parts[id])return;
      const chord=(this.section||SoundGardenComposer.sectionFor(this.song,0)).chords[Math.floor(this.step/8)%4];
      (id==='lion'?this.song.style.bass:parts[id].slots).slice(0,3).forEach((slot,i)=>this.guestPart(id,slot,chord,this.context.currentTime+.025+i*.24,.3,.8));
    }
    note(freq,when,length=.4,level=.08,type='sine',wobble=false,voice='keys'){
      if(!this.context||!this.running||!this.synth)return;
      this.synth.note(freq,when,length,level,{voice,wave:type,slide:wobble,pan:voice==='pad'?.16:voice==='bell'?-.18:0});
    }
    preview(index){if(this.context)this.note([261.63,329.63,392][index],this.context.currentTime+.02,.45,.12,'triangle');}
    chime(){if(this.context)[261.63,329.63,392].forEach((f,i)=>this.note(f,this.context.currentTime+i*.14,.7,.1));}
    tapePart(slot,chord,when,duration){
      const groove=this.song.style.groove,slots=groove==='ambient'?[0]:groove==='disco'?[1,3,5,7]:groove==='bossa'?[0,3,6]:[0,4];
      if(!slots.includes(slot))return;
      const length=duration*(groove==='ambient'?6:groove==='disco'?.75:2.5);
      SoundGardenComposer.voicing(this.song,chord,Math.floor(this.step/8)%4,true,this.section?.bright).forEach((n,i)=>this.note(SoundGardenComposer.frequency(n),when+i*.018,length,.026,'triangle',true,groove==='disco'?'keys':'pad'));
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
        if(slot===0&&!this.layers.tanuki)SoundGardenComposer.voicing(this.song,chord,bar,true).forEach((n,i)=>this.note(SoundGardenComposer.frequency(n),when+i*.035,duration*6,.021,'triangle',true,'pad'));
        if(this.layers.tanuki)this.tapePart(slot,chord,when,duration);
        if(this.layers.rabbit&&slot%2===0&&this.section.gate[slot])this.note(this.section.melody[slot],when,duration*1.7,.065,'sine',true,'lead');
        if(this.layers.robot){const kicks=style.kicks.length?style.kicks:[0],soft=['ambient','bossa','mallets'].includes(style.groove),space=this.section.sparse&&bar<2;if(kicks.includes(slot)&&(!space||slot===0))this.synth.drum('kick',when,soft?.085:.14);if(style.snares.includes(slot)&&!space)this.synth.drum(soft?'rim':'snare',when,.065);if(style.groove!=='ambient'&&!space)this.synth.drum(slot===7&&this.section.bright?'openhat':'hat',when,slot%2?.026:.012);if(bar===3&&slot===this.section.fill&&!space)this.synth.drum('rim',when+duration*.5,.028);}
        if(this.layers.festival&&(this.section.sparse?[3,7]:[1,3,5,7]).includes(slot))this.note(SoundGardenComposer.frequency(root+24+chord[this.section.counter[slot]]),when,duration*1.1,.035,'sine',false,'bell');
        // Lion anchors the bass when invited. Up to three other guests rotate;
        // the total still stays at four, and every other neighbor gets a turn.
        const guests=this.layers.guests||[],lion=guests.includes('lion'),others=guests.filter(id=>id!=='lion'),count=Math.min(4-Number(lion),others.length),total=count+Number(lion);
        if(!lion&&(this.layers.rabbit||this.layers.tanuki)&&style.bass.includes(slot)&&(!this.section.sparse||slot===0))this.note(SoundGardenComposer.frequency(root-12+chord[slot===3||slot===7?2:0]),when,duration*(style.groove==='ambient'?4:1.1),.06,'triangle',false,'bass');
        if(lion)this.guestPart('lion',slot,chord,when,duration,.85);
        for(let i=0;i<count;i++)this.guestPart(others[(phrase*3+i)%others.length],slot,chord,when,duration,.85/Math.sqrt(total),phrase%3);
        this.next+=duration;this.step++;
      }
    }
    stop(){this.running=false;for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();this.synth?.clear();}
  }
  window.VillageAudio=VillageAudio;
})();
