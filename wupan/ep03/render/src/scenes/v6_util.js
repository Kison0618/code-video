'use strict';
// v6 只扩展所需组件；v5 的公共组件和源场景保持原样。
const K=require('../core'), P=require('../paper'), Q=require('../kit02');
const U=require('./v5_util'), TL=require('../timeline');
const {smooth,prog,lerp}=K;
const pop=(t,a,d=0.85)=>smooth(prog(t,a,a+d));
const missing=new Set();
// I 素材一旦落盘，下一次预览自动使用真图；占位始终有明确编号。
function put(ctx,n,x,y,h,o={}) { if(!Q.has(n)) missing.add(n); Q.put(ctx,n,x,y,h,o); }
function sheet(ctx,n,x,y,w,h,o={}) { if(!Q.has(n)) missing.add(n); Q.sheet(ctx,n,x,y,w,h,o); }
function text(ctx,s,x,y,size=54,col=Q.INK,align='center') {
 ctx.save();ctx.fillStyle=col;ctx.font=`700 ${size}px Sans`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);ctx.restore();
}
function paper(ctx,x,y,w,h,draw,o={}) {
 ctx.save();ctx.translate(x,y);ctx.rotate(o.rot||0);
 P.piece(ctx,P.poly(P.jag([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],2,18,o.seed||601)),o.bg||Q.CREAM,{blur:18,dy:8});
 if(draw)draw(ctx,w,h);ctx.restore();
}
function reveal(ctx,t,a,draw,d=0.9) {
 const p=pop(t,a,d);if(p<=0)return;ctx.save();ctx.globalAlpha*=p;ctx.translate(0,lerp(24,0,p));draw();ctx.restore();
}
const cues=[];   // 第三集：不沿用第二集按句登记的纸签音效
for(const [id,word] of cues)U.stampAt('纸签 '+id,TL.at(id,word)+0.3,'minor');
function verdict(ctx,t,id,s,a,x=960,y=830,size=78){
 const p=pop(t,a-0.35,0.65); if(p<=0)return;
 ctx.save();ctx.globalAlpha*=p;Q.tag(ctx,x,y-22*(1-p),s,1,{size,hl:true,rot:-0.012,seed:600+Number(id)});ctx.restore();
}
function coat(ctx,x,y,h,o={}){U.putPart(ctx,'G09',x,y,h,[0,0,0.325,1],o);}
function doctorBack(ctx,x,y,h){
 // I10：白大褂男人背影铜版画（替换带黑块头部的 V6_doctor）。
 put(ctx,Q.has('I10')?'I10':'V6_doctor',x,y,h);
}
// 与 v5 微信气泡共用排版，把几何头像替换为铜版画头像。
function msg(ctx,x,y,w,s,p,o={}){
 const h=U.msg(ctx,x,y,w,s,p,o);
 if(p>0.01){ctx.save();ctx.globalAlpha*=K.clamp(p*2);ctx.translate(0,(1-K.easeOut(p))*30);
 ctx.fillStyle='#e8dfcd';ctx.fillRect(x,y,70,70);
 ctx.beginPath();ctx.rect(x,y,70,70);ctx.clip();U.putPart(ctx,'G01',x+35,y+76,72,[0.2,0,0.8,0.28],{shadow:false});ctx.restore();}return h;
}
function folder(ctx,x,y,w,h,label,p=1){
 if(p<=0)return;ctx.save();ctx.globalAlpha*=p;ctx.translate(0,(1-p)*45);
 paper(ctx,x-w*0.21,y-h/2+4,w*0.53,90,null,{bg:'#c7a36d'});
 paper(ctx,x,y,w,h,(c)=>{text(c,label,0,-h*0.28,44);},{bg:Q.KRAFT});ctx.restore();
}
function openFolder(ctx,t,id,label){
 const p=pop(t,TL.L(id).t0-0.15,1.1);
 if(p>=1)return;
 ctx.save();ctx.translate(960,890);ctx.scale(1,Math.max(0.015,1-p));
 folder(ctx,0,-350,1600,700,label);ctx.restore();
}
module.exports={pop,missing,put,sheet,text,paper,reveal,verdict,coat,doctorBack,msg,folder,openFolder};
