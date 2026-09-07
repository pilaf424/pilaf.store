(() => {
  'use strict';
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ink = '#243e32', green = '#356449', paper = '#fffdf0';
  const worldWidth = 2540, floor = 380;
  const platforms = [{x:290,y:300,w:135},{x:540,y:238,w:135},{x:835,y:296,w:155},{x:1170,y:265,w:140},{x:1470,y:300,w:150},{x:1765,y:245,w:145},{x:2050,y:298,w:145}];
  const positions = [[200,337],[355,261],[607,199],[910,257],[1240,226],[1545,261],[1840,206],[2125,259]];
  const pitches = [261.63,293.66,329.63,392,440,392,329.63,293.66];
  const characters = [
    {id:'onigiri',name:'Onigiri Listener'},
    {id:'cat',name:'Cat Nap Keyboard'},
    {id:'fox',name:'Fox Pocket Sampler'},
    {id:'rabbit',name:'Moon Rabbit Theremin'},
    {id:'axolotl',name:'Axolotl Ribbon Slide'}
  ];
  let activeCharacter = characters[0];
  let notes, player, camera = 0, phase = 'ready', count = 0, last = 0, elapsed = 0;
  let audio, master, muted = true, beat = 0, nextBeat = 0, jumpRequested = false, jumpHeld = false;
  let outputVolume = Number($('volume').value) / 100;
  const keys = new Set(), touch = new Set();
  function reset(changeCharacter = true) {
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
      if (!audio) { audio = new (window.AudioContext || window.webkitAudioContext)(); master = audio.createGain(); master.gain.value = 0; master.connect(audio.destination); }
      await audio.resume(); nextBeat = audio.currentTime + .08;
      setOutput();
      if(chime && phase !== 'paused') [261.63,329.63,392].forEach((pitch, i) => tone(pitch, audio.currentTime + .03 + i * .13, .25, .3, 'triangle'));
    } catch { muted = true; audioLabel(); setOutput(); $('status').textContent = 'Sound could not start. Tap Sound off to try again.'; }
  }
  function tone(freq, when, length = .2, volume = .3, type = 'sine') {
    if (!audio || muted || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(volume, when + .012);
    gain.gain.linearRampToValueAtTime(volume * .65, when + length * .6);
    gain.gain.exponentialRampToValueAtTime(.001, when + length);
    oscillator.connect(gain); gain.connect(master); oscillator.start(when); oscillator.stop(when + length + .025);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function music() {
    if (!audio || muted || audio.state !== 'running' || !count) return;
    if (nextBeat < audio.currentTime - .1) nextBeat = audio.currentTime;
    while(nextBeat < audio.currentTime + .1) {
      const slot = beat % 8;
      if(notes[slot].found) tone(pitches[slot], nextBeat, .28, .32, 'triangle');
      if(slot % 2 === 0) tone(130.81, nextBeat, .13, .18, 'triangle');
      nextBeat += .27; beat++;
    }
  }
  function showOverlay(kicker, title, copy, button) {
    $('overlay-kicker').textContent = kicker; $('overlay-title').textContent = title;
    $('overlay-copy').textContent = copy; $('start').textContent = button; $('overlay').hidden = false;
  }
  function begin() {
    const starting = phase === 'ready' || phase === 'won';
    if(phase === 'ready') { muted = false; audioLabel(); }
    if(phase === 'won') reset();
    phase = 'playing'; $('overlay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pause';
    if(!muted) enableAudio(starting); canvas.focus({preventScroll:true});
  }
  function pause() {
    if(phase === 'paused') return begin();
    if(phase !== 'playing') return;
    phase = 'paused'; keys.clear(); touch.clear(); jumpRequested = false; jumpHeld = false;
    $('pause').textContent = 'Resume';
    showOverlay('Take your time', 'A little breather.', 'Your notes will be right here.', 'Keep wandering ↗');
  }
  function jump() { if(!jumpHeld) jumpRequested = true; jumpHeld = true; }
  $('start').addEventListener('click', begin);
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', () => {reset(); begin();});
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
  window.addEventListener('blur', () => { keys.clear(); touch.clear(); jumpHeld = false; if(phase === 'playing') pause(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && phase === 'playing') pause(); });
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
        phase = 'won'; $('pause').disabled = true;
        $('status').textContent = 'You brought the garden back to life. Stay and listen.';
        showOverlay('08 / 08 · A song found', 'A little more in harmony.', 'You found every note. This little loop is yours to enjoy.', 'Take another walk ↺');
        $('start').focus({preventScroll:true});
      } else $('status').textContent = `${8-count} ${8-count===1?'note is':'notes are'} still out there. Head back left to find them.`;
    }
    const view = canvas.width;
    camera += (Math.max(0,Math.min(worldWidth-view,player.x-view*.35))-camera)*Math.min(1,dt*8);
  }
  function line(x1,y1,x2,y2,color=ink,width=2) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function ellipse(x,y,rx,ry,fill,stroke) {ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function round(x,y,w,h,r,fill,stroke) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function label(text,x,y,size=10,color=ink) {ctx.fillStyle=color;ctx.font=`${size}px ui-monospace, monospace`;ctx.fillText(text,x,y);}
  function character() {
    ctx.save();ctx.translate(player.x+22,player.y+26);
    const bob = player.grounded && player.vx ? Math.sin(elapsed*18)*2 : 0;
    ctx.translate(0,bob);
    ellipse(-10,25,7,3,ink);ellipse(11,25,7,3,ink);
    const kind = activeCharacter.id;
    if(kind === 'onigiri') {
      ctx.beginPath();ctx.moveTo(-22,16);ctx.quadraticCurveTo(-30,12,-19,-5);ctx.lineTo(-7,-24);ctx.quadraticCurveTo(0,-34,8,-23);ctx.lineTo(25,9);ctx.quadraticCurveTo(31,22,15,23);ctx.lineTo(-14,23);ctx.closePath();ctx.fillStyle=paper;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2.4;ctx.stroke();
      round(-9,9,18,15,3,green);
      ctx.beginPath();ctx.ellipse(0,-2,27,24,0,Math.PI,Math.PI*2);ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();
      round(-30,-5,9,19,4,'#d2af76',ink);round(22,-5,9,19,4,'#d2af76',ink);
    } else if(kind === 'cat' || kind === 'fox') {
      const fur = kind === 'fox' ? '#c89565' : '#c6c4ac';
      ctx.save();ctx.translate(-20,13);ctx.rotate(-.5 + Math.sin(elapsed*4)*.1);ellipse(-8,0,17,8,fur,ink);ellipse(-18,0,6,6,paper);ctx.restore();
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
      line(-10+player.face*2,-1,-5+player.face*2,1,ink,2);line(5+player.face*2,1,10+player.face*2,-1,ink,2);
    } else {
      ellipse(-7+player.face*2,0,1.7,2.5,ink);ellipse(7+player.face*2,0,1.7,2.5,ink);
    }
    ctx.beginPath();ctx.arc(player.face*2,3,3,0,Math.PI);ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function draw() {
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
    else if(phase === 'won') music();
    draw();requestAnimationFrame(frame);
  }
  reset(false);resize();window.addEventListener('resize',resize);requestAnimationFrame(frame);
})();
