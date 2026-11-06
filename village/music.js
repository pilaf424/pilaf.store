/* Seeded composition: replay starts the same song; later phrases keep developing. */
(() => {
  'use strict';
  const major=[0,2,4,5,7,9,11], minor=[0,2,3,5,7,8,10], dorian=[0,2,3,5,7,9,10];
  const styles = [
    {name:'Sunroom shuffle',genre:'Swing',scale:major,bpm:104,swing:.17,voice:'triangle',groove:'swing',kicks:[0,4],snares:[2,6],bass:[0,3,4,7]},
    {name:'Moonlit tapes',genre:'Lo-fi',scale:minor,bpm:82,swing:.11,voice:'sine',groove:'lofi',kicks:[0,5],snares:[2,6],bass:[0,4]},
    {name:'Pocket disco',genre:'Disco',scale:major,bpm:120,swing:0,voice:'triangle',groove:'disco',kicks:[0,2,4,6],snares:[2,6],bass:[0,1,3,4,5,7]},
    {name:'Moss & starlight',genre:'Ambient',scale:dorian,bpm:76,swing:0,voice:'sine',groove:'ambient',kicks:[],snares:[],bass:[0],echo:.25},
    {name:'Pixel picnic',genre:'Chiptune',scale:major,bpm:132,swing:0,voice:'square',groove:'chip',kicks:[0,4],snares:[2,6],bass:[0,2,4,6]},
    {name:'Lantern dub',genre:'Dub',scale:dorian,bpm:88,swing:.04,voice:'triangle',groove:'dub',kicks:[4],snares:[4],bass:[0,3,5],echo:.4},
    {name:'Paper bossa',genre:'Bossa',scale:major,bpm:112,swing:0,voice:'sine',groove:'bossa',kicks:[0,3,4,7],snares:[2,5],bass:[0,3,4,7]},
    {name:'After-rain garage',genre:'UK garage',scale:minor,bpm:128,swing:.22,voice:'triangle',groove:'garage',kicks:[0,3,5],snares:[2,6],bass:[0,3,6]},
    {name:'Circuit breakbeat',genre:'Breakbeat',scale:minor,bpm:144,swing:.03,voice:'square',groove:'breaks',kicks:[0,3,4,7],snares:[2,6],bass:[0,3,4,6]},
    {name:'Bamboo courtyard',genre:'Mallets',scale:major,bpm:98,swing:.05,voice:'sine',groove:'mallets',kicks:[0,4],snares:[3,6],bass:[0,4],echo:.18}
  ];
  function random(seed) {
    return () => {let value=seed+=0x6D2B79F5;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return ((value^value>>>14)>>>0)/4294967296;};
  }
  const choose=(list,rng)=>list[Math.floor(rng()*list.length)];
  const frequency=midi=>440*2**((midi-69)/12);
  function degreeNote(style,degree) {return style.scale[((degree%7)+7)%7]+12*Math.floor(degree/7);}
  function createSong(style,seed) {
    const rng=random(seed),root=48+Math.floor(rng()*12),motif=[0];
    for(let i=1;i<7;i++) motif.push(Math.max(0,Math.min(9,motif[i-1]+choose([-2,-1,1,1,2,3],rng))));
    motif.push(choose([0,0,2,4],rng));
    const progression=choose([[0,3,5,4],[0,5,1,4],[0,4,3,0],[0,2,5,3],[0,1,3,4]],rng);
    const title=choose(['Apricot','Velvet','Porcelain','Meadow','Honey','Paper','Clover','Amber','Lantern','Cloud','Willow','Mint'],rng)+' '+choose(['postcards','footsteps','daydream','pockets','afterglow','satellites','raindrops','picnic','sketches','echoes','drift','letters'],rng);
    return {style,title,seed:seed>>>0,root,motif,progression,bpm:style.bpm+Math.floor(rng()*9)-4,
      pitches:motif.map(degree=>frequency(root+12+degreeNote(style,degree)))};
  }
  function sectionFor(song,index) {
    const rng=random((song.seed^Math.imul(index+1,0x9e3779b1))>>>0);
    const form=['Theme','Answer','Interlude','Bloom'][index%4],motif=[...song.motif];
    if(index>0) {
      for(const slot of [2,3,5,6]) if(rng()>.3) motif[slot]=Math.max(0,Math.min(11,motif[slot]+choose([-2,-1,1,2],rng)));
      motif[0]=song.motif[0];
      if(motif.every((degree,i)=>degree===song.motif[i])) motif[3]+=motif[3]<10?1:-1;
    }
    const progression=[...song.progression];
    if(index>0) progression[2]=choose([1,2,3,5],rng);
    const chords=progression.map(degree=>[0,2,4].map(offset=>degreeNote(song.style,degree+offset)));
    const melody=motif.map(degree=>frequency(song.root+12+degreeNote(song.style,degree)));
    const gate=Array.from({length:8},(_,i)=>index===0||i===0||rng()>(form==='Interlude'?.45:.16));
    const accents=Array.from({length:8},()=>.75+rng()*.25);
    const counter=Array.from({length:8},()=>Math.floor(rng()*3));
    const fill=choose([1,3,5,7],rng);
    return {index,form,chords,melody,gate,accents,counter,fill,
      sparse:form==='Interlude',bright:form==='Bloom',bassOctave:index>0&&rng()>.7?12:0};
  }
  // Close voicings and diatonic sevenths connect the harmony from bar to bar.
  function voicing(song,chord,bar=0,rich=true,bright=false) {
    const degree=song.style.scale.indexOf(((chord[0]%12)+12)%12)+Math.floor(chord[0]/12)*7;
    const tones=[...chord];
    if(rich)tones.push(degreeNote(song.style,degree+6));
    if(bright&&rich)tones[2]=degreeNote(song.style,degree+8);
    return tones.map((tone,i)=>{let midi=song.root+tone;while(midi<song.root+5)midi+=12;while(midi>song.root+22)midi-=12;return midi+(i===0&&bar%2===1?-12:0);}).sort((a,b)=>a-b);
  }

  // A small shared instrument rack. Two oscillators make each note, with a
  // pluck/formant envelope, stereo placement and one quiet room per game.
  class SoundGardenSynth {
    constructor(context,output,sources=new Set(),limit=48) {
      this.context=context;this.output=output;this.sources=sources;this.limit=limit;this.windows=[];this.effects=[];
      const c=context;this.noise=c.createBuffer(1,Math.ceil(c.sampleRate*.5),c.sampleRate);
      let seed=0x50494c41;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
      const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=random();
      this.impulse=c.createBuffer(2,Math.ceil(c.sampleRate*.78),c.sampleRate);
      for(let ch=0;ch<2;ch++){const d=this.impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=random()*(1-i/d.length)**3*.45;}
    }
    room() {
      if(this.send)return;const c=this.context;
      this.send=c.createGain();this.send.gain.value=.16;
      const high=c.createBiquadFilter(),convolver=c.createConvolver(),wet=c.createGain();
      high.type='highpass';high.frequency.value=240;convolver.buffer=this.impulse;wet.gain.value=.34;
      this.send.connect(high);high.connect(convolver);convolver.connect(wet);wet.connect(this.output);
      this.effects=[this.send,high,convolver,wet];
    }
    clear() {for(const n of this.effects)n.disconnect();this.effects=[];this.send=null;this.windows=[];}
    reserve(when,end,count) {
      this.windows=this.windows.filter(v=>v.end>when);
      if(this.windows.reduce((sum,v)=>sum+v.count,0)+count>this.limit)return false;
      this.windows.push({end,count});return true;
    }
    finish(sources,nodes,when,end) {
      let remaining=sources.length;
      for(const source of sources){this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();if(--remaining===0)for(const node of nodes)node.disconnect();};source.start(when);source.stop(end+.025);}
    }
    note(freq,when,length,level,{voice='keys',wave='triangle',pan=0,slide=false}={}) {
      const c=this.context;if(!Number.isFinite(freq)||!Number.isFinite(when)||level<=0)return;
      freq=Math.max(30,Math.min(6000,freq));length=Math.max(.065,Math.min(6,length));when=Math.max(c.currentTime,when);
      const end=when+length,attack=Math.min(length*.25,voice==='pad'?.18:voice==='lead'?.035:.006);
      if(!this.reserve(when,end,2))return;this.room();
      const mix=c.createGain(),filter=c.createBiquadFilter(),amp=c.createGain(),stereo=c.createStereoPanner();
      stereo.pan.value=Math.max(-.65,Math.min(.65,pan));filter.type='lowpass';filter.Q.value=voice==='fuzz'?1.2:.55;
      const cutoff=voice==='bass'?Math.min(1300,freq*8):voice==='pad'?Math.min(2100,freq*5):Math.min(8000,900+freq*7);
      filter.frequency.setValueAtTime(cutoff,when);filter.frequency.exponentialRampToValueAtTime(Math.max(180,cutoff*(voice==='lead'?.8:.42)),end);
      const peak=Math.max(.0002,level),hold=voice==='pad'?.78:voice==='lead'?.7:voice==='bass'?.45:.18;
      amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(peak,when+attack);
      amp.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*hold),when+Math.max(attack+.005,length*.52));amp.gain.exponentialRampToValueAtTime(.0001,end);
      mix.connect(filter);filter.connect(amp);amp.connect(stereo);stereo.connect(this.output);stereo.connect(this.send);
      const a=c.createOscillator(),b=c.createOscillator(),gain=c.createGain(),nodes=[mix,filter,amp,stereo,gain];
      a.frequency.setValueAtTime(freq*(slide?.985:1),when);if(slide)a.frequency.exponentialRampToValueAtTime(freq,when+Math.min(.12,length*.3));
      if(voice==='keys'||voice==='bell'||voice==='mallet'){
        a.type='sine';b.type='sine';b.frequency.value=freq*(voice==='bell'?2.76:voice==='mallet'?3.5:2);
        gain.gain.setValueAtTime(freq*(voice==='keys'?.72:voice==='bell'?1.05:.6),when);
        gain.gain.exponentialRampToValueAtTime(Math.max(.1,freq*.012),when+Math.min(length,.3));b.connect(gain);gain.connect(a.frequency);a.connect(mix);
      }else{
        a.type=voice==='bass'?'triangle':voice==='pad'?'sawtooth':voice==='fuzz'?'sawtooth':voice==='pluck'?'triangle':wave;
        b.type=voice==='pad'?'triangle':'sine';b.frequency.value=freq*(voice==='bass'?.5:voice==='wood'?1.5:voice==='pluck'?2:1);
        if(voice==='pad'||voice==='lead'){a.detune.setValueAtTime(-4,when);a.detune.linearRampToValueAtTime(3,end);b.detune.value=5;}
        mix.gain.value=.78;gain.gain.value=voice==='bass'?.35:voice==='wood'?.3:voice==='pluck'?.2:.24;
        a.connect(mix);b.connect(gain);gain.connect(mix);
      }
      this.finish([a,b],nodes,when,end);
    }
    drum(kind,when,level=.1) {
      const c=this.context;when=Math.max(c.currentTime,when);const kick=kind==='kick',rim=kind==='rim',hat=kind==='hat'||kind==='openhat';
      const length=kick?.3:kind==='openhat'?.16:hat?.065:rim?.085:.19,end=when+length;
      if(!this.reserve(when,end,hat?1:2))return;
      const amp=c.createGain(),filter=c.createBiquadFilter(),noise=c.createBufferSource();noise.buffer=this.noise;
      filter.type=kick?'highpass':hat?'highpass':'bandpass';filter.frequency.value=kick?4200:hat?6200:rim?2300:1850;filter.Q.value=hat?.5:.8;
      noise.connect(filter);filter.connect(amp);amp.connect(this.output);
      amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,level*(kick?.13:rim?.55:1)),when+.002);amp.gain.exponentialRampToValueAtTime(.0001,when+(kick?.018:length));
      const sources=[noise],nodes=[amp,filter];
      if(!hat){const body=c.createOscillator(),g=c.createGain();body.type=kick?'sine':'triangle';body.frequency.setValueAtTime(kick?150:rim?1250:190,when);body.frequency.exponentialRampToValueAtTime(kick?45:rim?700:125,when+Math.min(.14,length));g.gain.setValueAtTime(level*(kick?1:rim?.4:.36),when);g.gain.exponentialRampToValueAtTime(.0001,end);body.connect(g);g.connect(this.output);sources.push(body);nodes.push(g);}
      this.finish(sources,nodes,when,end);
    }
  }
  globalThis.SoundGardenSynth=SoundGardenSynth;
  globalThis.SoundGardenComposer=Object.freeze({styles,createSong,sectionFor,frequency,voicing});
})();
