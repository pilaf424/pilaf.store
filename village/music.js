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
  globalThis.SoundGardenComposer=Object.freeze({styles,createSong,sectionFor,frequency});
})();
