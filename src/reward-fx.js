// Reward presentation is independent of the saved economy and survives UI rebuilds.
export function installRewardFX(UI) {
  Object.assign(UI.prototype, {
    walletValue() { return this.app.displayCoins ?? this.app.save.coins; },
    syncWallet() {
      const a=this.app, delta=a.save.coins-a.observedCoins;
      a.observedCoins=a.save.coins;
      if(delta>0){a.coinQueue+=delta;(a.coinBatches??=[]).push({count:delta,origin:a.nextCoinOrigin||null});}a.nextCoinOrigin=null;
      if(delta<0){a.coinQueue=0;a.coinBatches=[];a.displayCoins=a.save.coins;this.coinFlights?.forEach(f=>f.image.destroy());this.coinFlights=[];}
      this.updateCounters();
    },
    walletBadge(x,y,w=136,showPlus=false) {
      this.image('coins',x,y,w,43);this.coinText=this.text(String(this.walletValue()),x+(showPlus?4:17),y+1,20,{fitWidth:w-(showPlus?76:48),fitHeight:30});
      if(showPlus){
        const plus=this.add.graphics();this.root.add(plus);const px=x+w/2-18;
        plus.lineStyle(6,0x725286,1).lineBetween(px-6,y,px+6,y).lineBetween(px,y-6,px,y+6);
        plus.lineStyle(3,0xffffff,1).lineBetween(px-6,y,px+6,y).lineBetween(px,y-6,px,y+6);
      }
      this.coinAnchor={x:x-w*.37,y};
    },
    updateCoinFX(time,delta=16) {
      const a=this.app;
      if(!this.walletFX){this.walletFX=this.add.container().setDepth(100);this.coinTrails=this.add.graphics();this.walletFX.add(this.coinTrails);this.coinFlights=[];this.coinTick=0;}
      this.walletFX.setPosition(this.root.x,this.root.y).setScale(this.layout.pixelScale);
      this.coinTrails.clear();
      const visible=!!this.coinText?.active&&this.mode!=='ad';this.walletFX.setVisible(visible);
      if(!visible){this.coinFlights.forEach(f=>f.start+=Math.min(delta,50));return;}
      const target=this.coinAnchor||{x:this.coinText.x-48,y:this.coinText.y};
      // One physical coin = one increment. Large prizes stream instead of spawning a burst of hundreds.
      this.coinTick+=Math.min(delta,50);
      while(a.coinQueue>0&&this.coinTick>=18&&this.coinFlights.length<48&&!a.reveal&&(!a.chestReveal||a.chestReveal.opened)){
        this.coinTick-=18;a.coinQueue--;
        const batch=a.coinBatches?.[0],fixed=batch?.origin;
        const origin=fixed?{x:fixed.x*this.layout.W/fixed.W,y:fixed.y*this.layout.H/fixed.H}:this.coinOrigin||{x:this.layout.W/2,y:this.layout.H*.56};
        if(batch&&--batch.count===0)a.coinBatches.shift();
        const flight={start:time,duration:a.reducedMotion?260:480+Math.random()*70,from:{x:origin.x+(fixed?0:(Math.random()-.5)*42),y:origin.y+(fixed?0:(Math.random()-.5)*28)},bend:35+Math.random()*55,history:[]};
        flight.image=this.image('reward-coin',flight.from.x,flight.from.y,23,23,this.walletFX);
        this.coinFlights.push(flight);
      }
      this.coinTick=Math.min(this.coinTick,36);
      let arrived=false;
      this.coinFlights=this.coinFlights.filter(f=>{
        const t=Math.min(1,(time-f.start)/f.duration),e=t*t,arc=Math.sin(t*Math.PI);
        const x=Math.min(this.layout.W-16,f.from.x+(target.x-f.from.x)*e+arc*f.bend),y=f.from.y+(target.y-f.from.y)*e-arc*65;
        f.image.setPosition(x,y).setAngle(Math.sin(t*Math.PI*3)*16).setScale(f.image.scaleX);f.history.push({x,y});if(f.history.length>6)f.history.shift();
        if(!a.reducedMotion)for(let i=1;i<f.history.length;i++){const p=f.history[i-1],q=f.history[i];this.coinTrails.lineStyle(2+i*.65,0xffd764,i/f.history.length*.62).lineBetween(p.x,p.y,q.x,q.y);}
        if(t<1)return true;
        f.image.destroy();a.displayCoins=Math.min(a.save.coins,a.displayCoins+1);this.coinText.setText(String(a.displayCoins));arrived=true;return false;
      });
      if(arrived){this.walletPulse=1;document.getElementById('coin-count').textContent=a.displayCoins;}
      this.walletPulse=Math.max(0,(this.walletPulse||0)-delta/180);
      this.coinText.setScale(1+this.walletPulse*.09);
      if(!a.coinQueue&&!this.coinFlights.length&&a.displayCoins!==a.save.coins){a.displayCoins=a.save.coins;this.updateCounters();}
    },
    royalGlow(x,y,size,parent=this.root) {
      const group=this.add.container(x,y);parent.add(group);group.setData('decorativeEffect',true);
      const rays=this.image('reward-rays',0,0,size*2.3,size*2.3,group).setAlpha(.85);
      const glow=this.image('reward-rays',0,0,size*1.2,size*1.2,group).setAlpha(.45).setAngle(15);
      if(!this.app.reducedMotion){this.tweens.add({targets:rays,angle:360,duration:22000,repeat:-1});this.tweens.add({targets:glow,alpha:.7,duration:1200,yoyo:true,repeat:-1,ease:'Sine.InOut'});}
      for(let i=0;i<9;i++){const a=i*2.4,r=size*(.23+(i%3)*.07),spark=this.image('glint',Math.cos(a)*r,Math.sin(a)*r,9+i%3*3,9+i%3*3,group).setAlpha(.5);if(!this.app.reducedMotion)this.tweens.add({targets:spark,alpha:.1,y:spark.y-15,angle:40,duration:850+i*120,yoyo:true,repeat:-1});}
      return group;
    },
    pulseRewardButton(button) {
      if(this.app.reducedMotion)return;
      this.tweens.add({targets:button,scaleX:1.025,scaleY:1.045,duration:850,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    },
    drawCardEarned() {
      const {W,H,landscape}=this.layout,cx=W/2,cy=H/2,card=this.app.cardCelebration.card;
      this.image('panel',cx,cy+8,430,landscape?578:662);
      this.ribbon('New card unlocked!',cx,cy-(landscape?238:276),388,true,27);
      this.royalGlow(cx,cy-36,landscape?165:210);
      const group=this.add.container(cx,cy-36);this.root.add(group);
      this.image('achievement-frame',0,0,landscape?166:194,landscape?219:259,group);
      this.art(card.art,0,-20,landscape?113:139,landscape?120:157,group);
      this.text(card.name,0,landscape?75:91,20,{color:'#fff9ff',stroke:'#604178',thickness:2,maxWidth:150,fitWidth:150,fitHeight:44},group);
      if(this.animate&&!this.app.reducedMotion){group.setScale(.1, .8).setAngle(-9);this.tweens.add({targets:group,scaleX:1,scaleY:1,angle:0,duration:650,ease:'Back.Out'});this.confetti();}
      this.text('Beautifully done!',cx,cy+(landscape?102:127),27,{color:'#8a5590',thickness:0});
      this.text('A new treasure for your collection.',cx,cy+(landscape?142:172),18,{color:'#8a6492',thickness:0,fitWidth:365});
      this.button('card-earned-continue','KEEP IT',cx,cy+(landscape?211:250),245,61,()=>this.app.finishCardCelebration(),'green-button',27,'finish');
    },
  });
}
