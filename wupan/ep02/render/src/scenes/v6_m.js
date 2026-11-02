'use strict';
// 008–018：捷径 → 只认符号 → 责任转移 → 急迫依赖。
const K=require('../core'),Q=require('../kit02'),X=require('../kit'),B=require('../brain');
const TL=require('../timeline'),U=require('./v5_util'),V=require('./v6_util');
const {prog,smooth,lerp}=K, {L,at}=TL;
const RULE='IF 说话的是权威 → 照做';
function s08(c,t){
 // I09 岔路口版画：左边弯路 = 自己查一遍，右边直路 = 听权威的。
 const z=1+0.02*smooth(prog(t,L('008').t0,L('008').t1));
 c.save();c.translate(960,480);c.scale(z,z);c.translate(-960,-480);V.sheet(c,'I09',960,480,1320,880,{seed:608});c.restore();
 Q.tag(c,570,600,'自己查一遍',V.pop(t,L('008').t0+0.6),{size:56,rot:0.02});
 Q.tag(c,1360,520,'听权威的',V.pop(t,at('008','听权威')),{size:62,hl:true});
 Q.tag(c,1360,700,'捷径',V.pop(t,at('008','捷径')-0.4),{size:96,hl:true});
}
function s09(c,t){
 const z=1+0.025*smooth(prog(t,L('009').t0,L('009').t1));
 c.save();c.translate(960,470);c.scale(z,z);c.translate(-960,-470);Q.sheet(c,'H07',960,470,1460,780,{seed:609});c.restore();
 Q.tag(c,960,830,'听首领的 → 活得更久',V.pop(t,at('009','听他的')),{size:70,hl:true});
}
function s10(c,t){
 // 先让两张卡完整清楚，“所以大脑”前 0.4 秒退场，人脑随后进来，不叠化。
 const cut=at('010','所以大脑'),q=smooth(prog(t,cut-0.4,cut)),p=smooth(prog(t,cut,cut+0.5));
 if(q<1){c.save();c.globalAlpha=1-q;
 V.paper(c,520,490,700,650);V.paper(c,1400,490,700,650);
 V.coat(c,520,730,490);Q.put(c,'G02',1400,730,490);
 Q.tag(c,520,820,'医生比你懂病',V.pop(t,at('010','医生')),{size:56});
 Q.tag(c,1400,820,'机长比你懂飞机',V.pop(t,at('010','机长')),{size:56});c.restore();}
 if(p>0){c.save();c.globalAlpha=p;B.head(c,{x:470,y:940,h:760,glass:0.8});
 B.ruleCard(c,1280,420,RULE,58,{seed:610});
 Q.tag(c,1280,700,'说话的是谁',V.pop(t,at('010','说话的是谁')),{size:86,hl:true});c.restore();}
}
function s11(c,t){
 Q.tag(c,960,220,'它只认符号',V.pop(t,at('011','只认符号')),{size:76,hl:true});
 const items=[['一身制服',460,()=>Q.put(c,'G02',460,820,510)],['一个头衔',960,()=>V.paper(c,960,580,470,300,cc=>{V.text(cc,'主任医师',0,-40,64);V.text(cc,'教授 · 专家',0,50,40,Q.RUST);},{rot:-0.02})],['一件白大褂',1460,()=>V.coat(c,1460,820,510)]];
 items.forEach(([word,x,fn])=>V.reveal(c,t,at('011',word),()=>{fn();Q.pin(c,x,x===960?445:330);}));
}
function s12(c,t){
 V.sheet(c,'I01',1120,450,1320,730,{label:'1974 年纽约街景 · 停车计时器'});
 V.reveal(c,t,at('012','陌生人'),()=>V.put(c,'I03',450,890,650,{label:'便装男'}));
 // 字幕下方仍留出 30px 标签空间。
 Q.tag(c,1480,1040,'1974 · 纽约',V.pop(t,L('012').t0),{size:30});
}
function s13(c,t){
 // 放大：代表人物高 320，路人高 280，标签 38px，没照做的路人 0.25 透明度。
 [['I03','便装',440,4,'便装'],['I04','保安制服',880,9,'保安制服']].forEach(([asset,label,y,n,word],row)=>{
 V.put(c,asset,190,y,320,{label});
 const p=V.pop(t,at('013',word),1.4);
 for(let i=0;i<10;i++){
  const on=i<n&&p>(i+0.3)/n;
  c.save();c.globalAlpha=on?1:0.25;
  if(Q.has('I02'))Q.put(c,'I02',420+i*100,y,280,{shadow:false});
  else {V.missing.add('I02');Q.put(c,'G01',420+i*100,y,280,{shadow:false});}
  c.restore();
 }
 V.text(c,label,190,y+30,38);
 V.reveal(c,t,at('013',row?'九成':'四成'),()=>V.text(c,`${n}/10`,1650,y-140,190,row?Q.RUST:Q.INK));
 });
 if(!Q.has('I02'))V.text(c,'I02 待替换 · 临用 G01 铜版画',960,920,30);
}
function s14(c,t){
 const eq=at('014','真制服'),p=smooth(prog(t,eq-0.3,eq+0.7));
 if(p<1){c.save();c.globalAlpha=1-p;
 Q.put(c,'G02',650,790,540);Q.tag(c,650,760,'能买',V.pop(t,at('014','能买')),{size:58});
 Q.put(c,'V6_press',1300,760,540);
 V.text(c,'教授',1235,565,62);
 X.stamp(c,1300,650,'能编',prog(t,at('014','能编'),at('014','能编')+0.8),{size:78,color:Q.RUST});c.restore();}
 if(p>0){c.save();c.globalAlpha=p;Q.put(c,'G02',650,780,540);Q.put(c,'G02',1270,780,540);V.text(c,'＝',960,490,150);c.restore();}
 V.verdict(c,t,'014','衣服能买，头衔能编',at('014','衣服能买'),960,850,76);
}
function responsibility(c,t,x=1030,y=610,w=1100){
 V.sheet(c,'I08',x,y,w,w*0.48,{label:'两只手交接空白木牌'});
 V.text(c,'责任',x,y,90,Q.RUST);
}
function s15(c,t){
 const p=V.pop(t,at('015','责任')-1,1.5);
 c.save();c.translate(lerp(-100,0,p),0);responsibility(c,t,820,520,1000);c.restore();
 V.doctorBack(c,1510,900,660);
 Q.tag(c,660,210,'把责任交出去',V.pop(t,at('015','责任')),{size:70,hl:true});
}
function s17(c,t){
 const p=smooth(prog(t,L('017').t0-0.2,L('017').t0+1));
 if(p<1){c.save();c.globalAlpha=1-p;require('./v6_milgram').panel(c,1270,420,30,t);c.restore();}
 V.doctorBack(c,960,790,580);
 // 木牌与背影作为一个交接主体，B8 时不再增加别的说明。
 responsibility(c,t,960,660,570);
 V.verdict(c,t,'017','他们不是坏人',at('017','他们不是坏人'),960,850,82);
}
function s18(c,t){
 // 怀表图留作独立资产入口；缺图显示明确的纸质占位，不用几何物件冒充。
 V.put(c,'V6_watch',610,760,540,{label:'铜版画怀表',ar:0.8});
 if(Q.has('V6_watch')){c.save();c.translate(...Q.ptOf('V6_watch',610,760,540,0.5,0.62));c.rotate((t-L('018').t0)*2.4);c.strokeStyle=Q.RUST;c.lineWidth=4;c.beginPath();c.moveTo(0,24);c.lineTo(0,-130);c.stroke();c.restore();}
 Q.put(c,'G06',1320+Math.sin(t*7)*2,750,430,{rot:Math.sin(t*7)*0.003});
 Q.tag(c,960,860,'越急越慌 → 越想找个权威',V.pop(t,at('018','越急')),{size:68,hl:true});
}
module.exports={shots:[['008',s08],['009',s09],['010',s10],['011',s11],['012',s12],['013',s13],['014',s14],['015',s15],['016',require('./v6_milgram').draw],['017',s17],['018',s18]].map(([id,draw])=>({a:L(id).t0-0.15,tr:'fade',name:id,draw}))};
