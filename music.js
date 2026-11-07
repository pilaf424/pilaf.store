/* Seeded, style-specific compositions. Replay preserves a song; phrases develop it. */
(() => {
  'use strict';
  const major=[0,2,4,5,7,9,11], minor=[0,2,3,5,7,8,10], dorian=[0,2,3,5,7,9,10];
  const styles = [
    {name:'Sunroom shuffle',genre:'Swing',scale:major,bpm:108,swing:.24,voice:'triangle',groove:'swing',kicks:[0,4],snares:[2,6],bass:[0,2,4,6]},
    {name:'Moonlit tapes',genre:'Lo-fi',scale:minor,bpm:78,swing:.13,voice:'sine',groove:'lofi',kicks:[0,5],snares:[2,6],bass:[0,4]},
    {name:'Pocket disco',genre:'Disco',scale:major,bpm:122,swing:0,voice:'triangle',groove:'disco',kicks:[0,2,4,6],snares:[2,6],bass:[0,1,3,4,5,7]},
    {name:'Moss & starlight',genre:'Ambient',scale:dorian,bpm:64,swing:0,voice:'sine',groove:'ambient',kicks:[],snares:[],bass:[0],echo:.25},
    {name:'Pixel picnic',genre:'Chiptune',scale:major,bpm:140,swing:0,voice:'square',groove:'chip',kicks:[0,4],snares:[2,6],bass:[0,2,4,6,7]},
    {name:'Lantern dub',genre:'Dub',scale:dorian,bpm:84,swing:.04,voice:'triangle',groove:'dub',kicks:[4],snares:[4],bass:[0,3,5],echo:.4},
    {name:'Paper bossa',genre:'Bossa',scale:major,bpm:116,swing:0,voice:'sine',groove:'bossa',kicks:[0,3,4,7],snares:[2,5],bass:[0,3,4,7]},
    {name:'After-rain garage',genre:'UK garage',scale:minor,bpm:130,swing:.22,voice:'triangle',groove:'garage',kicks:[0,3,5],snares:[2,6],bass:[0,2.5,5,7]},
    {name:'Circuit breakbeat',genre:'Breakbeat',scale:minor,bpm:146,swing:.03,voice:'square',groove:'breaks',kicks:[0,3,4,7],snares:[2,6],bass:[0,1.5,3,4,6.5]},
    {name:'Bamboo courtyard',genre:'Mallets',scale:major,bpm:96,swing:0,voice:'sine',groove:'mallets',kicks:[0,4],snares:[3,6],bass:[0,4,6],echo:.18}
  ];
  // Each vocabulary supplies its own phrase shapes, harmonic motion and groove.
  // Pattern triples are [eighth-note position, motif slot, held eighth notes].
  const scores={
    swing:{forms:['Head','Trading phrases','Bass break','Full chorus'],harmony:'seventh',lead:'keys',chord:'keys',octave:12,
      motifs:[[4,5,4,2,1,3,2,0],[2,4,5,6,4,3,1,0],[7,6,4,2,3,4,1,0]],progressions:[[1,4,0,5],[0,5,1,4],[3,4,2,5]],
      a:[[0,0,.8],[1,1,.7],[2.5,2,.45],[3,3,.7],[4,4,1.2],[6,5,.6],[7,6,.6]],b:[[0,2,1.7],[2,3,.7],[3,4,.8],[5,5,.7],[6,6,.65],[7,7,.8]],
      chords:[[0,1.25,.8],[3,1,.65],[6,1.4,.85]],counter:[[2,1],[5,2],[7,0]],chordLevel:.72},
    lofi:{forms:['Tape loop','Late-night answer','Dusty break','Warm return'],harmony:'ninth',lead:'keys',chord:'keys',octave:0,
      motifs:[[4,2,1,0,2,4,3,1],[7,4,3,2,4,2,1,0],[2,3,4,2,1,0,2,0]],progressions:[[0,3,1,4],[5,3,0,0],[1,4,0,0]],
      a:[[.5,0,1.8],[3,1,.8],[4.5,2,2.1],[7,3,.65]],b:[[0,4,2.7],[3.5,5,1.5],[6,6,1.65]],
      chords:[[0,3,.7],[4.5,2.7,.58]],counter:[[5,0]],chordLevel:.68},
    disco:{forms:['Hook','Lift','Dance-floor break','Hands up'],harmony:'sixth',lead:'pluck',chord:'keys',octave:12,
      motifs:[[0,0,4,5,7,5,4,2],[2,4,2,0,4,5,7,4],[4,4,5,7,9,7,5,4]],progressions:[[0,5,3,4],[3,4,0,5],[0,3,5,4]],
      a:[[0,0,.55],[1,1,.45],[2,2,.8],[3.5,3,.45],[4,4,.8],[6,5,.5],[7,6,.6]],b:[[0,4,.7],[1,5,.45],[2.5,6,.45],[3,7,.6],[5,2,.55],[6,3,.6],[7,7,.65]],
      chords:[[1,.65,.78],[3,.65,.68],[5,.65,.8],[7,.65,.68]],counter:[[1,0],[3,2],[5,1],[7,2]],chordLevel:.6},
    ambient:{forms:['First light','Drifting','Open sky','Constellation'],harmony:'open',lead:'lead',chord:'pad',octave:12,
      motifs:[[0,4,8,7,4,1,4,0],[4,7,8,4,2,0,4,7],[0,1,4,7,8,4,2,0]],progressions:[[0,0,3,3],[0,4,0,5],[0,0,5,3]],
      a:[[0,0,5.6],[6,1,3.8]],b:[[2,2,5.2]],chords:[[0,7.8,.62]],counter:[[6,1]],chordLevel:.6},
    chip:{forms:['Level theme','Jump pattern','Secret room','Bonus stage'],harmony:'triad',lead:'lead',chord:'pluck',octave:12,
      motifs:[[0,7,4,2,4,7,9,7],[4,2,0,7,5,4,2,0],[0,2,4,7,9,7,4,2]],progressions:[[0,5,3,4],[0,3,4,0],[5,3,0,4]],
      a:[[0,0,.65],[1,1,.35],[1.5,2,.35],[2,3,.75],[3,4,.35],[3.5,5,.35],[4,6,1.3],[6,7,.35],[6.5,5,.35],[7,3,.65]],b:[[0,4,.7],[1,3,.35],[1.5,2,.35],[2,1,.7],[3,0,.7],[4,4,.35],[4.5,5,.35],[5,6,.7],[6,7,1.4]],
      chords:[[0,.55,.65],[2,.55,.6],[4,.55,.65],[6,.55,.6]],counter:[[0,0],[.5,1],[1,2],[1.5,1],[2,0],[2.5,1],[3,2],[3.5,1],[4,0],[4.5,1],[5,2],[5.5,1],[6,0],[6.5,1],[7,2],[7.5,1]],chordLevel:.42},
    dub:{forms:['Bass message','Echo answer','Dub space','Return of the bass'],harmony:'triad',lead:'wood',chord:'keys',octave:0,
      motifs:[[0,2,4,3,2,0,4,0],[4,4,2,0,2,3,2,0],[0,4,3,2,0,2,4,0]],progressions:[[0,0,3,4],[0,3,0,4],[0,0,5,3]],
      a:[[1,0,.6],[3,1,.65],[6,2,1.4]],b:[[0,4,1.4],[3,5,.7],[7,7,.7]],
      chords:[[1,.5,.8],[3,.5,.68],[5,.5,.76],[7,.5,.6]],counter:[[3,0],[7,2]],chordLevel:.64},
    bossa:{forms:['Courtyard theme','Gentle answer','Guitar passage','Evening refrain'],harmony:'seventh',lead:'pluck',chord:'pluck',octave:12,
      motifs:[[2,4,5,4,2,1,3,2],[4,3,2,0,1,2,4,0],[7,5,4,2,3,1,2,0]],progressions:[[0,5,1,4],[3,2,1,4],[1,4,0,5]],
      a:[[0,0,1.25],[1.5,1,.8],[3,2,1.65],[5,3,1.2],[6.5,4,1.2]],b:[[0,5,2.1],[2.5,4,.8],[4,3,1.4],[5.5,6,.8],[7,7,.8]],
      chords:[[0,.9,.8],[1.5,.75,.6],[3.5,1,.65],[5,.9,.75],[6.5,.8,.6]],counter:[[2,1],[5.5,2]],chordLevel:.68},
    garage:{forms:['Night bus','Vocal fragments','Half-lit break','Two-step return'],harmony:'ninth',lead:'lead',chord:'keys',octave:12,
      motifs:[[4,4,2,7,4,2,1,0],[7,4,2,4,5,4,2,0],[2,4,7,4,2,1,4,0]],progressions:[[0,0,5,4],[0,3,5,4],[5,3,0,4]],
      a:[[.5,0,.45],[1.5,1,.4],[3,2,.7],[4.5,3,.45],[6.5,4,.4]],b:[[0,4,.6],[2.5,5,.4],[3.5,6,.45],[5,5,.55],[7.5,7,.35]],
      chords:[[.5,.7,.7],[3,.8,.65],[6.5,.65,.75]],counter:[[1.5,2],[5.5,1]],chordLevel:.55},
    breaks:{forms:['Riff','Counter-riff','Breakdown','Full break'],harmony:'power',lead:'fuzz',chord:'pad',octave:0,
      motifs:[[0,0,2,3,4,3,2,0],[0,4,3,0,2,0,3,2],[4,2,0,2,3,4,2,0]],progressions:[[0,0,6,5],[0,3,0,6],[0,5,3,4]],
      a:[[0,0,.4],[.5,1,.35],[2,2,.6],[3.5,3,.4],[4,4,.7],[5.5,5,.35],[7,6,.55]],b:[[0,4,.55],[1.5,3,.4],[3,2,.7],[4.5,1,.35],[5,0,.65],[6.5,6,.4],[7.5,7,.3]],
      chords:[[0,3.5,.7],[4,2.2,.65]],counter:[[1,2],[3.5,0],[6,1],[7.5,2]],chordLevel:.45},
    mallets:{forms:['Bamboo theme','Interlocking answer','Still water','Garden dance'],harmony:'open',lead:'mallet',chord:'mallet',octave:12,
      motifs:[[0,2,4,7,5,4,2,0],[4,5,7,9,7,4,2,0],[0,4,2,5,4,7,5,2]],progressions:[[0,3,0,4],[0,0,3,3],[0,4,3,0]],
      a:[[0,0,1.3],[1.5,1,1.1],[3,2,1.3],[4.5,3,1.1],[6,4,1.5]],b:[[.5,5,1.3],[2,4,1.2],[3.5,3,1.4],[5,6,1.3],[6.5,7,1.2]],
      chords:[[0,2.3,.65],[4,2.3,.65]],counter:[[.75,2],[2.25,1],[3.75,0],[5.25,2],[6.75,1]],chordLevel:.65}
  };
  // The second and third sections are written as new musical material, rather
  // than relabeling the same loop. The last section brings the opening back.
  const development={
    swing:{answer:[7,5,6,4,2,3,1,0],bridge:[2,1,0,4,5,3,2,1],answerProgression:[3,6,1,4],bridgeProgression:[5,1,4,4],answerPattern:[[0,0,1.6],[2,1,.7],[3,2,.7],[4.5,3,.4],[5,4,.7],[6,5,.7],[7,7,.7]],bridgePattern:[[0,0,2.6],[3,1,.6],[4,3,1.7],[6,5,1.6]],bridgeChords:[[0,2.8,.7],[4,2.8,.65]]},
    lofi:{answer:[7,6,4,3,2,4,1,0],bridge:[2,0,1,4,3,2,0,1],answerProgression:[3,3,1,4],bridgeProgression:[5,4,3,3],answerPattern:[[1,0,1.6],[3.5,2,1.1],[5,3,1.6],[7,6,.7]],bridgePattern:[[0,0,3.2],[4,3,2.8]],bridgeChords:[[0,6.7,.63]]},
    disco:{answer:[7,9,7,5,4,5,2,0],bridge:[4,2,0,2,5,4,2,0],answerProgression:[3,4,5,4],bridgeProgression:[5,5,3,4],answerPattern:[[.5,0,.4],[1.5,1,.4],[3,2,.7],[4.5,3,.4],[5.5,4,.4],[7,7,.7]],bridgePattern:[[0,0,1.4],[3,2,.6],[4,4,1.4],[7,7,.65]],bridgeChords:[[0,1.2,.75],[3,1,.6],[6,1.1,.7]]},
    ambient:{answer:[7,8,11,9,7,4,5,4],bridge:[2,5,4,1,0,2,4,0],answerProgression:[3,3,5,5],bridgeProgression:[5,5,1,1],answerPattern:[[1,0,5.6],[7,4,4.2]],bridgePattern:[[3,0,6.6]],bridgeChords:[[0,8,.65]]},
    chip:{answer:[7,9,11,9,7,5,4,2],bridge:[2,4,5,9,7,5,2,0],answerProgression:[3,4,5,4],bridgeProgression:[5,3,1,4],answerPattern:[[0,0,.35],[.5,1,.35],[1,2,.7],[2,3,.35],[2.5,4,.35],[3,5,.7],[4,6,1.5],[6,7,.7],[7,4,.7]],bridgePattern:[[0,0,1.6],[2,2,1.6],[4,4,1.6],[6,7,1.6]],bridgeChords:[[0,1.4,.55],[4,1.4,.55]]},
    dub:{answer:[4,7,4,2,0,2,3,0],bridge:[0,3,2,0,4,2,0,0],answerProgression:[3,3,0,4],bridgeProgression:[5,5,0,0],answerPattern:[[2,0,.65],[5,2,.7],[7,4,.7]],bridgePattern:[[3,0,1.5],[6,2,.8]],bridgeChords:[[3,.5,.72],[7,.5,.65]]},
    bossa:{answer:[7,6,5,4,2,3,1,0],bridge:[3,5,6,4,3,2,1,0],answerProgression:[3,6,1,4],bridgeProgression:[5,2,1,4],answerPattern:[[.5,0,1.3],[2,1,1.1],[3.5,3,1.4],[5,4,1.8],[7,7,.7]],bridgePattern:[[0,0,2.1],[2.5,2,1.6],[5,4,2.5]],bridgeChords:[[0,1.6,.75],[2.5,1.5,.65],[5,2,.7]]},
    garage:{answer:[7,9,7,4,5,4,2,0],bridge:[0,2,3,4,2,1,0,0],answerProgression:[5,3,4,4],bridgeProgression:[3,3,5,4],answerPattern:[[1,0,.4],[2.5,1,.45],[4,3,.6],[5.5,4,.4],[7,7,.6]],bridgePattern:[[1,0,2.7],[5,3,2.6]],bridgeChords:[[1,2.1,.65],[5,2.1,.6]]},
    breaks:{answer:[7,4,5,3,4,2,0,2],bridge:[3,2,0,4,3,0,2,0],answerProgression:[6,5,0,4],bridgeProgression:[3,3,5,6],answerPattern:[[.5,0,.35],[1,1,.6],[2.5,2,.4],[4,3,.35],[4.5,4,.35],[6,5,.65],[7,7,.5]],bridgePattern:[[0,0,2.5],[3,2,1.6],[6,4,1.5]],bridgeChords:[[0,4.7,.65],[6,1.5,.7]]},
    mallets:{answer:[7,9,11,9,7,5,4,2],bridge:[2,4,5,4,2,0,4,0],answerProgression:[3,4,0,0],bridgeProgression:[5,5,3,0],answerPattern:[[.75,0,1.1],[2.25,1,1.2],[3.75,3,1.1],[5.25,4,1.2],[6.75,7,1.1]],bridgePattern:[[0,0,2.5],[3,2,2.5],[6,4,1.8]],bridgeChords:[[0,2.6,.6],[3,2.6,.6],[6,1.8,.6]]}
  };
  function random(seed) {return () => {let value=seed+=0x6D2B79F5;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return ((value^value>>>14)>>>0)/4294967296;};}
  const choose=(list,rng)=>list[Math.floor(rng()*list.length)];
  const frequency=midi=>440*2**((midi-69)/12);
  function degreeNote(style,degree) {return style.scale[((degree%7)+7)%7]+12*Math.floor(degree/7);}
  function createSong(style,seed) {
    const rng=random(seed),design=scores[style.groove],root=48+Math.floor(rng()*12),motif=[...choose(design.motifs,rng)];
    // Vary a phrase's interior while preserving its memorable opening/cadence.
    if(rng()>.55){const i=choose([2,4,5],rng);motif[i]=Math.max(0,Math.min(11,motif[i]+choose([-1,1],rng)));}
    const progression=[...choose(design.progressions,rng)];
    const title=choose(['Apricot','Velvet','Porcelain','Meadow','Honey','Paper','Clover','Amber','Lantern','Cloud','Willow','Mint'],rng)+' '+choose(['postcards','footsteps','daydream','pockets','afterglow','satellites','raindrops','picnic','sketches','echoes','drift','letters'],rng);
    return {style,title,seed:seed>>>0,root,motif,progression,bpm:style.bpm+Math.floor(rng()*7)-3,
      pitches:motif.map(degree=>frequency(root+design.octave+degreeNote(style,degree)))};
  }
  function voicing(song,chord,bar=0,rich=true,bright=false) {
    const design=scores[song.style.groove],degree=song.style.scale.indexOf(((chord[0]%12)+12)%12)+Math.floor(chord[0]/12)*7;
    let tones=[...chord];
    if(design.harmony==='open')tones=[chord[0],chord[2],degreeNote(song.style,degree+8)];
    else if(design.harmony==='power')tones=[chord[0],chord[2],chord[0]+12];
    else if(rich&&design.harmony==='sixth')tones.push(degreeNote(song.style,degree+5));
    else if(rich&&['seventh','ninth'].includes(design.harmony)){
      tones.push(degreeNote(song.style,degree+6));
      if(design.harmony==='ninth'||bright)tones[2]=degreeNote(song.style,degree+8);
    }
    const open=['open','power'].includes(design.harmony);
    return tones.map((tone,i)=>{let midi=song.root+tone;while(midi<song.root+(open?0:3))midi+=12;while(midi>song.root+(open?24:21))midi-=12;if(!open&&i===0&&bar%2&&midi-12>=song.root)midi-=12;return midi;}).sort((a,b)=>a-b);
  }
  const sectionCache=new WeakMap();
  function sectionFor(song,index) {
    let cache=sectionCache.get(song);if(!cache){cache=new Map();sectionCache.set(song,cache);}if(cache.has(index))return cache.get(index);
    const design=scores[song.style.groove],rng=random((song.seed^Math.imul(index+1,0x9e3779b1))>>>0),phase=((index%4)+4)%4;
    const dev=development[song.style.groove],form=design.forms[phase],motif=[...(phase===1?dev.answer:phase===2?dev.bridge:song.motif)],progression=[...(phase===1?dev.answerProgression:phase===2?dev.bridgeProgression:song.progression)];
    if(index>=4){const slot=2+Math.floor(rng()*4);motif[slot]=Math.max(0,Math.min(11,motif[slot]+(rng()>.5?1:-1)));}
    const chords=progression.map(degree=>[0,2,4].map(offset=>degreeNote(song.style,degree+offset)));
    const melody=motif.map(degree=>frequency(song.root+design.octave+degreeNote(song.style,degree)));
    const gate=Array.from({length:8},(_,i)=>design.a.some(n=>Math.floor(n[0])===i));
    const accents=Array.from({length:8},(_,i)=>(i%2?.78:1)*(0.94+rng()*.06));
    const section={index,phase,form,chords,melody,gate,accents,counter:Array.from({length:8},(_,i)=>(i+phase)%3),fill:phase===3?7.5:7,sparse:phase===2,bright:phase===3,bassOctave:0,parts:[]};
    for(let bar=0;bar<4;bar++)section.parts.push(composeBar(song,section,bar,motif,progression,rng));
    cache.set(index,section);if(cache.size>16)cache.delete(cache.keys().next().value);return section;
  }
  function composeBar(song,section,bar,motif,progression,rng) {
    const style=song.style,g=style.groove,d=scores[g],chord=section.chords[bar],parts={lead:[],chords:[],bass:[],counter:[],drums:[]};
    const note=(part,at,midi,length,velocity=1,voice=d.lead)=>parts[part].push({at,midi,length,velocity,voice,wave:style.voice});
    const drum=(kind,at,velocity=1)=>parts.drums.push({kind,at,velocity});
    const dev=development[g],answering=bar%2===1,pattern=section.phase===2?dev.bridgePattern:section.phase===1?(answering?d.a:dev.answerPattern):(answering?d.b:d.a);
    for(const [n,[at,slot,length]] of pattern.entries()){
      let degree=motif[(slot+(section.phase===2&&answering?2:0))%8]+(bar===2&&g!=='ambient'&&g!=='dub'?2:0);
      if(answering&&n===pattern.length-1)degree=bar===3?0:2;
      if(g==='mallets')degree=[0,2,4,5,7,9,11].reduce((a,b)=>Math.abs(b-degree)<Math.abs(a-degree)?b:a);
      // Strong beats lean toward the active chord; passing notes keep each style's contour.
      if(at%2===0&&n>0&&g!=='chip'&&g!=='mallets'){
        const choices=[0,2,4,7].map(v=>progression[bar]+v);
        degree=choices.reduce((a,b)=>Math.abs(b-degree)<Math.abs(a-degree)?b:a);
      }
      const midi=song.root+d.octave+degreeNote(style,degree),velocity=(at%2===0?1:.82)*(section.sparse?.78:1);
      note('lead',at,midi,length,velocity);
      // Dub has an actual answering echo rhythm; ambient repeats are very sparse.
      if(g==='dub'&&at+1.5<8)note('lead',at+1.5,midi,length*.8,velocity*.24,d.lead);
    }
    if(section.bright&&bar===3&&!['ambient','dub'].includes(g)){
      const at=g==='mallets'?7.5:6.5;
      note('lead',at,song.root+d.octave+degreeNote(style,2),.35,.65);
    }
    const chordPattern=section.sparse?dev.bridgeChords:d.chords;
    for(const [at,length,velocity] of chordPattern){
      if(g==='ambient'&&bar%2===1)continue;
      for(const [i,midi] of voicing(song,chord,bar,true,section.bright).entries())note('chords',at+i*(g==='bossa'?.045:.018),midi,length,velocity*d.chordLevel,d.chord);
    }
    let bass;
    switch(g){
      case 'swing':bass=[[0,0,0,1.35],[2,1,0,1.3],[4,2,0,1.3],[6,1,0,1.4]];break;
      case 'lofi':bass=[[0,0,0,2.3],[4,2,0,2.2]];break;
      case 'disco':bass=[[0,0,0,.7],[1,0,12,.5],[3,2,0,.6],[4,0,0,.8],[5,0,12,.5],[7,2,12,.5]];break;
      case 'ambient':bass=bar%2===0?[[0,0,0,7.8]]:[];break;
      case 'chip':bass=[[0,0,0,.7],[2,0,12,.6],[4,2,0,.7],[6,0,12,.6],[7,2,0,.5]];break;
      case 'dub':bass=[[0,0,-12,2.2],[3,0,-12,.8],[5,2,-12,1.8]];break;
      case 'bossa':bass=[[0,0,0,1.8],[3,2,0,.8],[4,0,0,1.8],[7,2,0,.8]];break;
      case 'garage':bass=[[0,0,0,.7],[2.5,0,0,.45],[5,2,0,.8],[7,0,12,.4]];break;
      case 'breaks':bass=[[0,0,0,.6],[1.5,0,0,.4],[3,2,0,.6],[4,0,0,.7],[6.5,1,0,.55]];break;
      default:bass=[[0,0,0,2.2],[4,2,0,1.5],[6,0,0,1.25]];
    }
    for(const [at,degree,octave,length] of bass){if(section.sparse&&bar===0&&at>0)continue;let midi=song.root-12+chord[degree]+octave;if(g==='swing'&&at===6&&bar===3)midi=song.root-12+section.chords[0][0]-1;note('bass',at,midi,length,at===0?1:.8,'bass');}
    for(const [n,[at,degree]] of d.counter.entries()){
      if(section.sparse&&n%3!==0)continue;
      if(g==='ambient'&&bar%2===0)continue;
      const octave=g==='breaks'?12:24,velocity=g==='chip'?.42:g==='ambient'?.42:.7;
      note('counter',at,song.root+octave+chord[(degree+bar)%3],g==='ambient'?3.5:g==='mallets'?1.4:.65,velocity,g==='mallets'?'mallet':g==='chip'?'lead':'bell');
    }
    // Drums use full patterns, not a universal eighth-note hat over every style.
    const sparse=section.sparse&&bar<2;
    if(g==='ambient')return parts;
    if(g==='swing'){
      for(const at of [0,4])drum('kick',at,.48);for(const at of [2,6])drum('rim',at,.8);
      for(const at of [0,2,3,4,6,7])drum('hat',at,at%2?.38:.7);
    }else if(g==='lofi'){
      for(const at of [0,bar%2?4.5:5])drum('kick',at,.82);for(const at of [2,6])drum('snare',at,.6);
      for(const at of [.5,2.5,4.5,6.5])drum('hat',at,.32);if(bar%2)drum('rim',7.5,.25);
    }else if(g==='disco'){
      for(const at of [0,2,4,6])drum('kick',at,1);for(const at of [2,6])drum('snare',at,.78);for(const at of [1,3,5,7])drum('openhat',at,.7);
    }else if(g==='chip'){
      for(const at of [0,4])drum('kick',at,.8);for(const at of [2,6])drum('snare',at,.62);for(const at of [0,1,2,3,4,5,6,7])drum('hat',at,.34);
    }else if(g==='dub'){
      drum('kick',4,.95);drum('rim',4,1);for(const at of [1,3,5,7])drum('hat',at,.4);if(bar%2)drum('rim',5.5,.28);
    }else if(g==='bossa'){
      for(const at of [0,3,4,7])drum('kick',at,.4);for(const at of (bar%2?[1,3,6]:[0,3,5]))drum('rim',at,.55);for(let at=.5;at<8;at++)drum('hat',at,.25);
    }else if(g==='garage'){
      for(const at of (bar%2?[0,3.5,5]:[0,3,5.5]))drum('kick',at,.95);for(const at of [2,6])drum('snare',at,.8);for(const at of [.5,1.5,3.5,4.5,5,7,7.5])drum('hat',at,at%1?.42:.65);drum('rim',4.5,.24);
    }else if(g==='breaks'){
      for(const at of (bar%2?[0,1.5,4,5.5,7]:[0,3,4,6.5]))drum('kick',at,.9);for(const at of [2,6])drum('snare',at,.85);for(const at of [1.5,3.5,5,7.5])drum('snare',at,.22);for(let at=0;at<8;at+=.5)drum('hat',at,at%1?.2:.38);
    }else{
      for(const at of [0,4])drum('kick',at,.34);for(const at of [1.5,3,4.5,6])drum('rim',at,.48);for(const at of [.75,2.25,3.75,5.25,6.75])drum('hat',at,.26);
    }
    if(sparse)parts.drums=parts.drums.filter(e=>e.kind==='kick'&&e.at===0||e.kind==='rim'&&e.at===4);
    if(bar===3&&section.bright&&g!=='dub'&&g!=='bossa')for(const at of [7,7.5])drum(g==='mallets'?'rim':'snare',at,.34);
    return parts;
  }
  function events(song,section,bar,slot,part) {
    const plan=section.parts?.[((bar%4)+4)%4]?.[part]||[];
    return plan.filter(e=>Math.floor(e.at+1e-8)===slot).map(e=>({...e,offset:e.at-slot}));
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
      // Different instruments schedule fractional notes in a different order.
      // Retain all live reservations and test their actual interval overlap.
      this.windows=this.windows.filter(v=>v.end>this.context.currentTime);
      end+=.025;const edges=[[when,count],[end,-count]];
      for(const v of this.windows)if(v.when<end&&v.end>when){edges.push([Math.max(when,v.when),v.count],[Math.min(end,v.end),-v.count]);}
      edges.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let active=0;
      for(const [,change] of edges){active+=change;if(active>this.limit)return false;}
      this.windows.push({when,end,count});return true;
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
  globalThis.SoundGardenComposer=Object.freeze({styles,createSong,sectionFor,frequency,voicing,events});
})();
