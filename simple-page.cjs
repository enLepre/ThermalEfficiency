// Reuse the full calculator's fields so both views share labels, units and defaults.
const {JSDOM}=require('jsdom');
module.exports=function simplePage(html){
 const dom=new JSDOM(html),d=dom.window.document;
 const old=d.getElementById('calculator');
 const form=d.createElement('form');form.id='calculator';form.noValidate=true;
 form.innerHTML=`<div class="simple-choices"><section class="simple-choice" id="stimulus-choice"><div id="stimulus-inputs" hidden></div></section><section class="simple-choice" id="solvent-choice"><div id="solvent-inputs" hidden></div></section></div>
 <div id="experiment-inputs" hidden><div class="pair" id="experiment-fields"></div><p class="caption">Compare rates at the same bulk temperature, composition and catalyst loading.</p></div>
 <div id="simple-settings" hidden><p id="assumption-summary" class="caption"></p><details id="adjust-assumptions"><summary>Adjust assumptions</summary><div class="pair" id="basic-assumptions"></div></details><label class="known-toggle"><input id="know-ea" type="checkbox"> I know the activation energy</label></div>`;
 old.id='full-calculator-source';old.before(form);
 const find=id=>d.getElementById(id);
 const slot=id=>form.querySelector('#'+id);
 function field(id,target){const input=find(id),label=d.querySelector('label[for="'+id+'"]'),box=d.createElement('div');box.className='simple-field';if(label)box.append(label);box.append(input);target.append(box);}
 function move(id,target){target.append(find(id));}
 for(const id of ['stimulus','solvent']){
  const target=slot(id+'-choice');field(id,target);target.prepend(target.lastElementChild);
  const option=d.createElement('option');option.value='';option.disabled=true;option.selected=true;option.textContent=id==='stimulus'?'Choose a stimulus':'Choose a solvent';find(id).prepend(option);
 }
 field('method',slot('stimulus-inputs'));
 old.querySelectorAll('[data-method]').forEach(n=>slot('stimulus-inputs').append(n));
 field('volume',slot('solvent-inputs'));move('solvent-note',slot('solvent-inputs'));
 for(const id of ['factor','minutes'])field(id,slot('experiment-fields'));
 for(const id of ['accounting','temperature','duty','vessel'])field(id,slot('basic-assumptions'));
 const advanced=slot('adjust-assumptions');
 move('accounting-note',advanced);
 const dutyNote=d.createElement('p');dutyNote.className='caption';dutyNote.textContent='For measured average power, leave duty cycle at 100%. Otherwise enter on-state power.';advanced.append(dutyNote);
 move('stim-efficiency',advanced);
 const properties=find('density').closest('details');properties.id='solvent-properties';advanced.append(properties);
 move('equipment-details',advanced);move('ea-range-control',advanced);
 move('known-input',slot('simple-settings'));
 // Unshown fields and secondary outputs remain available to the shared calculation code.
 const support=d.createElement('div');support.hidden=true;support.id='simple-support';
 const result=find('results');result.hidden=true;
 for(const node of [find('range-summary'),result.querySelector('.metrics'),find('breakdown'),find('plot').parentElement])support.append(node);
 const notes=d.createElement('details');notes.innerHTML='<summary>Model notes</summary>';notes.append(find('warnings'));result.append(notes);
 result.querySelector('.eyebrow').remove();
 const actions=d.querySelector('.actions');support.append(find('share'),find('csv'));
 actions.prepend(Object.assign(d.createElement('button'),{id:'try-example',type:'button',textContent:'Try an example'}));
 find('reset').textContent='↻ Start over';find('reset').hidden=true;
 const details=d.createElement('a');details.id='full-details';details.href='details.html';details.dataset.scenarioLink='';details.textContent='Details and export →';details.hidden=true;actions.append(details);
 while(old.firstChild)support.append(old.firstChild);old.remove();form.append(support);
 d.body.dataset.simple='true';d.querySelector('.intro .eyebrow').remove();
 d.querySelector('h1').textContent='Is stimulation worth the energy?';
 d.querySelector('.subtitle').textContent='Compare the energy used by a stimulus with the heating needed for the same rate enhancement.';
 // Empty experimental inputs before scripts run; illustrative values are opt-in.
 for(const id of ['power','irradiance','area','voltage','current','work','frequency','torque','rpm','volume','factor','minutes','ea'])find(id).setAttribute('value','');
 const output=dom.serialize();dom.window.close();return output;
};
