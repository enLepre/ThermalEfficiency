(() => {
 const body=document.getElementById('sources-body'),search=document.getElementById('source-search');
 function render(){const rows=ThermalData.solvents.filter(s=>(s.name+' '+s.reference).toLowerCase().includes(search.value.toLowerCase()));body.replaceChildren();for(const s of rows){const tr=document.createElement('tr');for(const text of [s.name,s.density,s.cp,s.molarCp,`${s.boiling} / ${s.melting}`]){const td=document.createElement('td');td.textContent=text;tr.append(td);}const td=document.createElement('td'),a=document.createElement('a');a.href=s.cpSource;a.textContent=s.reference+' (NIST)';td.append(a);tr.append(td);body.append(tr);}document.getElementById('source-count').textContent=`${rows.length} of ${ThermalData.solvents.length} solvents · cₚ at 298.15 K`;}
 search.addEventListener('input',render);render();
})();
