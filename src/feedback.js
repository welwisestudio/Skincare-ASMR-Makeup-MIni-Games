// Material feedback uses the generated sprites, independently of completion logic.
export class CareFeedback {
  constructor(scene){this.s=scene;this.last=-1000;this.touched=-1000;this.open=1;this.counts={};this.water=[];}
  reset(){this.last=-1000;this.touched=-1000;this.open=1;this.water=[];}
  start(){
    this.last=-1000;
    this.water.forEach(p=>p.active&&p.destroy());this.water=[];
    if(this.s.step.layer==='water')for(const t of this.s.targets){
      const p=this.image('water-puddle',t.x,t.y,43,28,.7);this.water.push(p);
    }
  }
  image(key,x,y,w,h,alpha=1){
    const p=this.s.add.image(x,y,`ui-${key}`).setDisplaySize(w,h).setAlpha(alpha);
    this.s.fx.add(p);return p;
  }
  animate(p,props){this.s.tweens.add({targets:p,...props,onComplete:()=>p.active&&p.destroy()});}
  pulse(x,y,size=50,tint=0xffffff){
    const p=this.image('water-puddle',x,y,size,size*.6,.36).setTint(tint);
    this.animate(p,{scaleX:p.scaleX*1.7,scaleY:p.scaleY*1.5,alpha:0,duration:600,ease:'Sine.Out'});
  }
  touch(x,y){
    const s=this.s;this.touched=s.time.now;
    const tool=s.step.tool,interval=tool==='dropper'?390:tool==='spray'?105:tool==='roller'?180:140;
    if(s.time.now-this.last<interval||s.fx.length>95)return;
    this.last=s.time.now;this.counts[tool]=(this.counts[tool]||0)+1;
    if(tool==='dropper'){
      const tint=s.app.save.equipped==='serum'?0xffd777:0xffffff;
      const drop=this.image('serum-drop',x,y-54,16,25,.95).setTint(tint),run=s.runId,step=s.stepIndex;
      s.tweens.add({targets:drop,y:y-2,scaleY:drop.scaleY*1.2,duration:210,ease:'Quad.In',onComplete:()=>{
        drop.destroy();if(run!==s.runId||step!==s.stepIndex)return;
        this.counts.splashes=(this.counts.splashes||0)+1;
        const puddle=this.image('water-puddle',x,y,22,14,.92).setTint(tint),sx=puddle.scaleX,sy=puddle.scaleY;
        s.tweens.add({targets:puddle,scaleX:sx*2.3,scaleY:sy*2,duration:190,ease:'Back.Out',onComplete:()=>{
          this.animate(puddle,{scaleX:sx*2.8,scaleY:sy*2.4,alpha:0,duration:660,ease:'Sine.In'});
        }});
        for(const side of [-1,1]){const bead=this.image('serum-drop',x,y,5,7,.8).setTint(tint);this.animate(bead,{x:x+side*17,y:y-12,alpha:0,duration:260,ease:'Quad.Out'});}
        s.careEffect(x,y,'glint');
      }});
    }else if(tool==='spray'){
      const nozzleOffset=Math.min(66,(s.scale.width-s.root.x)/s.fit-65-x)*.73;
      const mist=this.image('mist-cloud',x+nozzleOffset,y+6,50,33,.65).setAngle(8);
      this.animate(mist,{x:x-7,y:y-3,scaleX:mist.scaleX*1.8,scaleY:mist.scaleY*1.5,alpha:0,duration:420,ease:'Quad.Out'});
      if(s.step.layer!=='foam')this.pulse(x,y,32);
      else{const foam=this.image('foam-puff',x,y,24,22,.45);this.animate(foam,{y:y+12,scaleX:foam.scaleX*.2,scaleY:foam.scaleY*.2,alpha:0,duration:300});}
    }else if(tool==='cleanser'){
      const foam=this.image('foam-puff',x+(Math.random()-.5)*18,y,36,30,.8),sx=foam.scaleX,sy=foam.scaleY;
      foam.setScale(sx*.3,sy*.3);s.tweens.add({targets:foam,scaleX:sx,scaleY:sy,duration:180,ease:'Back.Out',onComplete:()=>this.animate(foam,{y:y-10,alpha:0,duration:430})});
      s.careEffect(x,y,'bubble');
    }else if(tool==='towel'){
      for(const p of this.water)if(p.active&&Math.hypot(p.x-x,p.y-y)<38){
        s.tweens.killTweensOf(p);this.animate(p,{scaleX:p.scaleX*.4,scaleY:p.scaleY*.35,alpha:0,duration:300});
      }
      const puff=this.image('mist-cloud',x,y,40,26,.35);this.animate(puff,{y:y-22,alpha:0,duration:400});
    }else if(tool==='mask-brush'){
      const cream=this.image('powder-stroke',x,y,52,24,.42).setTint(0xffa3d4).setAngle(-18);
      this.animate(cream,{scaleX:cream.scaleX*1.18,alpha:0,duration:480});
    }else if(tool==='makeup-brush'||tool==='compact'){
      const powder=this.image('powder-stroke',x,y,42,22,.55).setTint(tool==='compact'?0xe7b7ff:0xffb6cd);
      this.animate(powder,{y:y-8,scaleX:powder.scaleX*1.35,alpha:0,duration:580});s.careEffect(x,y,'glint');
    }else if(tool==='lipstick'){
      const shine=this.image('glint',x,y,18,13,.9);
      this.animate(shine,{x:x+12,scaleX:shine.scaleX*.4,scaleY:shine.scaleY*.4,alpha:0,duration:450});
    }else if(tool==='roller'){
      this.pulse(x,y,46,0xd4ffe7);
      const shine=this.image('glint',x-9,y-8,13,13,.75);this.animate(shine,{y:y-18,alpha:0,duration:450});
    }else{
      this.pulse(x,y,45,tool==='sponge'?0xffe9d9:0xffffff);
      s.careEffect(x,y,tool==='sponge'&&s.step.layer==='flowers'?'petal':'glint');
    }
  }
  update(dt){
    const s=this.s,contact=s.down&&(s.drag||s.valid(s.local.x,s.local.y));
    const working=s.active&&(contact||s.time.now-this.touched<480),blink=!working&&s.time.now%4700<130;
    const goal=working||blink?0:1;
    this.open+=(goal-this.open)*(1-Math.exp(-dt/(goal?.095:.045)));
    s.eyes?.forEach(eye=>{
      const h=eye.frame.realHeight,w=eye.frame.realWidth,visible=Math.max(.001,this.open);
      eye.setCrop(0,h*(1-visible)*.56,w,h*visible).setAlpha(Math.min(1,visible*2));
    });
  }
}
