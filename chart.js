(() => {
 const NS='http://www.w3.org/2000/svg';
 function draw(s,r){
  const svg=document.getElementById('chart');svg.replaceChildren();
  const el=(tag,attrs={},text='')=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;svg.append(n);return n;};
  el('title',{id:'chart-title'},s.plot==='time'?'Energy versus operating duration':'Energy versus thermal activation energy');
  el('desc',{id:'chart-description'},'Teal shows stimulus energy; plum shows thermal energy. The thermal curve is omitted where the temperature exceeds the model limit. See the numerical comparison above.');
  const note=document.getElementById('chart-note');
  if(s.factor===1){note.textContent='No activation-energy comparison is needed when the rate is unchanged.';return;}
  if(s.plot==='time'&&(s.mode!=='known'||r.thermal===null)){note.textContent='Select a known activation energy within the temperature limits to plot energy against operating time.';return;}
  const time=s.plot==='time', xmax=time?Math.max(60,s.minutes*2):s.eaMax;
  const points=[], stim=[];
  for(let i=0;i<=300;i++){
   const x=xmax*i/300;
   let thermal=null,stimulation=r.stimulus/1000;
   if(time){const delta=r.target-s.temperature;thermal=(r.C*delta/r.eta+r.ua*delta*r.ramp/(2*r.eta)+r.ua*delta*x*60/r.eta)/1000;stimulation=((r.power+r.aux)*x*60+r.startup)/1000;}
   else if(x>0){const temp=ThermalModel.equivalentTemperature(r.T0,s.factor,x*1000)-273.15;if(Number.isFinite(temp)&&temp<=s.limit+1e-8)thermal=r.thermalSlope*(temp-s.temperature)/1000;}
   points.push([x,thermal]);stim.push([x,stimulation]);
  }
  const positive=[...points,...stim].map(p=>p[1]).filter(v=>v!==null&&Number.isFinite(v));
  let ymax=Math.max(.001,...positive)*1.12;
  const x0=78,y0=28,w=794,h=265, X=x=>x0+x/xmax*w,Y=y=>y0+h-y/ymax*h;
  if(!time&&r.minimumEa){const edge=Math.min(xmax,r.minimumEa/1000);el('rect',{x:x0,y:y0,width:Math.max(0,X(edge)-x0),height:h,class:'shade'});}
  for(let i=0;i<=4;i++){const value=ymax*i/4;el('line',{x1:x0,x2:x0+w,y1:Y(value),y2:Y(value),class:'grid'});el('text',{x:x0-10,y:Y(value)+4,'text-anchor':'end'},value>=1000?value.toPrecision(3):value.toFixed(value<1?3:1));const xv=xmax*i/4;el('text',{x:X(xv),y:y0+h+26,'text-anchor':'middle'},+xv.toFixed(1)+'');}
  el('text',{x:x0,y:17},'Energy (kJ)');el('text',{x:x0+w/2,y:343,'text-anchor':'middle'},time?'Operating duration (min)':'Thermal activation energy (kJ/mol)');
  const path=(arr,cls)=>{let d='',open=false;for(const[x,y]of arr){if(y===null||!Number.isFinite(y)){open=false;continue;}d+=(open?'L':'M')+X(x).toFixed(2)+','+Y(y).toFixed(2);open=true;}if(d)el('path',{d,class:cls});};
  path(stim,'stim-line');path(points,'heat-line');
  let cross=r.threshold/1000;
  if(time){const delta=r.target-s.temperature;const intercept=r.C*delta/r.eta+r.ua*delta*r.ramp/(2*r.eta)-r.startup;const slope=r.power+r.aux-r.ua*delta/r.eta;cross=slope!==0?intercept/slope/60:null;}
  if(cross!==null&&Number.isFinite(cross)&&cross>=0&&cross<=xmax&&(time||r.thresholdInRange)){
   el('line',{x1:X(cross),x2:X(cross),y1:y0,y2:y0+h,class:'marker'});
   el('text',{x:Math.min(x0+w-5,Math.max(x0+80,X(cross))),y:y0+17,'text-anchor':'end'},'Break-even '+cross.toFixed(1));
  }
  if(time)note.textContent=Number.isFinite(cross)&&cross>=0?`Break-even operating duration: ${cross.toFixed(2)} min. Startup energy is included; warm-up precedes the operating interval.`:'No positive-time crossing for these inputs. Startup energy is included.';
  else note.textContent=`Shaded region: target rate cannot be reached within the selected temperature limit. ${r.thresholdInRange&&r.threshold/1000>xmax?'The break-even point lies beyond this plot; increase its maximum.':''} Curves assume the measured enhancement remains fixed.`;
 }
 window.ThermalChart={draw};
})();
