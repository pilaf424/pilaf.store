/* World coordinates and obstacle-aware walking, independent of rendering. */
(() => {
  const width=1440,height=1056,cell=24;
  const entities=[
    {id:'crane',name:'Crane Note Delivery',role:'The village postbird',x:780,y:635,kind:'crane'},
    {id:'rabbit',name:'Moon Rabbit',role:'Theremin by the pond',x:385,y:400,kind:'rabbit'},
    {id:'tanuki',name:'Tanuki Tape Courier',role:'A very careful collector. Usually.',x:1090,y:475,kind:'tanuki'},
    {id:'robot',name:'Pocket Sequencer Robot',role:'Small friend. Big rhythm.',x:850,y:815,kind:'robot'},
    {id:'sprout',name:'Capacitor Sprout',role:'A little garden resident',x:490,y:805,kind:'sprout'},
    {id:'tape',name:'A ribbon-wrapped tape',role:'Someone has misplaced a melody',x:1150,y:660,kind:'tape'},
    {id:'stage',name:'The Lantern Stage',role:'Room for a very small band',x:720,y:340,kind:'stage'},
    ...VillageResidents.entities
  ];
  const obstacles=[{type:'ellipse',x:235,y:290,rx:124,ry:92},
    {type:'rect',x:1010,y:240,w:200,h:130},
    {type:'rect',x:610,y:145,w:220,h:90},
    {type:'rect',x:922,y:755,w:130,h:54}];
  const trees=[{x:100,y:140,r:40},{x:470,y:190,r:42},{x:925,y:170,r:44},{x:1280,y:400,r:38},{x:1260,y:810,r:44},{x:260,y:850,r:38},{x:610,y:960,r:35},{x:100,y:550,r:36},{x:1320,y:155,r:36}];
  function blocked(x,y){
    if(x<36||y<70||x>width-36||y>height-40)return true;
    if(trees.some(t=>Math.hypot(x-t.x,y-t.y)<18))return true;
    // A path can run exactly along a rectangle's padded edge. Ignore tiny
    // floating-point drift so walking from an offset neighbor cannot snag it.
    const epsilon=1e-6;
    return obstacles.some(o=>o.type==='ellipse'?((x-o.x)/(o.rx+14))**2+((y-o.y)/(o.ry+14))**2<1:x>o.x-14+epsilon&&x<o.x+o.w+14-epsilon&&y>o.y-14+epsilon&&y<o.y+o.h+14-epsilon);
  }
  const cols=width/cell,rows=height/cell;
  const point=i=>({x:(i%cols)*cell+cell/2,y:Math.floor(i/cols)*cell+cell/2});
  function nearest(x,y){let best=-1,dist=Infinity;for(let i=0;i<cols*rows;i++){const p=point(i),d=(p.x-x)**2+(p.y-y)**2;if(d<dist&&!blocked(p.x,p.y)){dist=d;best=i;}}return best;}
  function path(from,to){
    const start=nearest(from.x,from.y),goal=nearest(to.x,to.y);
    if(start<0||goal<0)return [];
    const open=new Set([start]),came=new Map(),cost=new Map([[start,0]]);
    const h=i=>{const p=point(i),q=point(goal);return Math.abs(p.x-q.x)+Math.abs(p.y-q.y);};
    while(open.size){
      let current=-1,score=Infinity;
      for(const i of open){const f=cost.get(i)+h(i);if(f<score){score=f;current=i;}}
      if(current===goal){const route=[point(current)];while(came.has(current)){current=came.get(current);route.push(point(current));}route.reverse();if(route.length>1)route.shift();return route;}
      open.delete(current);const x=current%cols,y=Math.floor(current/cols);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
        const n=ny*cols+nx,p=point(n);if(blocked(p.x,p.y))continue;
        const g=cost.get(current)+cell;
        if(g<(cost.get(n)??Infinity)){came.set(n,current);cost.set(n,g);open.add(n);}
      }
    }
    return [];
  }
  window.VillageWorld={width,height,entities,obstacles,trees,blocked,path};
})();
