(() => {
 'use strict';
 const $=id=>document.getElementById(id),D=ThermalData,M=ThermalModel,defaults=D.defaults;
 let current=null,result=null;
 const simple=document.body.dataset.simple==='true';
 let restored=false;
 let started=false;
 const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:0}):'—';
 const energy=n=>`${fmt(n/1000,3)} kJ`;
 const methods={light:[['direct','Direct power'],['delivered','Optical power at sample'],['irradiance','Irradiance × illuminated area']],electricity:[['direct','Direct power'],['electrical','Full cell voltage × current']],mechanical:[['direct','Direct power'],['delivered','Delivered mechanical power'],['cycles','Net work per cycle × frequency'],['rotation','Torque × rotation speed']],ultrasound:[['direct','Direct power'],['delivered','Calibrated acoustic power']],custom:[['direct','Direct power'],['delivered','Delivered power']]};
 for(const s of D.solvents)$('solvent').add(new Option(s.name,s.id));$('solvent').add(new Option('Custom liquid / mixture','custom'));
 function setMethods(preferred){const stimulus=$('stimulus').value,accounting=$('accounting').value;const opts=methods[stimulus]||methods.custom;$('method').replaceChildren();for(const[v,text]of opts)$('method').add(new Option(v==='direct'?(accounting==='equipment'?'Measured electrical input power':'Measured delivered power'):text,v));$('method').value=opts.some(x=>x[0]===preferred)?preferred:'direct';}
 function apply(s){for(const[key,value]of Object.entries(defaults))if($(key)&&key!=='method')$(key).value=s[key]??value;setMethods(s.method);if(simple){$('know-ea').checked=s.mode==='known';$('plot').value='activation';}}
 function load(){
  restored=false;
  let data=null;try{if(location.hash){if(location.hash.length>12000)throw Error('long');data=JSON.parse(decodeURIComponent(location.hash.slice(1)));}else if(!simple)data=JSON.parse(sessionStorage.getItem('thermal-scenario')||'null');}catch{ $('action-status').textContent=simple?'Could not read scenario; start a new comparison.':'Could not read saved scenario; showing the example.';}
  if(!data)return {...defaults};
  if(data.version!==1||!data.inputs||Object.keys(defaults).some(k=>typeof data.inputs[k]!==typeof defaults[k])){$('action-status').textContent=simple?'Unsupported or incomplete scenario; start a new comparison.':'Unsupported or incomplete scenario; showing the example.';return {...defaults};}
  const s={...defaults};for(const k of Object.keys(defaults))s[k]=data.inputs[k];
  if(!methods[s.stimulus]||!methods[s.stimulus].some(x=>x[0]===s.method)||!['ideal','equipment'].includes(s.accounting)||!['known','threshold'].includes(s.mode)||!['activation','time'].includes(s.plot)||!(s.solvent==='custom'||D.solvents.some(x=>x.id===s.solvent)))return {...defaults};
  restored=true;return s;
 }
 function clearSimple(){
  started=false;$('example-note').textContent='';$('supporting-text').open=false;
  apply(defaults);$('stimulus').value='';$('solvent').value='';
  for(const id of ['power','irradiance','area','voltage','current','work','frequency','torque','rpm','volume','factor','minutes','ea'])$(id).value='';
  $('adjust-assumptions').open=false;$('solvent-properties').open=false;
  try{sessionStorage.removeItem('thermal-scenario');}catch{}
 }
 function simpleReady(){
  const both=Boolean($('stimulus').value&&$('solvent').value);
  $('stimulus-inputs').hidden=!$('stimulus').value;$('solvent-inputs').hidden=!$('solvent').value;
  $('simple-settings').hidden=!($('stimulus').value||$('solvent').value);
  const hasData=started||Boolean($('stimulus').value||$('solvent').value);
  $('reset').hidden=!hasData;$('try-example').hidden=hasData;$('try-example').parentElement.hidden=hasData;
  const equipment=$('accounting').value==='equipment';
  $('assumption-summary').textContent=`${equipment?'Equipment energy comparison':'Ideal delivered-energy comparison'} · ${$('temperature').value||'—'} °C · ${equipment?'conversion efficiencies and heat losses included':'no heat losses'} · ${$('vessel').value==='0'?'liquid only':'vessel heat capacity included'} · duty ${$('duty').value||'—'}%`;
  const powerFields={direct:['power'],delivered:['power'],irradiance:['irradiance','area'],electrical:['voltage','current'],cycles:['work','frequency'],rotation:['torque','rpm']};
  const required=[...(powerFields[$('method').value]||[]),'volume','factor','minutes','temperature',...($('mode').value==='known'?['ea']:[]),...($('solvent').value==='custom'?['density','cp','minimum','limit']:[])];
  return both&&required.every(id=>$(id).value.trim()!=='');
 }
 function clearScenarioLinks(){
  document.querySelectorAll('[data-scenario-link]').forEach(a=>a.href=a.getAttribute('href').split('#')[0]);
  try{sessionStorage.removeItem('thermal-scenario');}catch{}
 }
 function read(){const s={};for(const[k,v]of Object.entries(defaults)){const element=$(k);s[k]=typeof v==='number'?(element.value.trim()===''?NaN:Number(element.value)):element.value;}
  if(simple){
   const active={direct:['power'],delivered:['power'],irradiance:['irradiance','area'],electrical:['voltage','current'],cycles:['work','frequency'],rotation:['torque','rpm']}[s.method]||[];
   for(const key of ['power','irradiance','area','voltage','current','work','frequency','torque','rpm'])if(!active.includes(key)&&!Number.isFinite(s[key]))s[key]=defaults[key];
   if(s.mode==='threshold'&&!Number.isFinite(s.ea))s.ea=defaults.ea;
  }
  return s;}
 function displayFields(){
  const equipment=$('accounting').value==='equipment',method=$('method').value;
  document.querySelectorAll('[data-method]').forEach(e=>e.hidden=!e.dataset.method.split(' ').includes(method));
  document.querySelectorAll('[data-help-method]').forEach(e=>e.hidden=!e.dataset.helpMethod.split(' ').includes(method));
  $('stim-efficiency').hidden=!equipment||method==='direct';$('equipment-details').hidden=!equipment;$('known-input').hidden=$('mode').value!=='known';
  $('ea-range-control').hidden=$('plot').value==='time';
  document.querySelector('label[for="power"]').textContent=equipment&&method==='direct'?'Electrical input power (W)':'Delivered power (W)';
  $('accounting-note').textContent=equipment?'Equipment mode compares electrical consumption, including the losses and auxiliary loads you enter. Ambient equals the reference temperature.':'Ideal mode compares energy delivered to the system with sensible heating. Heat losses, conversion losses and auxiliary loads are excluded.';
 }
 function propertyNote(s){const preset=D.solvents.find(x=>x.id===s.solvent);const node=$('solvent-note');node.replaceChildren();if(!preset){node.textContent='Custom properties: verify heat capacity, density and operating bounds for your mixture.';return;}
  const edited=s.cp!==preset.cp||s.density!==preset.density;
  node.append(document.createTextNode(`${edited?'Edited properties based on':'Preset:'} ${preset.name}; cₚ at 25 °C, room-temperature density. `));const a=document.createElement('a');a.href=preset.cpSource;a.textContent='Source ↗';node.append(a);
 }
 function persist(s){if(Object.values(s).some(v=>typeof v==='number'&&!Number.isFinite(v)))return;const payload=JSON.stringify({version:1,inputs:s});try{sessionStorage.setItem('thermal-scenario',payload);}catch{}const hash='#'+encodeURIComponent(payload);document.querySelectorAll('[data-scenario-link]').forEach(a=>a.href=a.getAttribute('href').split('#')[0]+hash);}
 function update(){
  displayFields();const entered=read();propertyNote(entered);$('error').hidden=true;current=null;result=null;
  if(simple){$('full-details').hidden=true;$('supporting-text').hidden=true;if(!simpleReady()){$('results').hidden=true;$('csv').disabled=$('share').disabled=true;clearScenarioLinks();return;}}
  try{
   if(!Number.isFinite(entered.eaMax)||entered.eaMax<=0||entered.eaMax>100000)throw Error('Choose a plot maximum above zero and at most 100,000 kJ/mol.');
   const preset=D.solvents.find(x=>x.id===entered.solvent);
   const s={...entered};if(preset){s.limit=Math.min(s.limit,preset.boiling-.01);s.minimum=Math.max(s.minimum,preset.melting+.01);}
   const r=M.calculate(s);current=s;result=r;persist(entered);
   $('results').hidden=false;$('csv').disabled=$('share').disabled=false;
   if(simple){$('full-details').hidden=false;$('supporting-text').hidden=false;}
   $('stim-energy').textContent=energy(r.stimulus);$('stim-power').textContent=`${fmt(r.power+r.aux,3)} W average${r.startup?' + '+energy(r.startup)+' startup':''}`;
   $('stim-output-label').textContent=s.accounting==='ideal'?'Delivered stimulus energy':'Stimulated route electrical energy';
   const threshold=s.mode==='threshold';
   $('thermal-output-label').textContent=threshold?'Break-even activation energy':'Equivalent thermal input energy';
   $('thermal-headline').textContent=threshold?(r.threshold===Infinity?'No finite crossing':r.threshold===null?'No enhancement':`${fmt(r.threshold/1000)} kJ/mol`):r.thermal===null?'Outside model range':energy(r.thermal);
   $('thermal-subline').textContent=threshold?'A conditional threshold, not the actual activation energy.':r.thermal!==null?`${fmt(r.thermal/r.t,3)} W amortized over operating time`:'No energy verdict is claimed outside the temperature limits.';
   $('capacity').textContent=`${fmt(r.C)} J/K`;$('temperature-label').textContent=threshold?'Equal-energy temperature':'Equivalent thermal temperature';
   $('target-temp').textContent=`${fmt(threshold?s.temperature+r.deltaBE:r.target)} °C`;
   $('third-label').textContent=threshold?'Minimum feasible Eₐ at model limit':'Stimulated / thermal energy ratio';
   $('third-value').textContent=threshold?(r.minimumEa===null?'—':`${fmt(r.minimumEa/1000)} kJ/mol`):(r.ratio===null?'—':`${fmt(r.ratio,3)}×`);
   let title,copy;
   if(r.status==='no-enhancement'){title='No acceleration to reproduce';copy='At a rate ratio of 1, the reference temperature already meets the target. Additional thermal energy is zero and there is no unique activation-energy threshold.';}
   else if(threshold){
    if(r.threshold===Infinity){title='No finite break-even activation energy';copy='The entered stimulus energy is zero. Equivalent heating requires positive energy wherever the target temperature is within the model range. Confirm that all relevant stimulus energy has been included.';}
    else if(!r.thresholdInRange){title='The break-even temperature is outside the model range';copy=`The mathematical threshold is ${fmt(r.threshold/1000)} kJ/mol, but the equal-energy temperature exceeds ${fmt(s.limit)} °C. Heating uses less energy wherever this thermal benchmark is valid. No comparison is claimed below the minimum feasible activation energy.`;}
    else{title=`Stimulation has an advantage below ${fmt(r.threshold/1000)} kJ/mol`;copy=`For the observed ${fmt(s.factor)}× enhancement over ${fmt(s.minutes)} min, stimulation uses less energy between the feasible lower bound and this threshold. Above it, heating uses less. The actual activation energy remains unknown.`;}
   }else if(r.status==='unreachable'){title='No finite thermal temperature in this model';copy='The selected activation energy and rate enhancement give a nonpositive Arrhenius denominator. No thermal energy estimate or winner can be assigned.';}
   else if(r.status==='outside-range'){title='Equivalent heating lies outside the model range';copy=`The extrapolated temperature is ${fmt(r.target)} °C, above the ${fmt(s.limit)} °C limit. Adjust the experimental basis or valid bounds before drawing a conclusion.`;}
   else if(r.status==='equal'){title='The two routes break even';copy='Stimulation and equivalent heating consume the same energy under the selected assumptions.';}
   else{const stim=r.status==='stimulation',saving=stim?100*(1-r.stimulus/r.thermal):100*(1-r.thermal/r.stimulus);title=`${stim?'Stimulation':'Heating'} uses ${fmt(saving,1)}% less energy`;copy=`${energy(r.stimulus)} for stimulation versus ${energy(r.thermal)} for heating to ${fmt(r.target)} °C. This compares the same target rate over ${fmt(s.minutes)} min, using the selected energy boundary.`;}
   const heading=$('verdict-title');heading.replaceChildren();
   const accent=document.createElement('strong');accent.className='verdict-accent';
   if(threshold&&r.status!=='no-enhancement'&&Number.isFinite(r.threshold)&&r.thresholdInRange){
    heading.append(document.createTextNode('Stimulation has an '));
    accent.classList.add('stim');accent.textContent=`advantage below ${fmt(r.threshold/1000)} kJ/mol`;
   }else{
    accent.textContent=title;
    if(!threshold&&r.status==='stimulation')accent.classList.add('stim');
    else if(!threshold&&r.status==='thermal')accent.classList.add('heat');
   }
   heading.append(accent);$('verdict-copy').textContent=copy;
   const ranges=$('range-summary');ranges.replaceChildren();ranges.hidden=!threshold||s.factor===1;
   if(!ranges.hidden){
    let labels=r.threshold===Infinity?[[`${fmt(r.minimumEa/1000)} kJ/mol and above`,'Stimulation favoured within the temperature range','stim'],['No finite crossing','Check the zero-energy stimulus assumption','heat']]:r.thresholdInRange?[[`${fmt(r.minimumEa/1000)}–${fmt(r.threshold/1000)} kJ/mol`,'Stimulation favoured; equal at the upper boundary','stim'],[`Above ${fmt(r.threshold/1000)} kJ/mol`,'Thermal treatment favoured','heat']]:[[`Below ${fmt(r.minimumEa/1000)} kJ/mol`,'Outside the valid thermal temperature range',''],[`${fmt(r.minimumEa/1000)} kJ/mol and above`,'Thermal treatment favoured','heat']];
    for(const[a,b,c]of labels){const div=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=a;strong.className=c;span.textContent=b;div.append(strong,span);ranges.append(div);}
   }
   const warnings=['Constant-property batch estimate. Matching rate does not establish equal selectivity or yield.'];
   if(s.accounting==='ideal')warnings.push('Ideal estimate: no equipment conversion losses or heat losses are included.');
   if(s.vessel===0)warnings.push('Vessel, catalyst and other thermal masses are omitted.');
   if(preset&&entered.limit>=preset.boiling)warnings.push(`The liquid benchmark is capped just below the tabulated ${preset.boiling} °C boiling point; pressurized or reflux operation is not modelled.`);
   const target=threshold?s.temperature+r.deltaBE:r.target;
   if(preset&&(Math.abs(s.temperature-25)>20||Number.isFinite(target)&&Math.abs(target-25)>20))warnings.push('Temperature is more than 20 K from the heat-capacity reference; constant cₚ may be a poor approximation.');
   if(s.accounting==='equipment'&&s.ua===0)warnings.push('UA = 0 explicitly assumes no heat loss, rather than unknown heat loss.');
   $('warnings').textContent=warnings.join(' ');
   $('chart-caption').textContent=s.plot==='activation'?'Sweep the unknown thermal activation energy while keeping the measured enhancement and stimulus energy fixed.':'Startup plus operating energy at the selected known activation energy.';
   $('plot-heading').textContent=s.plot==='activation'?'Where does heating become preferable?':'How does operating time change the comparison?';
   const rows=[['Calculation status',r.status],['Accounting boundary',s.accounting==='ideal'?'Delivered energy':'Equipment electrical input'],['System heat capacity',`${fmt(r.C,4)} J/K`],['Stimulated operating energy',energy((r.power+r.aux)*r.t)],['Stimulated startup energy',energy(r.startup)],['Total stimulated energy',energy(r.stimulus)],['Mathematical break-even Eₐ',r.threshold===Infinity?'No finite crossing':r.threshold===null?'Not defined':`${fmt(r.threshold/1000,4)} kJ/mol`],['Maximum temperature used',`${fmt(s.limit)} °C`]];
   if(r.thermal!==null)rows.push(['Thermal sensible heating',energy(r.heat)],['Thermal warm-up loss',energy(r.rampLoss)],['Thermal holding energy',energy(r.hold)],['Total thermal energy',energy(r.thermal)],['Thermal holding power',`${fmt(r.hold/r.t,4)} W`],['Average warm-up input power',r.ramp>0?`${fmt((r.heat+r.rampLoss)/r.ramp,4)} W`:'Not specified']);
   $('breakdown-body').replaceChildren();for(const[a,b]of rows){const tr=document.createElement('tr');for(const txt of[a,b]){const td=document.createElement('td');td.textContent=txt;tr.append(td);}$('breakdown-body').append(tr);}
   ThermalChart.draw(s,r);
  }catch(e){$('error').textContent=e.message;$('error').hidden=false;$('results').hidden=true;$('stim-energy').textContent=$('thermal-headline').textContent='—';$('stim-power').textContent=$('thermal-subline').textContent='';$('csv').disabled=$('share').disabled=true;if(simple){$('full-details').hidden=true;$('supporting-text').hidden=true;clearScenarioLinks();}}
 }
 $('calculator').addEventListener('submit',e=>e.preventDefault());
 $('calculator').addEventListener('input',e=>{if(simple)started=true;if(e.target.tagName!=='SELECT')update();});
 $('calculator').addEventListener('change',e=>{
  if(simple)started=true;
  if(simple&&e.target.id==='know-ea')$('mode').value=$('know-ea').checked?'known':'threshold';
  if(e.target.id==='stimulus'||e.target.id==='accounting')setMethods($('method').value);
  if(e.target.id==='solvent'){const s=D.solvents.find(x=>x.id===$('solvent').value);if(s){$('density').value=s.density;$('cp').value=s.cp;$('limit').value=s.boiling-1;$('minimum').value=s.melting+1;}}
  if(simple&&e.target.id==='solvent'&&$('solvent').value==='custom'){for(const id of ['density','cp','minimum','limit'])$(id).value='';$('adjust-assumptions').open=$('solvent-properties').open=true;}
  update();
 });
 $('plot').addEventListener('change',update);$('eaMax').addEventListener('input',update);
 $('reset').addEventListener('click',()=>{try{history.replaceState(null,'',location.pathname+location.search);}catch{}if(simple)clearSimple();else apply(defaults);$('action-status').textContent=simple?'':'Illustrative example restored.';update();});
 if(simple)$('try-example').addEventListener('click',()=>{started=true;apply({...defaults,minutes:30});$('example-note').textContent='Illustrative example — not measured experimental results.';$('action-status').textContent='';update();});
 $('share').addEventListener('click',async()=>{const hash='#'+encodeURIComponent(JSON.stringify({version:1,inputs:read()}));const url=location.href.split('#')[0]+hash;try{await navigator.clipboard.writeText(url);$('action-status').textContent='Scenario link copied.';$('share-fallback').hidden=true;}catch{$('share-fallback').textContent=url;$('share-fallback').hidden=false;$('action-status').textContent='Copy the scenario link below.';}});
 $('csv').addEventListener('click',()=>{
  if(!current||!result)return;
  const units={temperature:'degC',factor:'ratio',minutes:'min',power:'W',irradiance:'mW/cm2',area:'cm2',voltage:'V',current:'mA',work:'J/cycle',frequency:'Hz',torque:'N m',rpm:'rev/min',duty:'%',stimEfficiency:'%',volume:'mL',density:'g/mL',cp:'J/g/K',vessel:'J/K',limit:'degC',minimum:'degC',ea:'kJ/mol',heaterEfficiency:'%',ua:'W/K',warmup:'min',aux:'W',startup:'kJ',eaMax:'kJ/mol'};
  const rows=[['category','quantity','value','unit'],['model','version',D.version,''],...Object.entries(read()).map(([k,v])=>['input',k,v,units[k]||'']),['effective','maximum_temperature',current.limit,'degC'],['result','status',result.status,'']];
  for(const[k,u]of [['C','J/K'],['power','W'],['stimulus','J'],['deltaBE','K'],['threshold','J/mol'],['minimumEa','J/mol'],['target','degC'],['thermal','J'],['heat','J'],['rampLoss','J'],['hold','J'],['ratio','ratio']])rows.push(['result',k,result[k]===null?'not applicable':Number.isFinite(result[k])?result[k]:'no finite value',u]);
  const p=D.solvents.find(x=>x.id===current.solvent);if(p)rows.push(['source','cp',p.cpSource,''],['source','density',p.densitySource,''],['source','cp_reference',p.reference,'']);
  rows.push(['assumption','ambient_equals_reference','true',''],['assumption','constant_properties','true',''],['assumption','temperature_limit','liquid phase and user limit; no pressure model',''],['note','warnings',$('warnings').textContent,'']);
  const text=rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='thermal-efficiency.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('action-status').textContent='Calculation CSV downloaded.';
 });
 function initialize(){apply(load());if(simple){started=restored;if(!restored)clearSimple();}update();}
 initialize();window.addEventListener('hashchange',initialize);
})();
