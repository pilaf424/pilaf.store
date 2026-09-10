/* One character design for portraits, village, Sound Walk and orchestra.
   Animation gently bends the actual vector contours around paws, ears, tails
   and instruments. The palette and silhouettes come from the approved art. */
(() => {
  'use strict';
  const art = window.PilafCharacterArt;
  const cache = new Map();
  // Fields: center x/y, radius x/y, sideways/upward travel, response.
  // Coordinates use the original artist's 100-unit canvas.
  const fields = {
    onigiri: [[18,52,12,25,-1.3,0,'sway'],[82,52,12,25,1.3,0,'sway'],[50,65,18,14,0,-1.1,'note']],
    rabbit: [[40,22,9,22,-1.6,0,'sway'],[53,23,8,20,1.2,0,'sway'],[58,57,14,13,1.4,-2.4,'note'],[44,73,15,9,0,-1.2,'reply']],
    cat: [[34,65,8,6,0,2.3,'note'],[52,66,8,6,0,2.3,'reply'],[76,46,23,23,1.0,-.6,'sway']],
    fox: [[84,52,15,29,2.6,0,'sway'],[24,63,10,12,0,2,'note'],[70,60,11,13,-1.2,1.6,'reply']],
    crane: [[42,53,22,15,0,-1.4,'note'],[81,53,7,13,1.7,0,'sway'],[63,26,12,17,1.0,-.4,'sway']],
    axolotl: [[22,35,15,23,-1.2,0,'sway'],[78,35,15,23,1.2,0,'sway'],[81,72,18,18,2,-1,'sway'],[54,68,13,5,3.8,0,'note']],
    tanuki: [[86,65,13,23,2.2,-.6,'sway'],[26,67,10,13,0,-1.9,'note'],[73,65,11,13,0,1.9,'reply'],[37,67,8,7,.5,-.8,'note']],
    daruma: [[49,70,11,14,2.4,0,'sway'],[50,51,34,34,0,-.6,'note']],
    mushroom: [[46,28,28,21,.6,-1.5,'note'],[78,40,18,16,-.9,-1.5,'reply'],[43,67,24,19,.9,0,'sway']],
    robot: [[16,40,13,22,-1.6,-3.2,'note'],[81,66,13,20,2.3,-2.2,'reply'],[54,13,13,13,1.5,0,'sway'],[50,67,24,17,0,.55,'note']],
    choir: [[25,40,16,30,-1,-.8,'sway'],[50,33,16,33,0,-1.4,'note'],[77,42,16,29,1,-.8,'sway'],[68,73,17,17,2.5,-3.8,'conduct'],[36,73,14,14,-2,-2,'reply']],
    shrimp: [[83,35,10,17,1.2,-2.2,'note'],[50,60,25,25,1.5,0,'sway'],[36,60,12,13,0,-1.2,'reply']],
    origami: [[48,27,12,24,2.4,-.8,'note'],[80,32,12,12,0,1,'sway'],[58,70,16,12,0,1.6,'reply']],
    lion: [[66,67,23,20,0,-1.3,'note'],[34,70,15,15,0,1.8,'reply'],[25,57,15,23,-1.3,0,'sway']],
    firefly: [[26,35,24,26,-2,0,'flutter'],[75,35,24,26,2,0,'flutter'],[50,61,11,15,0,1.4,'note']],
    scope: [[48,51,29,19,0,.7,'sway'],[78,48,9,25,0,-1.2,'note'],[32,76,25,12,1.5,0,'reply']],
    fuzz: [[50,72,13,12,0,1.5,'note'],[27,25,13,17,-.8,0,'sway'],[74,26,12,17,.8,0,'sway']],
    trio: [[25,45,16,28,-1.5,0,'sway'],[50,37,15,32,0,-1.3,'note'],[75,44,16,29,1.5,0,'sway']],
    sprout: [[34,28,20,18,-1.8,.3,'sway'],[66,24,21,18,1.8,.3,'sway'],[50,57,23,21,0,-.6,'note']],
    caterpillar: [[24,51,15,22,0,-1.2,'sway'],[50,47,15,22,0,1.2,'reply'],[78,43,18,24,0,-1.5,'note']],
  };

  function makePath(rings, deform) {
    const path = new Path2D();
    for (const ring of rings) {
      for (let i = 1; i < ring.length; i += 2) {
        const [x,y] = deform ? deform(ring[i],ring[i+1]) : [ring[i],ring[i+1]];
        if (i === 1) path.moveTo(x,y); else path.lineTo(x,y);
      }
      if (ring[0]) path.closePath();
    }
    return path;
  }

  function prepare(id) {
    if (cache.has(id)) return cache.get(id);
    const source = art[id];
    if (!source) return null;
    const joints = fields[id] || [];
    const paths = source.paths.map(p => {
      const weights = p.rings.map(ring => {
        const result = [];
        for (let i = 1; i < ring.length; i += 2) {
          const x=ring[i],y=ring[i+1];
          result.push(joints.map(([cx,cy,rx,ry]) => {
            const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
            return d < 1 ? (1-d)**2 : 0;
          }));
        }
        return result;
      });
      return {...p,weights,base:makePath(p.rings)};
    });
    const result={...source,paths,joints}; cache.set(id,result); return result;
  }

  function paint(ctx,p,path) {
    if(p.fill!=='none'){ctx.fillStyle=p.fill;ctx.fill(path,p.rule);}
    if(p.stroke!=='none'){ctx.strokeStyle=p.stroke;ctx.lineWidth=p.width;ctx.stroke(path);}
  }

  function draw(ctx,id,x,y,size,{time=0,bpm=100,hit=0,singing=0,vowel='ah',still=false,moving=false,face=1}={}) {
    const a=prepare(id);if(!a)return false;
    const [x0,y0,x1,y1]=a.bounds,scale=size/Math.max(x1-x0,y1-y0);
    const phase=id.length*.73,beat=time*bpm/60*Math.PI*2;
    const motion=still?null:a.joints.map((joint,i)=>{
      const type=joint[6];
      const value=type==='sway'?Math.sin(time*1.7+phase+i*.9):
        type==='flutter'?Math.sin(time*8+phase)*(.35+hit*.65):
        type==='conduct'?Math.sin(beat)*(.6+hit*.4):
        type==='reply'?hit*(.45+.55*Math.sin(beat+1.4))+.1*Math.sin(time*1.8+i):hit;
      return [joint[4]*value,joint[5]*value];
    });
    ctx.save();ctx.translate(x,y);
    if(moving&&!still){ctx.translate(0,-Math.abs(Math.sin(time*12))*1.6);ctx.rotate(Math.sin(time*12)*.018);}
    ctx.scale(scale*(face<0?-1:1),scale);ctx.translate(-(x0+x1)/2,-y1);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const p of a.paths){
      if(p.mouth&&!still&&singing>.08)continue;
      if(!motion){paint(ctx,p,p.base);continue;}
      const path=new Path2D();
      p.rings.forEach((ring,r)=>{
        for(let i=1,j=0;i<ring.length;i+=2,j++){
          let px=ring[i],py=ring[i+1];
          p.weights[r][j].forEach((w,k)=>{if(w){px+=w*motion[k][0];py+=w*motion[k][1];}});
          if(i===1)path.moveTo(px,py);else path.lineTo(px,py);
        }
        if(ring[0])path.closePath();
      });
      paint(ctx,p,path);
    }
    // The choir keeps its held vowel animation using the trio's actual heads.
    if(id==='trio'&&!still&&singing>.08){
      for(const [mx,my] of [[24,48.6],[50,33.6],[76,48.6]]){
        let px=mx,py=my;
        a.joints.forEach(([cx,cy,rx,ry],i)=>{
          const d=((mx-cx)/rx)**2+((my-cy)/ry)**2,w=d<1?(1-d)**2:0;
          px+=w*motion[i][0];py+=w*motion[i][1];
        });
        ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(px,py,vowel==='oo'?1.3:1.8,1+singing*1.8,0,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();return true;
  }
  window.PilafCharacters={draw,ids:Object.keys(art),art};
})();
