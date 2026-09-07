(() => {
  'use strict';
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ink = '#243e32', green = '#356449', paper = '#fffdf0';
  const worldWidth = 2540, floor = 380;
  const platforms = [{x:290,y:300,w:135},{x:540,y:238,w:135},{x:835,y:296,w:155},{x:1170,y:265,w:140},{x:1470,y:300,w:150},{x:1765,y:245,w:145},{x:2050,y:298,w:145}];
  const positions = [[200,337],[355,261],[607,199],[910,257],[1240,226],[1545,261],[1840,206],[2125,259]];
  const songStyles = [
    {name:'Sunroom shuffle',scale:[0,2,4,7,9],chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],bpm:104,swing:.13,voice:'triangle'},
    {name:'Moonlit tapes',scale:[0,3,5,7,10],chords:[[0,3,7],[8,12,15],[3,7,10],[10,14,17]],bpm:86,swing:.08,voice:'sine'},
    {name:'Pocket disco',scale:[0,2,4,7,9],chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],bpm:120,swing:0,voice:'triangle'},
    {name:'Moss & starlight',scale:[0,3,5,7,10],chords:[[0,3,7],[5,8,12],[8,12,15],[7,10,14]],bpm:94,swing:.18,voice:'sine'}
  ];
  const motifs = [[0,1,2,4,3,2,1,0],[0,2,1,3,4,3,2,1],[2,1,0,2,3,4,3,0],[0,3,2,1,2,4,1,0]];
  const pick = list => list[Math.floor(Math.random()*list.length)];
  const frequency = midi => 440 * 2 ** ((midi-69)/12);
  let song, pitches, pausedFrom = 'playing', partyTime = 0, hasStarted = false;
  const characters = [
    {id:'onigiri',name:'Onigiri Listener'},
    {id:'cat',name:'Cat Nap Keyboard'},
    {id:'fox',name:'Fox Pocket Sampler'},
    {id:'rabbit',name:'Moon Rabbit Theremin'},
    {id:'axolotl',name:'Axolotl Ribbon Slide'}
  ];
  let activeCharacter = characters[0];
  let notes, player, camera = 0, phase = 'ready', count = 0, last = 0, elapsed = 0;
  let audio, master, audioBus, noiseBuffer, muted = true, beat = 0, nextBeat = 0, jumpRequested = false, jumpHeld = false;
  const sources = new Set();
  let outputVolume = Number($('volume').value) / 100;
  const keys = new Set(), touch = new Set();
  function composeSong() {
    const style = pick(songStyles.filter(style => style !== song?.style));
    const root = pick([48,50,53,55]);
    const motif = [...pick(motifs)];
    motif[3] = pick([2,3,4]); motif[6] = pick([0,1,2,3]);
    song = {style,root,motif,bpm:style.bpm+pick([-4,0,4])};
    pitches = motif.map(degree => frequency(root+12+style.scale[degree]));
    $('song-name').textContent = `${style.name} · ${song.bpm} BPM`;
    $('finished-title').textContent = style.name;
  }
  function stopVoices() {
    for(const source of sources) {try { source.stop(); } catch { /* Already ended. */ }}
    sources.clear();
  }
  function resetTransport() { stopVoices(); beat = 0; partyTime = 0; nextBeat = audio ? audio.currentTime+.08 : 0; }
  function reset(changeCharacter = true) {
    phase = 'ready';
    composeSong(); resetTransport();
    $('party-caption').hidden = true; $('replay').hidden = true;
    $('restart').textContent = 'Restart ↺';
    document.querySelector('.touch-controls').hidden = false;
    if(changeCharacter) {
      const choices = characters.filter(character => character !== activeCharacter);
      activeCharacter = choices[Math.floor(Math.random() * choices.length)];
    }
    $('character-name').textContent = `Playing as ${activeCharacter.name}`;
    $('overlay-kicker').textContent = `Meet the ${activeCharacter.name}`;
    notes = positions.map(([x,y]) => ({x,y,found:false}));
    player = {x:65,y:floor-52,vx:0,vy:0,grounded:true,face:1};
    count = 0; camera = 0; beat = 0; keys.clear(); touch.clear(); jumpRequested = false; jumpHeld = false;
    $('score').textContent = '00 / 08 notes';
    $('status').textContent = `${activeCharacter.name} is ready. Follow the notes!`;
  }
  function audioLabel(){ $('sound').textContent = muted ? 'Sound off' : 'Sound on'; $('sound').setAttribute('aria-pressed', String(!muted)); }
  function setOutput() {
    if(master) master.gain.setTargetAtTime(muted ? 0 : outputVolume, audio.currentTime, .015);
    $('volume-value').textContent = `${Math.round(outputVolume * 100)}%`;
  }
  async function enableAudio(chime = false) {
    try {
      if (!audio) {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        audioBus = audio.createGain();
        const compressor = audio.createDynamicsCompressor();
        compressor.threshold.value = -12; compressor.knee.value = 10; compressor.ratio.value = 4;
        compressor.attack.value = .003; compressor.release.value = .18;
        master = audio.createGain(); master.gain.value = 0;
        audioBus.connect(compressor); compressor.connect(master); master.connect(audio.destination);
        noiseBuffer = audio.createBuffer(1,audio.sampleRate*.25,audio.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
      }
      await audio.resume(); nextBeat = audio.currentTime + .08;
      setOutput();
      if(chime && phase === 'playing') [0,2,4].forEach((index, i) => tone(pitches[index], audio.currentTime + .03 + i * .13, .25, .25, song.style.voice));
    } catch { muted = true; audioLabel(); setOutput(); $('status').textContent = 'Sound could not start. Tap Sound off to try again.'; }
  }
  function tone(freq, when, length = .2, volume = .3, type = 'sine') {
    if (!audio || muted || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(volume, when + .012);
    gain.gain.linearRampToValueAtTime(volume * .65, when + length * .6);
    gain.gain.exponentialRampToValueAtTime(.001, when + length);
    oscillator.connect(gain); gain.connect(audioBus); sources.add(oscillator); oscillator.start(when); oscillator.stop(when + length + .025);
    oscillator.onended = () => { sources.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  }
  function drum(kind, when) {
    if(!audio || muted || audio.state !== 'running') return;
    const gain = audio.createGain(); gain.connect(audioBus);
    let source, filter;
    const length = kind === 'hat' ? .055 : .16;
    const level = kind === 'kick' ? .32 : kind === 'snare' ? .12 : .055;
    if(kind === 'kick') {
      source = audio.createOscillator(); source.frequency.setValueAtTime(145,when); source.frequency.exponentialRampToValueAtTime(48,when+.12); source.connect(gain);
    } else {
      source = audio.createBufferSource(); source.buffer = noiseBuffer;
      filter = audio.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = kind === 'hat' ? 6500 : 1500;
      source.connect(filter); filter.connect(gain);
    }
    gain.gain.setValueAtTime(0,when); gain.gain.linearRampToValueAtTime(level,when+.003); gain.gain.exponentialRampToValueAtTime(.001,when+length);
    sources.add(source); source.start(when); source.stop(when+length+.01);
    source.onended = () => { sources.delete(source); source.disconnect(); filter?.disconnect(); gain.disconnect(); };
  }
  function music() {
    if (!audio || audio.state !== 'running' || !count) return;
    if (nextBeat < audio.currentTime - .1) nextBeat = audio.currentTime;
    const step = 60/song.bpm/2;
    while(nextBeat < audio.currentTime + .1) {
      const slot = beat % 8;
      const bar = Math.floor(beat/8)%4;
      const chord = song.style.chords[bar];
      const when = nextBeat + (slot%2 ? song.style.swing*step : 0);
      if(notes[slot].found) tone(pitches[slot],when,step*.85,phase === 'won' ? .22 : .3,song.style.voice);
      if(phase === 'won') {
        // The speaker unlocks a four-bar arrangement around the collected melody.
        if(slot === 0) for(const note of chord) tone(frequency(song.root+note),when,step*7.5,.075,'sine');
        if(slot%2 === 0) tone(frequency(song.root-12+chord[slot===6?2:0]),when,step*1.4,.22,'triangle');
        if(slot === 0 || slot === 4 || (song.style.name === 'Pocket disco' && slot === 6)) drum('kick',when);
        if(slot === 2 || slot === 6) drum('snare',when);
        drum('hat',when);
        if(bar%2 && slot%2) tone(frequency(song.root+24+chord[(slot>>1)%3]),when,step*.6,.075,'sine');
      } else if(slot%2 === 0) tone(frequency(song.root),when,.13,.12,'triangle');
      nextBeat += step; beat++;
    }
  }
  function showOverlay(kicker, title, copy, button) {
    $('overlay-kicker').textContent = kicker; $('overlay-title').textContent = title;
    $('overlay-copy').textContent = copy; $('start').textContent = button; $('overlay').hidden = false;
  }
  function begin() {
    if(phase === 'paused') {
      phase = pausedFrom; $('overlay').hidden = true; $('pause').textContent = 'Pause';
      if(!muted) enableAudio(); canvas.focus({preventScroll:true}); return;
    }
    const starting = phase === 'ready' || phase === 'won';
    if(!hasStarted) { muted = false; hasStarted = true; audioLabel(); }
    if(phase === 'won') reset();
    phase = 'playing'; $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pause';
    if(!muted) enableAudio(starting); canvas.focus({preventScroll:true});
  }
  function pause() {
    if(phase === 'paused') return begin();
    if(phase !== 'playing' && phase !== 'won') return;
    pausedFrom = phase; stopVoices();
    phase = 'paused'; keys.clear(); touch.clear(); jumpRequested = false; jumpHeld = false;
    $('pause').textContent = 'Resume';
    showOverlay('Take your time', 'A little breather.', 'Your notes will be right here.', pausedFrom === 'won' ? 'Back to the party ↗' : 'Keep wandering ↗');
  }
  function jump() { if(!jumpHeld) jumpRequested = true; jumpHeld = true; }
  $('start').addEventListener('click', begin);
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', () => {reset(); begin();});
  $('replay').addEventListener('click', () => { resetTransport(); if(phase === 'paused') begin(); canvas.focus({preventScroll:true}); });
  $('sound').addEventListener('click', () => { muted = !muted; audioLabel(); setOutput(); if(!muted) enableAudio(true); if(phase === 'playing') canvas.focus({preventScroll:true}); });
  $('volume').addEventListener('input', () => {
    outputVolume = Number($('volume').value) / 100;
    setOutput();
  });
  $('volume').addEventListener('pointerup', () => { if(phase === 'playing') canvas.focus({preventScroll:true}); });
  canvas.addEventListener('keydown', e => {
    if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','A','D','W','Escape'].includes(e.key)) e.preventDefault();
    if(e.key === 'Escape') { pause(); return; }
    if(phase !== 'playing') return;
    keys.add(e.key.toLowerCase());
    if([' ','ArrowUp','w','W'].includes(e.key) && !e.repeat) jump();
  });
  window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); if([' ','ArrowUp','w','W'].includes(e.key)) jumpHeld = false; });
  window.addEventListener('blur', () => { keys.clear(); touch.clear(); jumpHeld = false; if(phase === 'playing' || phase === 'won') pause(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && phase !== 'paused') pause(); });
  for(const button of document.querySelectorAll('[data-control]')) {
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if(phase !== 'playing') return;
      button.setPointerCapture(e.pointerId); touch.add(button.dataset.control);
      if(button.dataset.control === 'jump') jump();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => {touch.delete(button.dataset.control); if(button.dataset.control === 'jump') jumpHeld = false;});
  }
  function update(dt) {
    const left = keys.has('arrowleft') || keys.has('a') || touch.has('left');
    const right = keys.has('arrowright') || keys.has('d') || touch.has('right');
    player.vx = ((right?1:0)-(left?1:0))*235;
    if(player.vx) player.face = Math.sign(player.vx);
    if(jumpRequested && player.grounded) { player.vy = -555; player.grounded = false; }
    jumpRequested = false;
    const oldBottom = player.y + 52;
    player.x = Math.max(18,Math.min(worldWidth-58,player.x+player.vx*dt));
    player.vy += 1450*dt; player.y += player.vy*dt; player.grounded = false;
    for(const p of [...platforms,{x:0,y:floor,w:worldWidth}]) {
      if(player.vy >= 0 && oldBottom <= p.y+1 && player.y+52 >= p.y && player.x+38 > p.x && player.x+6 < p.x+p.w) {
        player.y = p.y-52; player.vy = 0; player.grounded = true; break;
      }
    }
    for(let i=0;i<notes.length;i++) {
      const n = notes[i];
      if(!n.found && Math.abs(player.x+22-n.x)<34 && Math.abs(player.y+25-n.y)<43) {
        n.found = true; count++; $('score').textContent = `${String(count).padStart(2,'0')} / 08 notes`;
        $('status').textContent = count === 8 ? 'All together now. Find the speaker at the end →' : `${count} ${count === 1 ? 'note' : 'notes'} found. The garden is waking up.`;
        if(audio) tone(pitches[i]*2,audio.currentTime,.3,.4);
      }
    }
    if(player.x > 2350) {
      if(count === 8) {
        phase = 'won'; resetTransport(); keys.clear(); touch.clear();
        $('status').textContent = `Your finished song: ${song.style.name}. All five friends are playing along!`;
        $('overlay').hidden = true; $('party-caption').hidden = false; $('replay').hidden = false;
        $('restart').textContent = 'New song ↺';
        document.querySelector('.touch-controls').hidden = true;
      } else $('status').textContent = `${8-count} ${8-count===1?'note is':'notes are'} still out there. Head back left to find them.`;
    }
    const view = canvas.width;
    camera += (Math.max(0,Math.min(worldWidth-view,player.x-view*.35))-camera)*Math.min(1,dt*8);
  }
  function line(x1,y1,x2,y2,color=ink,width=2) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function ellipse(x,y,rx,ry,fill,stroke) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function round(x,y,w,h,r,fill,stroke) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function label(text,x,y,size=10,color=ink) {ctx.fillStyle=color;ctx.font=`${size}px ui-monospace, monospace`;ctx.fillText(text,x,y);}
  function character(info = activeCharacter, pose = player, sway = 0, scale = 1, still = false) {
    ctx.save();ctx.translate(pose.x+22,pose.y+26);ctx.rotate(sway);ctx.scale(scale,scale);
    const bob = pose.grounded && pose.vx ? Math.sin(elapsed*18)*2 : 0;
    ctx.translate(0,bob);
    ellipse(-10,25,7,3,ink);ellipse(11,25,7,3,ink);
    const kind = info.id;
    if(kind === 'onigiri') {
      ctx.beginPath();ctx.moveTo(-22,16);ctx.quadraticCurveTo(-30,12,-19,-5);ctx.lineTo(-7,-24);ctx.quadraticCurveTo(0,-34,8,-23);ctx.lineTo(25,9);ctx.quadraticCurveTo(31,22,15,23);ctx.lineTo(-14,23);ctx.closePath();ctx.fillStyle=paper;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2.4;ctx.stroke();
      round(-9,9,18,15,3,green);
      ctx.beginPath();ctx.ellipse(0,-2,27,24,0,Math.PI,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();
      round(-30,-5,9,19,4,'#d2af76',ink);round(22,-5,9,19,4,'#d2af76',ink);
    } else if(kind === 'cat' || kind === 'fox') {
      const fur = kind === 'fox' ? '#c89565' : '#c6c4ac';
      ctx.save();ctx.translate(-20,13);ctx.rotate(-.5 + (still ? 0 : Math.sin(elapsed*4)*.1));ellipse(-8,0,17,8,fur,ink);ellipse(-18,0,6,6,paper);ctx.restore();
      ctx.beginPath();ctx.moveTo(-22,14);ctx.lineTo(-22,-25);ctx.lineTo(-7,-15);ctx.quadraticCurveTo(0,-18,8,-15);ctx.lineTo(23,-25);ctx.lineTo(23,14);ctx.quadraticCurveTo(21,25,0,24);ctx.quadraticCurveTo(-20,25,-22,14);ctx.closePath();ctx.fillStyle=fur;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      line(-18,-18,-12,-13,'#a87966',3);line(18,-18,12,-13,'#a87966',3);
      ellipse(0,7,15,10,paper);
      if(kind === 'cat') {
        round(-18,14,37,10,2,paper,ink);
        for(let i=0;i<6;i++)line(-12+i*5,15,-12+i*5,23,ink,1);
        for(const x of [-10,0,10])round(x,15,3,5,0,ink);
        line(-26,0,-17,2,ink,1);line(18,2,27,0,ink,1);
      } else {
        round(-14,13,28,12,3,green,ink);
        for(const x of [-8,0,8])round(x-2,17,4,4,1,'#e1cca0');
      }
    } else if(kind === 'rabbit') {
      ellipse(-10,-23,7,19,paper,ink);ellipse(10,-23,7,19,paper,ink);
      ellipse(-10,-27,3,10,'#d8b8ac');ellipse(10,-27,3,10,'#d8b8ac');
      ellipse(0,3,23,22,paper,ink);ellipse(23,19,6,6,paper,ink);
      round(-13,13,26,12,3,'#b9c8a6',ink);line(11,13,11,-1,ink,2);
      ellipse(-6,18,3,3,'#e1cca0');
    } else {
      for(const side of [-1,1])for(let i=0;i<3;i++) {
        const y=-12+i*11;line(side*18,y+3,side*(29+(i===1?4:0)),y-4,'#9c6968',3);
        ellipse(side*(29+(i===1?4:0)),y-4,4,5,'#c9918c',ink);
      }
      round(-22,-20,44,44,17,'#e4bdb0',ink);
      ctx.beginPath();ctx.moveTo(-20,17);ctx.bezierCurveTo(-5,32,16,9,28,22);ctx.strokeStyle=green;ctx.lineWidth=5;ctx.stroke();
      ellipse(-14,7,4,2,'#c9918c');ellipse(14,7,4,2,'#c9918c');
    }
    if(kind === 'cat') {
      line(-10+pose.face*2,-1,-5+pose.face*2,1,ink,2);line(5+pose.face*2,1,10+pose.face*2,-1,ink,2);
    } else {
      ellipse(-7+pose.face*2,0,1.7,2.5,ink);ellipse(7+pose.face*2,0,1.7,2.5,ink);
    }
    ctx.beginPath();ctx.arc(pose.face*2,3,3,0,Math.PI);ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function drawParty() {
    const width = canvas.width, compact = width < 650;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pulse = still ? 0 : partyTime * song.bpm/60 * Math.PI*2;
    ctx.fillStyle = '#e9edde'; ctx.fillRect(0,0,width,460);
    ellipse(width/2,355,width*.47,70,'#d2ddc3');
    for(let i=0;i<17;i++) {
      const x = ((i*137+37) % width), y = 110 + (i*53)%250;
      const drift = still ? 0 : Math.sin(partyTime*.8+i)*9;
      line(x-3,y+drift,x+3,y+drift,i%2?'#bd965e':'#879f78',2);
      line(x,y-3+drift,x,y+3+drift,i%2?'#bd965e':'#879f78',2);
    }
    // Speaker stacks frame a shared stage, with a steady pulse rather than flashes.
    for(const x of [18,width-66]) {
      round(x,compact?338:265,48,80,6,paper,ink);
      ellipse(x+24,compact?389:316,15+(still?0:Math.sin(pulse)*1.4),15,'#9caf88',ink);
      ellipse(x+24,compact?359:286,7,7,ink);
    }
    characters.forEach((friend,i) => {
      const x = compact ? (i<3 ? width*(.2+i*.3) : width*(.35+(i-3)*.3)) : width*(.18+i*.16);
      const base = compact ? (i<3?237:345) : 318;
      const hop = still ? 0 : Math.abs(Math.sin(pulse/2+i*.7))*14;
      const scale = compact ? 1.25 : 1.7;
      ellipse(x,base+scale*25,25,4,'#243e321c');
      character(friend,{x:x-22,y:base-hop-26,face:i%2?-1:1,grounded:false,vx:0},still?0:Math.sin(pulse/2+i)*.1,scale,still);
    });
    for(let i=0;i<8;i++) ellipse(width/2-49+i*14,430,3,3,(still ? 0 : Math.floor(partyTime*song.bpm/60*2)%8)===i?green:'#aab99e');
  }
  function draw() {
    if(phase === 'won' || (phase === 'paused' && pausedFrom === 'won')) { drawParty(); return; }
    const width = canvas.width;
    ctx.clearRect(0,0,width,460);ctx.fillStyle='#e9edde';ctx.fillRect(0,0,width,460);
    ellipse(width-110-camera*.06,78,30,30,'#e1cca0');
    for(let i=0;i<8;i++) {
      const x = i*430-camera*.25;
      ellipse(x,382,270,155,i%2?'#dbe2ce':'#dee5d2');
      line(x+90,182,x+90,337,'#c3cfb8',1);ellipse(x+78,208,13,5,'#c3cfb8');ellipse(x+102,225,13,5,'#c3cfb8');
    }
    ctx.save();ctx.translate(-camera,0);
    ctx.fillStyle='#d3ddc4';ctx.fillRect(0,floor,worldWidth,80);line(0,floor,worldWidth,floor,'#92a585',2);
    for(let i=0;i<65;i++){const x=i*43+10;line(x,413+(i%3)*13,x+6,413+(i%3)*13,'#b5c3a7',1);}
    for(const p of platforms){round(p.x,p.y,p.w,14,5,'#97ad87',ink);line(p.x+10,p.y+5,p.x+p.w-10,p.y+5,'#d9e2c9',1);}
    // Small botanical circuits and signposts belong to the scene, not image assets.
    for(const x of [125,720,1070,1640,1980,2260]) {
      line(x,floor,x,floor-32,green,2);ellipse(x-7,floor-23,8,4,'#879f78');ellipse(x+7,floor-15,8,4,'#879f78');
      ellipse(x,floor-35,5,5,'#d0af72',ink);
    }
    line(90,floor,90,floor-90,ink,3);round(51,floor-92,90,29,3,paper,ink);label('SOUND →',65,floor-73,11);
    round(2340,284,85,96,8,'#f4f2e9',ink);ellipse(2382,339,23,23,'#b9c8a6',ink);ellipse(2382,339,9,9,ink);round(2354,297,56,10,3,'#d4b47c',ink);
    label('HOME',2367,401,11);
    for(let i=0;i<notes.length;i++) {
      const n=notes[i];if(n.found)continue;
      const y=n.y+Math.sin(elapsed*2.5+i)*3;
      ellipse(n.x,y,17,17,'#f7edc9','#bba16b');
      ellipse(n.x-3,y+4,4,3,green);line(n.x+1,y+3,n.x+1,y-7,green,2);line(n.x+1,y-7,n.x+6,y-5,green,2);
    }
    ellipse(player.x+22,floor+3,23,4,'#243e321c');character();ctx.restore();
    // A quiet progress trail across the bottom of the landscape.
    for(let i=0;i<8;i++) ellipse(width/2-49+i*14,439,3,3,notes[i].found?green:'#aab99e');
  }
  function resize() {
    canvas.width = Math.round(canvas.clientWidth / canvas.clientHeight * 460);
    canvas.height = 460;
    camera = Math.max(0,Math.min(worldWidth-canvas.width,player.x-canvas.width*.35));
    draw();
  }
  function frame(time) {
    const dt = Math.min((time-last)/1000 || 0,.033);last=time;
    if(phase === 'playing') {elapsed+=dt;update(dt);music();}
    else if(phase === 'won') {
      elapsed+=dt;
      if(audio && !muted && audio.state === 'running') partyTime = Math.max(0,beat*60/song.bpm/2 + audio.currentTime-nextBeat);
      else partyTime+=dt;
      music();
    }
    draw();requestAnimationFrame(frame);
  }
  reset(false);resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
})();
