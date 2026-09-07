(() => {
  'use strict';
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ink = '#243e32', green = '#356449', paper = '#fffdf0';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = {width:1000,height:460};
  const districts = ['The listening garden','Moss & machinery','The little night stage'];
  let particles = [], pickupLabel, district = -1, hudCount = -1, jumpBuffer = 0, coyoteTime = 0;
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
    player = {x:65,y:floor-52,vx:0,vy:0,grounded:true,face:1,landing:0};
    particles = []; pickupLabel = null; jumpBuffer = 0; coyoteTime = .1; district = -1; hudCount = -1;
    count = 0; camera = 0; beat = 0; keys.clear(); touch.clear(); jumpRequested = false; jumpHeld = false;
    $('score').textContent = '00 / 08 notes';
    $('status').textContent = `${activeCharacter.name} is ready. Follow the notes!`;
    updateJourney();
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
    phase = 'paused'; keys.clear(); touch.clear(); jumpRequested = false; jumpHeld = false; jumpBuffer = 0;
    $('pause').textContent = 'Resume';
    showOverlay('Take your time', 'A little breather.', 'Your notes will be right here.', pausedFrom === 'won' ? 'Back to the party ↗' : 'Keep wandering ↗');
  }
  function jump() { if(!jumpHeld) jumpRequested = true; jumpHeld = true; }
  function releaseJump() { jumpHeld = false; if(player.vy < -280) player.vy = -280; }
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
  window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); if([' ','ArrowUp','w','W'].includes(e.key)) releaseJump(); });
  window.addEventListener('blur', () => { keys.clear(); touch.clear(); jumpHeld = false; if(phase === 'playing' || phase === 'won') pause(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && phase !== 'paused') pause(); });
  for(const button of document.querySelectorAll('[data-control]')) {
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if(phase !== 'playing') return;
      button.setPointerCapture(e.pointerId); touch.add(button.dataset.control);
      if(button.dataset.control === 'jump') jump();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => {touch.delete(button.dataset.control); if(button.dataset.control === 'jump') releaseJump();});
  }
  function burst(x,y,color,amount=12) {
    if(motionPreference.matches) return;
    for(let i=0;i<amount;i++) {
      const angle = Math.PI*2*i/amount, speed = 30+Math.random()*65;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-35,life:.45+Math.random()*.35,color,size:2+Math.random()*2});
    }
    if(particles.length>140) particles.splice(0,particles.length-140);
  }
  function updateJourney() {
    const nextDistrict = player.x < 800 ? 0 : player.x < 1710 ? 1 : 2;
    if(nextDistrict !== district) {district = nextDistrict; $('district').textContent = `0${district+1} / ${districts[district]}`;}
    $('journey').style.setProperty('--progress',`${Math.min(100,player.x/(worldWidth-130)*100)}%`);
    if(hudCount!==count) {
      $('goal-label').textContent = count === 8 ? 'Bring your song to the speaker →' : 'Find the eight notes';
      for(let i=0;i<8;i++) $('note-'+i).classList.toggle('found',notes[i].found);
      hudCount=count;
    }
  }
  function update(dt) {
    const left = keys.has('arrowleft') || keys.has('a') || touch.has('left');
    const right = keys.has('arrowright') || keys.has('d') || touch.has('right');
    const targetSpeed = ((right?1:0)-(left?1:0))*235;
    const acceleration = (targetSpeed ? 2800 : 3400)*dt;
    player.vx += Math.max(-acceleration,Math.min(acceleration,targetSpeed-player.vx));
    if(Math.abs(player.vx)>10) player.face = Math.sign(player.vx);
    coyoteTime = player.grounded ? .11 : Math.max(0,coyoteTime-dt);
    jumpBuffer = jumpRequested ? .14 : Math.max(0,jumpBuffer-dt);
    if(jumpBuffer>0 && coyoteTime>0) { player.vy = -555; player.grounded = false; coyoteTime = 0; jumpBuffer = 0; }
    jumpRequested = false;
    if(!jumpHeld && player.vy < -280) player.vy = -280;
    player.landing = Math.max(0,player.landing-dt);
    const wasGrounded = player.grounded;
    const oldBottom = player.y + 52;
    player.x = Math.max(18,Math.min(worldWidth-58,player.x+player.vx*dt));
    player.vy += 1450*dt; player.y += player.vy*dt; player.grounded = false;
    for(const p of [...platforms,{x:0,y:floor,w:worldWidth}]) {
      if(player.vy >= 0 && oldBottom <= p.y+1 && player.y+52 >= p.y && player.x+38 > p.x && player.x+6 < p.x+p.w) {
        if(!wasGrounded && player.vy>180) {player.landing = .18; burst(player.x+22,p.y,'#a8b594',5);}
        player.y = p.y-52; player.vy = 0; player.grounded = true; break;
      }
    }
    for(let i=0;i<notes.length;i++) {
      const n = notes[i];
      if(!n.found && Math.abs(player.x+22-n.x)<34 && Math.abs(player.y+25-n.y)<43) {
        n.found = true; n.foundAt = elapsed; count++; $('score').textContent = `${String(count).padStart(2,'0')} / 08 notes`;
        burst(n.x,n.y,'#ba9459',18); pickupLabel = {x:n.x,y:n.y-26,text:count===8?'A song, found.':`+ ${count} / 8`,life:1};
        $('status').textContent = count === 8 ? 'All together now. Find the speaker at the end →' : `${count} ${count === 1 ? 'note' : 'notes'} found. The garden is waking up.`;
        if(audio) tone(pitches[i]*2,audio.currentTime,.3,.4);
      }
    }
    if(player.x+44>2340 && player.x<2425 && player.y+52>=284) {
      if(count === 8) {
        phase = 'won'; resetTransport(); keys.clear(); touch.clear();
        $('status').textContent = `Your finished song: ${song.style.name}. All five friends are playing along!`;
        $('overlay').hidden = true; $('party-caption').hidden = false; $('replay').hidden = false;
        $('restart').textContent = 'New song ↺';
        document.querySelector('.touch-controls').hidden = true;
        $('district').textContent = 'The garden sessions / now playing'; $('goal-label').textContent = 'Your melody. The whole band.';
        $('journey').style.setProperty('--progress','100%');
      } else $('status').textContent = `${8-count} ${8-count===1?'note is':'notes are'} still out there. Head back left to find them.`;
    }
    if(phase === 'playing') updateJourney();
    for(const p of particles) {p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;}
    particles = particles.filter(p=>p.life>0);
    if(pickupLabel) {pickupLabel.life-=dt;pickupLabel.y-=22*dt;if(pickupLabel.life<=0)pickupLabel=null;}
    const view = scene.width;
    camera += (Math.max(0,Math.min(worldWidth-view,player.x-view*(player.face>0?.38:.58)))-camera)*Math.min(1,dt*6);
  }
  function line(x1,y1,x2,y2,color=ink,width=2) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function ellipse(x,y,rx,ry,fill,stroke) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function round(x,y,w,h,r,fill,stroke) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function label(text,x,y,size=10,color=ink) {ctx.fillStyle=color;ctx.font=`${size}px ui-monospace, monospace`;ctx.fillText(text,x,y);}
  function drawBunting(width) {
    ctx.beginPath();ctx.moveTo(0,9);ctx.quadraticCurveTo(width/2,53,width,9);ctx.strokeStyle='#6e876a';ctx.lineWidth=1.4;ctx.stroke();
    const bulbs = Math.max(7,Math.floor(width/80));
    for(let i=0;i<=bulbs;i++) {
      const x=width*i/bulbs,y=9+88*(i/bulbs)*(1-i/bulbs);
      line(x,y,x,y+8,'#6e876a',1);
      ellipse(x,y+12,7,9,'#efdb9b30');ellipse(x,y+12,3.5,4.5,i%3?'#e3c577':'#adbc92','#8e986a');
    }
  }
  function plant(x,y,size=1,shade='#718b63',time=elapsed) {
    const sway=motionPreference.matches?0:Math.sin(time*.9+x*.017)*3;
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-3,-18,sway,-40);ctx.strokeStyle=shade;ctx.lineWidth=1.6;ctx.stroke();
    for(let i=0;i<3;i++) {const direction=i%2?1:-1;ctx.save();ctx.translate(sway*i/3,-12-i*10);ctx.rotate(direction*.45);ellipse(direction*7,0,9,3.4,shade);ctx.restore();}
    ctx.restore();
  }
  function drawLandscape(width) {
    const dusk = song.style.name === 'Moonlit tapes' || song.style.name === 'Moss & starlight';
    const sky=ctx.createLinearGradient(0,0,0,380);
    sky.addColorStop(0,dusk?'#e1e6df':'#eeeada');sky.addColorStop(1,'#f6f1df');
    ctx.fillStyle=sky;ctx.fillRect(0,0,width,460);
    const sunX=width*.77-camera*.045;
    ellipse(sunX,85,58,58,dusk?'#f5efd838':'#f4df9d25');ellipse(sunX,85,36,36,dusk?'#f8f1d7':'#e4c58b');
    if(dusk)ellipse(sunX+14,73,30,30,'#e3e7df');
    for(let i=0;i<7;i++) {
      const x=i*430-camera*.12;
      ellipse(x+70,124+(i%3)*16,72,8,'#fffcef55');ellipse(x+110,120+(i%3)*16,37,9,'#fffcef55');
    }
    for(let layer=0;layer<3;layer++) {
      const depth=[.14,.29,.48][layer],base=[282,327,367][layer],height=[98,88,74][layer];
      ctx.beginPath();ctx.moveTo(-400,460);
      for(let x=-400;x<width+401;x+=12) {
        const worldX=x+camera*depth;
        ctx.lineTo(x,base-Math.sin(worldX*.004+layer*2)*height*.46-Math.sin(worldX*.008+layer)*height*.22);
      }
      ctx.lineTo(width+401,460);ctx.closePath();ctx.fillStyle=['#d3dbca','#becdb2','#aebf9c'][layer];ctx.fill();
    }
    for(let i=0;i<16;i++) {
      const x=i*210-camera*.48, y=313+(i%3)*13;
      plant(x,y,1.8+(i%3)*.5,'#a1b694',0);
      if(i%3===0){line(x+38,y+15,x+38,y-62,'#a0b390',2);round(x+23,y-63,30,44,12,'#c4d0af');}
    }
    // Distant studio windows and aerials sit behind the playable garden.
    for(const x of [590,1370,2170]) {
      const screen=x-camera*.66;
      round(screen,257,92,106,4,'#c2cbae');round(screen+10,271,72,40,2,'#dfe3c6');
      for(let i=1;i<4;i++)line(screen+10+i*18,272,screen+10+i*18,310,'#b6c1a1',1);
      line(screen+46,257,screen+46,220,'#a9b797',2);line(screen+30,228,screen+62,228,'#a9b797',1);
    }
  }
  function drawPlatform(p,index) {
    ellipse(p.x+p.w/2,floor+4,p.w*.4,5,'#60785312');
    // Slender stems make the platforms feel like little garden instruments.
    for(const x of [p.x+22,p.x+p.w-22]) {
      line(x,p.y+12,x,floor,'#9dae8b',3);
      line(x+4,p.y+15,x+4,floor,'#cbd5b8',1);
      plant(x,floor,.65,'#839969');
    }
    round(p.x+1,p.y+8,p.w-2,14,5,'#819a6e','#637d57');
    round(p.x,p.y,p.w,13,5,'#c2d0a9',ink);
    line(p.x+10,p.y+3,p.x+p.w-10,p.y+3,'#edf0d3',2);
    for(const x of [p.x+9,p.x+p.w-9])ellipse(x,p.y+7,1.6,1.6,'#6e855f');
    if(index%2===0)for(let i=0;i<4;i++)round(p.x+p.w/2-18+i*10,p.y+4,5,5,1,'#9aad85');
    else for(let i=0;i<5;i++)line(p.x+p.w/2-16+i*8,p.y+3,p.x+p.w/2-16+i*8,p.y+10,'#91a47c',1);
  }
  function drawWorldDetails() {
    // A glasshouse gives the middle of the walk its own silhouette.
    if(camera<1460 && camera+scene.width>1000) {
      ctx.beginPath();ctx.moveTo(1030,floor);ctx.lineTo(1030,263);ctx.quadraticCurveTo(1150,125,1270,263);ctx.lineTo(1270,floor);ctx.closePath();
      ctx.fillStyle='#e9edd448';ctx.fill();ctx.strokeStyle='#99ac88';ctx.lineWidth=2;ctx.stroke();
      for(const x of [1070,1110,1150,1190,1230])line(x,223+Math.abs(1150-x)*.45,x,floor,'#a6b793',1);
      line(1030,278,1270,278,'#a6b793',1);line(1030,332,1270,332,'#a6b793',1);
      for(const x of [1058,1134,1210]){round(x,357,27,23,3,'#b9b992');plant(x+14,357,1.4,'#8caa79');}
      round(1093,267,117,21,3,'#e0e4caaa');label('THE PATCH HOUSE',1105,281,9,'#8b9f77');
    }
    if(camera+scene.width>2220) {
      line(2255,floor,2255,207,'#8fa17c',3);line(2490,floor,2490,207,'#8fa17c',3);
      ctx.beginPath();ctx.moveTo(2246,210);ctx.quadraticCurveTo(2372,171,2499,210);ctx.lineTo(2499,219);ctx.quadraticCurveTo(2372,188,2246,219);ctx.closePath();ctx.fillStyle='#d4c79c';ctx.fill();ctx.strokeStyle='#9da67c';ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.moveTo(2255,213);ctx.quadraticCurveTo(2372,245,2490,213);ctx.strokeStyle='#8d9f76';ctx.stroke();
      for(let i=0;i<7;i++){const x=2255+i*39,y=214+Math.sin(i/6*Math.PI)*14;ellipse(x,y+5,3.5,5,count===8?'#e9c878':'#ccd2b2','#94a27a');}
    }
    for(let i=0;i<46;i++) {
      const x=i*57+23;
      if(x<camera-80 || x>camera+scene.width+80) continue;
      plant(x,floor,(i%4)*.16+.35,i%3?'#819869':'#66865e');
      if(i%6===0){round(x+13,floor-16,5,16,2,'#e5dec1');ellipse(x+15,floor-17,12,6,'#c3a779','#8d8d61');ellipse(x+11,floor-19,2,1.5,'#eee5c4');}
    }
    for(const x of [740,1420,1980]) {
      round(x,floor-53,62,50,7,'#d9dbbc','#879775');
      round(x+8,floor-43,28,23,3,'#99ae86','#879775');
      for(let i=0;i<4;i++)line(x+12+i*6,floor-37,x+12+i*6,floor-24,'#ced8b9',1);
      ellipse(x+47,floor-31,6,6,'#bda16c','#879775');ellipse(x+47,floor-13,2,2,'#748e62');
      ctx.beginPath();ctx.moveTo(x+62,floor-12);ctx.bezierCurveTo(x+95,floor-10,x+51,floor+10,x+103,floor+4);ctx.strokeStyle='#92a47b';ctx.lineWidth=2;ctx.stroke();
    }
    for(const x of [52,1110,2210]) {
      line(x,floor,x,floor-124,'#69845d',3);ctx.beginPath();ctx.moveTo(x,floor-124);ctx.quadraticCurveTo(x+18,floor-139,x+33,floor-119);ctx.strokeStyle='#69845d';ctx.lineWidth=2;ctx.stroke();
      ellipse(x+32,floor-101,19,25,'#f3dd9520');round(x+23,floor-119,18,30,6,'#e5ce8e','#8c9869');line(x+24,floor-106,x+40,floor-106,'#c8b275',1);
    }
  }
  function drawSpeaker() {
    const awake = count===8;
    ellipse(2382,383,78,11,'#78916b25');
    round(2314,376,136,12,5,'#b2bf98','#7b9269');
    round(2339,285,88,92,8,'#c4ad80',ink);round(2345,289,76,84,5,paper,ink);
    ellipse(2383,339,23,23,'#8fa47c',ink);ellipse(2383,339,15,15,'#c4d0ac','#69825d');ellipse(2383,339,7,7,ink);
    round(2358,299,48,10,3,awake?'#e6c982':'#cbd3b6',ink);
    for(let i=0;i<5;i++)line(2365+i*8,302,2365+i*8,306,awake?'#819560':'#a5b392',1);
    if(awake) {
      const pulse=motionPreference.matches?0:Math.sin(elapsed*3)*3;
      for(const side of [-1,1]) {ctx.beginPath();ctx.ellipse(2383+side*45,339,12+pulse,21,0,side<0?Math.PI/2:-Math.PI/2,side<0?Math.PI*1.5:Math.PI/2);ctx.strokeStyle='#9eac7e';ctx.lineWidth=1.5;ctx.stroke();}
    }
    round(2325,238,115,27,5,'#f5f1dfdd','#b3be9b');label(awake?'YOUR SONG →':'THE LITTLE STAGE',2335,255,10,'#58724d');
  }
  function character(info = activeCharacter, pose = player, sway = 0, scale = 1, still = false) {
    still = still || motionPreference.matches;
    const squash = still ? 0 : Math.sin((pose.landing||0)/.18*Math.PI)*.14;
    const stretch = !still && !pose.grounded && Math.abs(pose.vy||0)>200 ? .045 : 0;
    ctx.save();ctx.translate(pose.x+22,pose.y+26+squash*22);ctx.rotate(sway);ctx.scale(scale*(1+squash-stretch),scale*(1-squash+stretch));
    const bob = !still && pose.grounded && Math.abs(pose.vx)>10 ? Math.sin(elapsed*18)*1.5 : 0;
    ctx.translate(0,bob);
    const stride = !still && pose.grounded && Math.abs(pose.vx)>10 ? Math.sin(elapsed*18)*2 : 0;
    ellipse(-10-stride,25,7,3,ink);ellipse(11+stride,25,7,3,ink);
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
    if(kind === 'cat' || (!still && elapsed%5.7>5.52)) {
      line(-10+pose.face*2,-1,-5+pose.face*2,1,ink,2);line(5+pose.face*2,1,10+pose.face*2,-1,ink,2);
    } else {
      ellipse(-7+pose.face*2,0,1.7,2.5,ink);ellipse(7+pose.face*2,0,1.7,2.5,ink);
    }
    ctx.beginPath();ctx.arc(pose.face*2,3,3,0,Math.PI);ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function drawParty() {
    const width = scene.width, compact = width < 650;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pulse = still ? 0 : partyTime * song.bpm/60 * Math.PI*2;
    ctx.fillStyle = '#e9edde'; ctx.fillRect(0,0,width,460);
    drawBunting(width);
    const spotlight = ctx.createLinearGradient(0,150,0,405);
    spotlight.addColorStop(0,'#f9f1ce00');spotlight.addColorStop(1,'#f9f1ce55');
    ctx.fillStyle=spotlight;ctx.beginPath();ctx.moveTo(width*.4,110);ctx.lineTo(width*.9,405);ctx.lineTo(width*.1,405);ctx.closePath();ctx.fill();
    ellipse(width/2,355,width*.47,70,'#d2ddc3');
    ellipse(width/2,363,width*.46,55,'#b6c5a9');ellipse(width/2,353,width*.46,55,'#dce3ca','#a9ba99');
    for(let i=0;i<7;i++) {const y=326+i*9;line(width*.12,y,width*.88,y,'#bdcbae55',1);}
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
    const width = scene.width;
    drawLandscape(width);
    ctx.save();ctx.translate(-camera,0);
    const ground=ctx.createLinearGradient(0,floor,0,460);ground.addColorStop(0,'#d2d9b8');ground.addColorStop(1,'#e2dfc4');
    ctx.fillStyle=ground;ctx.fillRect(0,floor,worldWidth,80);line(0,floor,worldWidth,floor,'#82996c',2);
    ctx.beginPath();ctx.moveTo(0,413);for(let x=0;x<worldWidth;x+=40)ctx.lineTo(x,413+Math.sin(x*.008)*5);ctx.strokeStyle='#e9e4c9';ctx.lineWidth=17;ctx.stroke();
    for(let i=0;i<100;i++){const x=i*29+10;line(x,405+(i%4)*13,x+3+(i%3),405+(i%4)*13,'#a9b18b60',1);}
    drawWorldDetails();
    platforms.forEach((p,i)=>{if(p.x+p.w>camera-30 && p.x<camera+width+30)drawPlatform(p,i);});
    line(126,floor,126,floor-74,'#7b9166',2);round(86,floor-76,85,25,4,paper,'#7b9166');label('LISTEN →',101,floor-60,10,'#58724d');
    drawSpeaker();
    for(let i=0;i<notes.length;i++) {
      const n=notes[i];if(n.x<camera-50 || n.x>camera+width+50)continue;
      if(n.found) {
        const age=elapsed-n.foundAt;
        if(age<.6 && !motionPreference.matches){ctx.save();ctx.globalAlpha=(1-age/.6)*.55;ellipse(n.x,n.y,18+age*42,18+age*42,null,'#bb9d5e');ctx.restore();}
        continue;
      }
      const y=n.y+(motionPreference.matches?0:Math.sin(elapsed*2.5+i)*3);
      const glow=ctx.createRadialGradient(n.x,y,6,n.x,y,32);glow.addColorStop(0,'#f9e8aa88');glow.addColorStop(1,'#f9e8aa00');
      ellipse(n.x,y,32,32,glow);ellipse(n.x,y+3,17,17,'#bca67440');ellipse(n.x,y,17,17,'#f7edc9','#b39b61');ellipse(n.x,y,13,13,null,'#e1cf93');
      ellipse(n.x-3,y+4,4,3,green);line(n.x+1,y+3,n.x+1,y-7,green,2);line(n.x+1,y-7,n.x+6,y-5,green,2);
      label(String(i+1).padStart(2,'0'),n.x-6,y+30,8,'#687e52');
    }
    const groundBelow=platforms.filter(p=>player.x+38>p.x&&player.x+6<p.x+p.w&&p.y>=player.y+50).reduce((y,p)=>Math.min(y,p.y),floor);
    const shadowSize=Math.max(10,23-(groundBelow-player.y-52)*.04);
    ellipse(player.x+22,groundBelow+2,shadowSize,3,'#243e3224');character();
    if(!motionPreference.matches)for(const p of particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ellipse(p.x,p.y,p.size,p.size,p.color);ctx.restore();}
    if(pickupLabel){ctx.save();ctx.globalAlpha=Math.min(1,pickupLabel.life*3);round(pickupLabel.x-49,pickupLabel.y-15,98,23,11,'#fffdf0ee');ctx.textAlign='center';label(pickupLabel.text,pickupLabel.x,pickupLabel.y,11,green);ctx.restore();}
    ctx.restore();
    // Foreground leaves pass at a different speed to give the walk depth.
    for(let i=0;i<24;i++) {
      const x=i*190-camera*1.08;
      if(x>-60&&x<width+60){plant(x,468,1.05+(i%3)*.24,'#819667');plant(x+19,477,.95,'#a3b28a');}
    }
    if(phase==='playing' && count===0 && player.x<180){round(18,18,194,30,15,'#fffdf0c9');label('Hold jump for a higher hop',32,37,10,'#536d48');}
  }
  function resize() {
    scene.width = canvas.clientWidth/canvas.clientHeight*460;
    const density = Math.min(window.devicePixelRatio||1,2);
    canvas.width = Math.round(canvas.clientWidth*density); canvas.height = Math.round(canvas.clientHeight*density);
    ctx.setTransform(canvas.width/scene.width,0,0,canvas.height/460,0,0);
    camera = Math.max(0,Math.min(worldWidth-scene.width,player.x-scene.width*.38));
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
