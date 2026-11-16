// Legal CRs 16.11.2026: stage «Подал на ПМЖ», level percent moves with every step, «Твой ужонд» card, passport expiry, payment data integrity
const {JSDOM}=require('jsdom');const fs=require('fs');const path=require('path');
const js=fs.readFileSync(path.resolve(__dirname,'../src/block.js'),'utf8');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
function boot(state){
  const dom=new JSDOM('<!doctype html><body><div class="pl" id="pl-root"></div></body>',{runScripts:'outside-only',url:'https://panbogdan.com/legalizacja'});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollTo=function(){};w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});
  if(state)w.localStorage.setItem('pb-poland-v2',JSON.stringify(state));
  const errs=[];w.addEventListener('error',e=>errs.push(e.message));w.eval(js);
  return {w,errs,$:s=>w.document.querySelector(s),$$:s=>[...w.document.querySelectorAll(s)]};
}
// payment data: strict JSON, 16 voivodeships, valid Polish IBAN checksums
const pay=JSON.parse(js.match(/\/\*PAY\*\/([\s\S]*?)\/\*\/PAY\*\//)[1]);
const iban=a=>{const d=a.replace(/\s/g,'');return d.length===26&&BigInt(d.slice(2)+'2521'+d.slice(0,2))%97n===1n;};
ok(Object.keys(pay.v).length===16,'16 voivodeships in PAY');
ok(Object.values(pay.v).every(v=>iban(v.tax[1])&&iban(v.card[1])),'all 32 accounts pass the IBAN checksum');
ok(Object.values(pay.v).every(v=>/^https:\/\//.test(v.tax[2])&&/^https:\/\//.test(v.card[2])),'every account has a proof link');

// Gdynia: same Pomorski office, Chmielna address, both accounts
let t=boot({city:'gdynia',stage:'wait',stageSet:true});
const uz=t.$('[data-o="uzhond"]').textContent;
ok(/Pomorski Urząd Wojewódzki/.test(uz),'Gdynia shows Pomorski UW');
ok(/Гдыне только паспортный/.test(uz)&&/Chmielna 74\/76/.test(uz),'Gdynia note and Gdańsk address');
ok(/31 1240 1268 1111 0010 3877 3935/.test(uz)&&/07 1010 1140 0169 1322 3100 0000/.test(uz),'Gdańsk accounts shown');
ok(t.$('[data-copy="31124012681111001038773935"]'),'copy button carries digits only');
ok(!/—/.test(uz+t.$('.pb-pass').textContent),'no em dash in new cards');
ok(t.errs.length===0,'no errors: '+t.errs.join('; '));

// level: each VNZh step raises the percent while waiting
const pct=()=>+t.$('[data-o="lvlPct"]').textContent.replace('%','');
const p0=pct();
const gain=t.$('[data-gain="vnzh3"]').textContent;
t.$('[data-cycle="vnzh3"]').click();t.$('[data-cycle="vnzh3"]').click();
const p1=pct();
t.$('[data-cycle="vnzh4"]').click();t.$('[data-cycle="vnzh4"]').click();
const p2=pct();
ok(/^\+\d/.test(gain),'step shows reward chip '+gain);
ok(p1>p0&&p2>p1,'percent grows per step: '+[p0,p1,p2].join(' → '));
ok(!t.$('.pl-lvl-p').classList.contains('sr'),'percent visible next to the level bar');
ok(t.$('[data-gain="paszport2"]').textContent==='','other tracks show no reward chip');

// stage «Подал на ПМЖ»
t=boot({city:'gdansk',stage:'pmzhw',stageSet:true});
const sel=t.$('[data-stage-sel]');
ok([...sel.options].some(o=>o.value==='pmzhw'&&/Подал на ПМЖ/.test(o.textContent)),'stage option «Подал на ПМЖ»');
ok(/Подался на/.test(sel.parentNode.textContent)&&/ПМЖ/.test(sel.parentNode.textContent),'top pill shows it');
ok(t.$('[data-step="pmzh4"]').classList.contains('pl-past')&&!t.$('[data-step="pmzh5"]').classList.contains('pl-past'),'PMZh steps up to filing are passed');
const lv=+t.$('[data-o="lvlPct"]').textContent.replace('%','');
ok(lv>=45&&lv<55,'level within the «Подал на ПМЖ» band: '+lv);
ok(t.errs.length===0,'no errors: '+t.errs.join('; '));
// stages after it keep their meaning
t=boot({stage:'citizen',stageSet:true});
ok(t.$('[data-o="lvlPct"]').textContent==='100%','citizen is 100%');
t=boot({stage:'pmzh',stageSet:true});
ok(t.$('[data-step="pmzh5"]').classList.contains('pl-past'),'«Есть ПМЖ» passes all PMZh steps');

// passport expiry
t=boot({stage:'vnzh',stageSet:true,f:{passExp:'2025-01-10'}});
ok(/как истёк/.test(t.$('[data-o="peK"]').textContent)&&/dokument podróży/.test(t.$('[data-o="peMsg"]').textContent),'expired passport points to PDPC');
t=boot({stage:'vnzh',stageSet:true,f:{passExp:'2099-01-10'}});
ok(/до конца паспорта/.test(t.$('[data-o="peK"]').textContent)&&t.$('[data-o="peMsg"]').textContent==='','valid passport, no warning');
ok(/осталось \d+|срок прошёл/.test(t.$('[data-o="pdpcLeft"]').textContent),'PDPC deadline countdown');
// Warsaw: other office, no Gdynia note
t=boot({city:'warszawa'});
const uw=t.$('[data-o="uzhond"]').textContent;
ok(/Mazowiecki/.test(uw)&&/Marszałkowska 3\/5/.test(uw)&&!/Гдыне/.test(uw),'Warsaw card');
t=boot({city:'katowice'});
ok(/Адрес и часы/.test(t.$('[data-o="uzhond"]').textContent),'no verified address: link to the department');
// cards folded by default; invitation gate and money
t=boot({city:'gdansk',stage:'vnzh',stageSet:true,f:{since:'2019-03-01'}});
ok(['pl-d-uz','pl-d-pass','pl-d-inv'].every(id=>t.$('#'+id)&&!t.$('#'+id).open),'three cards, folded');
ok(/Pomorski/.test(t.$('#pl-d-uz summary').textContent),'ужонд name in the folded summary');
ok(/^Доступно/.test(t.$('[data-o="invSum2"]').textContent),'invite open after 5 years: '+t.$('[data-o="invSum2"]').textContent);
ok(t.$('[data-o="invSum"]').textContent.replace(/\s/g,'')==='1230','1 month, 1 guest, Belarus: 2×515+200 = 1230 ('+t.$('[data-o="invSum"]').textContent+')');
t.$('#pl-d-inv input[data-f="invRel"]').click();
ok(t.$('[data-o="invSum"]').textContent.replace(/\s/g,'')==='400','close relative: 200+200 = 400');
ok(!/—/.test(t.$('#pl-d-inv').textContent),'no em dash in invite card');
t=boot({city:'gdansk',stage:'vnzh',stageSet:true,f:{since:'2024-03-01'}});
ok(/^Через/.test(t.$('[data-o="invSum2"]').textContent)&&t.$('#pl-d-inv').classList.contains('is-off'),'invite locked before 5 years');
t=boot({city:'gdansk',stage:'pmzh',stageSet:true});
ok(/^Доступно/.test(t.$('[data-o="invSum2"]').textContent),'invite open with ПМЖ');
ok(t.errs.length===0,'no errors: '+t.errs.join('; '));
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
