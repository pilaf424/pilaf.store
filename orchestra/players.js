/* The instruments belong to the characters; the conductor arranges their parts. */
window.OrchestraPlayers=[
 ['rabbit','Moon Rabbit','Theremin','lead','sine',.055],
 ['cat','Cat Nap Keyboard','Soft piano','keys','triangle',.085],
 ['lion','Little Lion Bass','Round bass','bass','sine',.13],
 ['robot','Pocket Sequencer Robot','Pocket drums','drums','triangle',.08],
 ['origami','Origami Mixer Bird','Paper harp','arp','triangle',.07],
 ['onigiri','Onigiri Listener','Warm bells','bell','sine',.065],
 ['fox','Fox Pocket Sampler','Plucked samples','pluck','triangle',.075],
 ['axolotl','Axolotl Ribbon Slide','Ribbon flute','lead','sine',.06],
 ['daruma','Daruma Pendulum','Woodblock rhythm','wood','sine',.08],
 ['mushroom','Mushroom Synth Garden','Velvet chords','pad','sine',.032],
 ['firefly','Circuit Firefly','Tiny celesta','bell','sine',.055],
 ['scope','Oscilloscope Smile','Wavy reeds','keys','triangle',.065],
 ['fuzz','Fuzz Pedal Critter','Fuzzy bass','bass','sawtooth',.07],
 ['trio','Transistor Trio','Tiny three-part choir','choir','sawtooth',.055],
 ['tanuki','Tanuki Tape Courier','Warm tape chords','keys','triangle',.055],
 ['crane','Crane Note Delivery','Bamboo marimba','arp','sine',.085],
 ['shrimp','Tempura Microphone','Little brass','lead','sawtooth',.045],
 ['vox','Mochi Vox','Synth soprano · ah / oo / ee','vocal','sawtooth',.12]
].map(([id,name,instrument,role,wave,level])=>({id,name,instrument,role,wave,level}));
