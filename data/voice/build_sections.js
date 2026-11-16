const fs=require('fs');
const L=JSON.parse(fs.readFileSync('lines.json','utf8'));
const spell=s=>s.replace(/ESFJ/g,'E-S-F-J').replace(/ISFJ/g,'I-S-F-J').replace(/ESTJ/g,'E-S-T-J').replace(/ISTJ/g,'I-S-T-J').replace(/ISTP/g,'I-S-T-P');
const INS='[像跟熟人随口聊天，语速很快，一口气说下来，不播音不表演，句与句之间不拖]';
const secs=[];
for(const o of L){ let s=secs.find(x=>x.section===o.section); if(!s){s={section:o.section,ids:[],_t:[]};secs.push(s);} s.ids.push(o.id); s._t.push(spell(o.text)); }
for(const s of secs){ s.text='<|speaker:0|>'+INS+'<fast>'+s._t.join('')+'</fast>'; s.chars=[...s.text.replace(/<[^>]+>|\[[^\]]+\]/g,'')].filter(c=>c>='\u4e00'&&c<='\u9fff').length; delete s._t; }
fs.writeFileSync('sections.json',JSON.stringify(secs,null,1));
console.log(secs.map(s=>s.section+':'+s.ids.length+'句 '+s.chars+'字').join('  '));
