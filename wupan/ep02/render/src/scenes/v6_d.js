'use strict';
// 031–040：遮住头衔、主动核实、让别人先说。
const K=require('../core'),Q=require('../kit02'),X=require('../kit');
const TL=require('../timeline'),U=require('./v5_util'),V=require('./v6_util');
const {L,at}=TL,{prog,smooth,lerp}=K;
const TITLES=['① 遮住头衔','② 看他怕不怕查','③ 你是权威时'];
function heading(c,n){Q.tag(c,1270,165,TITLES[n],1,{size:58,seed:731+n});}
function s31(c,t){
 TITLES.forEach((s,k)=>V.folder(c,440+k*520,520,470,470,s,V.pop(t,L('031').t0+k*0.7,1)));
 V.verdict(c,t,'031','三个能直接用的办法',at('031','三个'),960,850,74);
}
function s32(c,t){
 heading(c,0);
 V.paper(c,1190,535,1090,430,cc=>V.text(cc,'请马上照我说的做',0,0,86));
 const change=at('032','穿T恤'),p=smooth(prog(t,change-0.4,change+0.8));
 if(p<1){c.save();c.globalAlpha=1-p;Q.put(c,'G02',400,910,690);c.restore();}
 if(p>0){c.save();c.globalAlpha=p;V.put(c,'I05',400,910,690,{label:'T 恤普通人'});c.restore();}
 c.save();c.globalAlpha=1-p;
 V.paper(c,400,455,250,90,cc=>V.text(cc,'机长',0,0,54));
 V.reveal(c,t,at('032','遮住'),()=>V.paper(c,400,455,280,105),1);c.restore();
 Q.tag(c,1190,850,'同一句话，你还会照做吗？',V.pop(t,at('032','你还会')),{size:62,hl:true});
}
function s33(c,t){
 heading(c,0);
 V.reveal(c,t,at('033','还会'),()=>V.paper(c,520,530,760,610,cc=>{
  V.text(cc,'还会',0,-200,92);V.text(cc,'✓',0,-65,130,'#536247');V.text(cc,'打动你的是道理',0,160,64);
 }));
 V.reveal(c,t,at('033','不会'),()=>V.paper(c,1400,530,760,610,cc=>{
  V.text(cc,'不会',0,-200,92);Q.put(cc,'G02',0,110,250);V.text(cc,'打动你的是那身衣服',0,205,56);
  X.mark(cc,190,-10,180,'?',V.pop(t,at('033','衣服')-0.4),Q.RUST);
 }));
}
function s34(c,t){
 heading(c,1);
 const cards=[['医生',500,'医院转诊单','请到其他医院复查'],['警察',1420,'派出所便民卡','请到派出所当面办理']];
 cards.forEach(([word,x,title,line],k)=>V.reveal(c,t,at('034',word),()=>V.paper(c,x,540,800,550,cc=>{
  V.text(cc,title,0,-175,68);V.text(cc,'欢迎核实',0,-65,46);V.text(cc,line,0,50,56);
  X.stamp(cc,0,180,'✓ 不怕查',prog(t,at('034',k?'当面办':'复查')-0.2,at('034',k?'当面办':'复查')+0.7),{size:66,color:Q.INK,rot:-0.04});
 })));
}
function s35(c,t){
 Q.tag(c,490,195,TITLES[1],1,{size:52});
 Q.tag(c,490,425,'最怕你查',V.pop(t,at('035','最怕')),{size:84,hl:true});
 U.phone(c,1280,535,650,690,(cc,w,h)=>{
  cc.fillStyle='#efe9dc';cc.fillRect(0,0,w,h);V.text(cc,'对方的消息',w/2,58,42);
  ['马上转账','别挂电话','不许告诉家人'].forEach((s,k)=>V.msg(cc,24,145+k*160,w-24,s,V.pop(t,at('035',s),0.8),{size:48,bg:'#f0d7cb',color:Q.RUST}));
 });
}
function s36(c,t){
 heading(c,1);
 const cut=at('036','挂掉电话'),p=smooth(prog(t,cut-0.3,cut+0.7));
 if(p<1){c.save();c.globalAlpha=1-p;
 V.paper(c,960,500,1570,500,cc=>{
  V.text(cc,'急 + 别告诉别人',0,-110,100,Q.RUST);
  V.text(cc,'= 先当它是假的',0,100,106);
 });c.restore();}
 if(p>0){c.save();c.globalAlpha=p;
 U.phone(c,650,530,520,680,(cc,w,h)=>{
  cc.fillStyle='#f6f0e3';cc.fillRect(0,0,w,h);V.text(cc,'拨号',w/2,60,40);
  V.text(cc,'自己查到的号码',w/2,160,48);
  ['1  2  3','4  5  6','7  8  9','*  0  #'].forEach((s,k)=>V.text(cc,s,w/2,280+k*75,52));
  const q=V.pop(t,at('036','打回去'),0.8);
  V.paper(cc,w/2,610,300,78,ccc=>V.text(ccc,q>0.7?'正在呼叫…':'拨号',0,0,42,Q.CREAM),{bg:'#536247'});
 });
 Q.tag(c,1360,360,'对方给的号码',1,{size:64});
 U.strike(c,1100,365,1620,345,prog(t,at('036','别用'),at('036','别用')+0.8));
 Q.tag(c,1360,630,'自己查到的号码',V.pop(t,at('036','自己查到')),{size:70,hl:true});c.restore();}
}
function table(c){V.sheet(c,'I06',960,520,1440,730,{label:'会议桌 · 主位在尽头'});}
function s37(c,t){
 table(c);heading(c,2);
 [['领导',500],['家长',960],['老师',1420]].forEach(([s,x])=>Q.tag(c,x,820,s,V.pop(t,at('037',s)),{size:72,hl:true}));
}
function s38(c,t){
 V.sheet(c,'I07',960,490,1550,790,{label:'1970 年代驾驶舱 · 机长与副驾驶背影'});
 const p=V.pop(t,at('038','故意犯错'),1.2);
 // 图上的警示灯变亮；角色不做动作。
 if(p>0){c.save();c.globalAlpha=p;c.shadowColor=Q.RUST;c.shadowBlur=24;c.fillStyle=Q.RUST;c.beginPath();c.arc(1070,520,12,0,Math.PI*2);c.fill();c.restore();}
 Q.tag(c,960,850,'副驾驶不敢说',V.pop(t,at('038','副驾驶')),{size:78,hl:true});
}
function s39(c,t){
 table(c);heading(c,2);
 const a=at('039','让别人先说');
 [[530,630],[1390,630],[650,440],[1270,440]].forEach(([x,y],k)=>Q.tag(c,x,y,String(k+1),V.pop(t,a+k*0.45),{size:64}));
 Q.tag(c,960,315,'最后说',V.pop(t,at('039','最后说')),{size:60,hl:true});
 Q.tag(c,960,850,'谁觉得我错了？',V.pop(t,at('039','谁觉得')),{size:82,hl:true});
}
function s40(c,t){
 const a=L('040').t0;
 X.stamp(c,960,455,'误判',prog(t,a+0.2,a+1.1),{size:250,rot:-0.08,seed:740,color:Q.RUST});
 V.verdict(c,t,'040','从来没查过的“权威”',at('040','从来没查过'),960,800,78);
}
U.stampAt('误判',L('040').t0+0.2+0.9/1.4,'main');
module.exports={shots:[['031',s31],['032',s32],['033',s33],['034',s34],['035',s35],['036',s36],['037',s37],['038',s38],['039',s39],['040',s40]].map(([id,draw])=>({a:L(id).t0-0.2,tr:'fade',...(id==='031'?{gl:'fanye'}:{}),name:id,draw(c,t){draw(c,t);const n=['032','034','037'].indexOf(id);if(n>=0)V.openFolder(c,t,id,TITLES[n]);}}))};
