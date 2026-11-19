const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
function setup(page='details.html',hash=''){
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://example.org/ThermalEfficiency/'+page+hash,runScripts:'outside-only'}),w=dom.window;
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){w.downloaded=this.download;};
 for(const file of ['navigation.js','model.js','data.js','chart.js','app.js'])w.eval(fs.readFileSync(file,'utf8'));
 const get=id=>w.document.getElementById(id),set=(id,value)=>{get(id).value=String(value);get(id).dispatchEvent(new w.Event(get(id).tagName==='SELECT'?'change':'input',{bubbles:true}));};
 return {dom,w,get,set};
}

test('simple page starts empty, reveals inputs independently, and only calculates complete experiments',()=>{
 const {dom,w,get,set}=setup('index.html');
 assert.equal(get('stimulus').value,'');assert.equal(get('solvent').value,'');assert.ok(get('results').hidden);assert.ok(!get('experiment-inputs').hidden);
 assert.ok(get('adjust-assumptions').closest('[hidden]'));assert.deepEqual([...get('experiment-fields').querySelectorAll('input')].map(x=>x.id),['factor','minutes','temperature']);assert.ok(get('share').closest('[hidden]'));assert.ok(get('csv').closest('[hidden]'));
 set('stimulus','electricity');assert.ok(!get('stimulus-inputs').hidden);assert.ok(get('solvent-inputs').hidden);assert.ok(get('supporting-text').hidden);
 set('solvent','water');assert.ok(!get('experiment-inputs').hidden);assert.ok(get('results').hidden);
 set('power',2);set('volume',100);set('factor',5);assert.ok(get('results').hidden);set('minutes',10);
 assert.ok(get('error').hidden,get('error').textContent);assert.ok(!get('results').hidden);assert.ok(get('chart').querySelector('.heat-line'));assert.ok(!get('supporting-text').hidden);assert.ok(get('chart').compareDocumentPosition(get('supporting-text')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
 const hash=new URL(get('full-details').href).hash;assert.ok(hash);
 const details=setup('details.html',hash);assert.equal(details.get('power').value,'2');assert.equal(details.get('solvent').value,'water');assert.equal(details.get('minutes').value,'10');
 set('power','');assert.ok(get('results').hidden);assert.ok(get('full-details').hidden);assert.equal(new URL(w.document.querySelector('[data-scenario-link]').href).hash,'');
 details.dom.window.close();dom.window.close();
});

test('simple example, known activation energy, invalid states and reset work without stale output',()=>{
 const {dom,w,get,set}=setup('index.html');get('try-example').click();assert.equal(get('minutes').value,'30');assert.ok(!get('results').hidden);assert.match(get('example-note').textContent,/Illustrative/);assert.ok(get('try-example').hidden);assert.equal(get('supporting-text').open,false);assert.equal(get('action-status').textContent,'');
 get('know-ea').click();assert.equal(get('mode').value,'known');assert.ok(!get('known-input').hidden);set('ea',5);assert.match(get('verdict-title').textContent,/Outside|No valid/);
 set('volume',-1);assert.ok(!get('error').hidden);assert.ok(get('results').hidden);assert.ok(get('full-details').hidden);
 get('reset').click();assert.equal(get('stimulus').value,'');assert.equal(get('solvent').value,'');assert.equal(get('power').value,'');assert.ok(get('results').hidden);assert.ok(get('error').hidden);assert.equal(w.sessionStorage.getItem('thermal-scenario'),null);assert.ok(!get('try-example').hidden);
 dom.window.close();
});

test('solvent can be chosen first and the top input row stays available through reset',()=>{
 const {dom,get,set}=setup('index.html');
 set('factor',4);set('minutes',12);set('temperature',30);set('solvent','ethanol');
 assert.equal(get('stimulus').value,'');assert.ok(get('stimulus-inputs').hidden);assert.ok(!get('solvent-inputs').hidden);assert.ok(!get('experiment-inputs').hidden);assert.ok(get('results').hidden);
 set('volume',100);set('stimulus','light');set('power',2);assert.ok(!get('results').hidden);
 set('temperature','');assert.ok(get('results').hidden);assert.ok(get('supporting-text').hidden);
 get('reset').click();assert.ok(!get('experiment-inputs').hidden);assert.ok(get('stimulus-inputs').hidden);assert.ok(get('solvent-inputs').hidden);assert.equal(get('temperature').value,'25');
 dom.window.close();
});

test('result accents follow the favoured route and clear for out-of-range comparisons',()=>{
 const {dom,get,set}=setup('index.html');get('try-example').click();
 assert.match(get('verdict-title').querySelector('.stim').textContent,/advantage below .*kJ\/mol/);
 get('know-ea').click();set('ea',50);set('power',0.01);
 assert.match(get('verdict-title').querySelector('.stim').textContent,/^[0-9.,]+% less energy$/);
 set('power',100);assert.match(get('verdict-title').querySelector('.heat').textContent,/^[0-9.,]+% less energy$/);
 set('ea',1);assert.equal(get('verdict-title').querySelector('.stim,.heat'),null);assert.equal(get('verdict-title').querySelector('.caution').textContent,'No valid thermal comparison');
 dom.window.close();
});

test('neutral verdicts emphasize only break-even or the exceptional condition',()=>{
 const {dom,get,set}=setup();set('mode','known');
 const D=require('./data.js'),M=require('./model.js'),r=M.calculate({...D.defaults,mode:'known'});
 set('power',r.thermal/(D.defaults.minutes*60));
 assert.equal(get('verdict-title').textContent,'The two routes break even');assert.equal(get('verdict-title').querySelector('strong').textContent,'break even');assert.equal(get('verdict-title').querySelector('.stim,.heat,.caution'),null);
 set('mode','threshold');set('power',0);assert.equal(get('verdict-title').textContent,'No finite break-even point');assert.match(get('verdict-copy').textContent,/Check the entered stimulus energy/);assert.equal(get('verdict-title').querySelector('.stim,.heat,.caution'),null);
 set('factor',1);assert.equal(get('verdict-title').textContent,'No rate enhancement to compare');
 dom.window.close();
});

test('descriptive comparisons highlight both routes and preserve validity qualifications',()=>{
 const {dom,get,set}=setup('index.html');get('try-example').click();
 assert.equal(get('verdict-copy').querySelector('.stim').textContent,'stimulation uses less energy');
 assert.equal(get('verdict-copy').querySelector('.heat').textContent,'heating uses less energy');
 assert.match(get('verdict-copy').textContent,/within the valid temperature range/);
 set('power',100);
 assert.equal(get('verdict-copy').querySelector('.heat').textContent,'Heating uses less energy');
 assert.match(get('verdict-copy').textContent,/wherever this thermal benchmark is valid/);
 get('know-ea').click();set('ea',50);
 assert.match(get('verdict-copy').querySelector('.stim').textContent,/kJ for stimulation/);
 assert.match(get('verdict-copy').querySelector('.heat').textContent,/kJ for heating/);
 set('ea',1);assert.equal(get('verdict-copy').querySelector('strong'),null);
 dom.window.close();
});

test('explanations stay inside collapsed Model notes and example hides after any input',()=>{
 const {dom,w,get,set}=setup('index.html');
 assert.ok(!get('try-example').hidden);set('temperature',26);assert.ok(get('try-example').hidden);assert.ok(get('try-example').parentElement.hidden);assert.ok(!get('reset').hidden);
 get('reset').click();assert.ok(!get('try-example').hidden);get('try-example').click();
 const notes=get('supporting-text');assert.equal(notes.tagName,'DETAILS');assert.equal(notes.open,false);
 for(const id of ['chart-note','chart-caption','assumption-summary','solvent-note','warnings','example-note'])assert.ok(notes.contains(get(id)),id);
 assert.deepEqual([...get('simple-settings').children].map(n=>n.id),['adjust-assumptions','supporting-text']);
 assert.ok(get('chart').compareDocumentPosition(get('adjust-assumptions')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.ok(!w.document.querySelector('.actions').contains(get('example-note')));
 notes.open=true;assert.match(get('example-note').textContent,/Illustrative/);
 dom.window.close();
});

test('simple power methods require their own measurements and custom liquids require properties',()=>{
 const {dom,get,set}=setup('index.html');set('stimulus','light');set('solvent','custom');
 assert.ok(get('adjust-assumptions').open);assert.ok(get('solvent-properties').open);assert.equal(get('cp').value,'');
 set('volume',100);set('factor',5);set('minutes',10);set('method','irradiance');set('irradiance',100);set('area',10);assert.ok(get('results').hidden);
 set('density',1);set('cp',4);set('minimum',0);set('limit',90);assert.ok(get('error').hidden,get('error').textContent);assert.ok(!get('results').hidden);
 set('stimulus','mechanical');set('method','rotation');assert.ok(get('results').hidden);set('torque',.01);set('rpm',1000);assert.ok(!get('results').hidden);
 dom.window.close();
});

test('Details scenarios retain advanced assumptions on the simple page and on return',()=>{
 const details=setup();details.set('accounting','equipment');details.set('method','delivered');details.set('stimEfficiency',25);details.set('vessel',20);details.set('temperature',30);details.set('mode','known');details.set('ea',50);
 const hash=new URL(details.w.document.querySelector('[data-scenario-link]').href).hash;
 const simple=setup('index.html',hash);assert.ok(!simple.get('results').hidden);assert.ok(simple.get('know-ea').checked);assert.equal(simple.get('stimEfficiency').value,'25');assert.match(simple.get('assumption-summary').textContent,/Equipment.*30 °C.*vessel/);
 const back=setup('details.html',new URL(simple.get('full-details').href).hash);assert.equal(back.get('vessel').value,'20');assert.equal(back.get('stimEfficiency').value,'25');assert.equal(back.get('mode').value,'known');
 for(const instance of [details,simple,back])instance.dom.window.close();
});
test('initial calculator and direct Details load render a finite result and chart',()=>{for(const page of ['details.html']){const {dom,get}=setup(page);assert.ok(get('error').hidden);assert.match(get('thermal-headline').textContent,/kJ\/mol/);assert.match(get('stim-energy').textContent,/1.2 kJ/);assert.ok(get('chart').querySelector('.heat-line'));dom.window.close();}});
test('all stimulus selectors show the right fields and recalculate',()=>{const {dom,get,set}=setup();for(const [stim,method]of [['light','irradiance'],['electricity','electrical'],['mechanical','cycles'],['mechanical','rotation'],['ultrasound','delivered'],['custom','direct']]){set('stimulus',stim);set('method',method);assert.ok(get('error').hidden,stim);assert.equal(get('method').value,method);assert.notEqual(get('stim-energy').textContent,'—');}dom.window.close();});
test('equipment mode makes efficiency conversion visible and updates energy',()=>{const{dom,get,set}=setup();set('accounting','equipment');set('method','delivered');set('power',10);set('stimEfficiency',25);assert.equal(get('stim-energy').textContent,'24 kJ');assert.equal(get('stim-efficiency').hidden,false);set('method','direct');assert.equal(get('stim-energy').textContent,'6 kJ');assert.equal(get('stim-efficiency').hidden,true);dom.window.close();});
test('known Ea, time graph, zero energy and invalid values work without stale results',()=>{const{dom,get,set}=setup();set('mode','known');set('ea',50);assert.ok(!get('results').hidden);set('plot','time');assert.match(get('chart').textContent,/Operating duration/);set('volume','');assert.equal(get('results').hidden,true);assert.equal(get('csv').disabled,true);set('volume',100);set('power',0);assert.equal(get('results').hidden,false);set('mode','threshold');assert.match(get('verdict-title').textContent,/No finite/);set('factor',1);assert.match(get('verdict-title').textContent,/No rate enhancement/);set('factor',.5);assert.equal(get('error').hidden,false);dom.window.close();});
test('preset properties reload and custom values survive scenario sharing and navigation',()=>{const{dom,w,get,set}=setup();set('solvent','ethanol');assert.equal(get('density').value,'0.789');set('cp',3.2);const link=w.document.querySelector('a[href^="details.html"]');const hash=new URL(link.href).hash;const next=setup('details.html',hash);assert.equal(next.get('cp').value,'3.2');assert.equal(next.get('solvent').value,'ethanol');assert.match(next.get('solvent-note').textContent,/Edited/);dom.window.close();next.dom.window.close();});
test('out of range temperatures suppress verdict; preset boiling point cannot be bypassed',()=>{const{dom,get,set}=setup();set('mode','known');set('ea',5);assert.match(get('verdict-title').textContent,/Outside|No valid/);assert.equal(get('thermal-headline').textContent,'Outside model range');set('limit',1000);assert.match(get('warnings').textContent,/capped/);assert.equal(get('thermal-headline').textContent,'Outside model range');dom.window.close();});
test('malformed scenario falls back safely and theme toggle changes appearance',()=>{const{dom,w,get}=setup('index.html','#not-json');assert.ok(get('error').hidden);assert.match(get('action-status').textContent,/Could not read/);get('theme').click();assert.equal(w.document.documentElement.dataset.theme,'dark');get('theme').click();assert.equal(w.document.documentElement.dataset.theme,'light');dom.window.close();});
test('CSV produces a download and reset restores the illustrative example',()=>{const{dom,w,get,set}=setup();set('power',7);get('csv').click();assert.equal(w.downloaded,'thermal-efficiency.csv');get('reset').click();assert.equal(get('power').value,'2');assert.ok(get('error').hidden);dom.window.close();});
test('source filter is functional and reports empty results',()=>{const dom=new JSDOM(fs.readFileSync('sources.html','utf8'),{runScripts:'outside-only'});for(const file of['data.js','sources.js'])dom.window.eval(fs.readFileSync(file,'utf8'));const d=dom.window.document;assert.equal(d.querySelectorAll('#sources-body tr').length,17);d.getElementById('source-search').value='acetonitrile';d.getElementById('source-search').dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('#sources-body tr').length,1);d.getElementById('source-search').value='not-a-solvent';d.getElementById('source-search').dispatchEvent(new dom.window.Event('input'));assert.match(d.getElementById('source-count').textContent,/0 of 17/);dom.window.close();});

test('every page has the shared menu, footer order, and scroll behavior',()=>{
 for(const page of ['index.html','details.html','assumptions.html','sources.html']){
  const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://example.org/ThermalEfficiency/'+page,runScripts:'outside-only'}),w=dom.window,d=w.document;
  w.eval(fs.readFileSync('navigation.js','utf8'));w.eval(fs.readFileSync('menu.js','utf8'));
  const header=d.querySelector('.site-header'),toggle=d.querySelector('.menu-toggle'),nav=d.querySelector('#main-menu');
  assert.ok(header.querySelector('.menu-outline'));assert.ok(nav.querySelector('[aria-current="page"]'));
  const links=d.querySelectorAll('.footer-links a');assert.equal(links[0].textContent,'About the author');assert.equal(links[1].textContent,'Source code on GitHub');
  toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(nav.inert,false);
  Object.defineProperty(w,'scrollY',{value:49,writable:true});w.dispatchEvent(new w.Event('scroll'));assert.equal(header.inert,true);assert.equal(nav.inert,true);assert.equal(toggle.getAttribute('aria-expanded'),'false');
  w.scrollY=0;w.dispatchEvent(new w.Event('pageshow'));assert.equal(header.inert,false);assert.equal(d.body.classList.contains('is-page-scrolled'),false);
  toggle.click();toggle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,toggle);
  dom.window.close();
 }
});
