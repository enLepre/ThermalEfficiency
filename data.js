/* Selected liquid Cp measurements, not a fit or a claim of universal accuracy. */
(function(root) {
  const densitySource = 'https://www.sigmaaldrich.com/content/dam/sigma-aldrich/docs/Aldrich/General_Information/labbasics_pg144.pdf';
  const rows = [
    ['water','Water','7732185',18.01528,75.3749,1,100,0,'Chase, 1998; Shomate equation evaluated at 298.15 K'],
    ['acetonitrile','Acetonitrile','75058',41.0519,91.69,.786,82,-48,'Kolker, Kulikov et al., 1992'],
    ['methanol','Methanol','67561',32.0419,81.13,.791,64.7,-98,'Carlson and Westrum, 1971'],
    ['ethanol','Ethanol','64175',46.0684,111.53,.789,78,-114,'Andreoli-Ball, Patterson et al., 1988'],
    ['isopropanol','Isopropanol','67630',60.095,154.43,.785,82.4,-89.5,'Andon, Counsell et al., 1963'],
    ['acetone','Acetone','67641',58.0791,125.45,.791,56,-94,'Malhotra and Woolf, 1991'],
    ['ethyl-acetate','Ethyl acetate','141786',88.1051,168.94,.902,77,-84,'Pintos, Bravo et al., 1988'],
    ['thf','Tetrahydrofuran (THF)','109999',72.1057,124.1,.889,65,-108,'Costas and Patterson, 1985'],
    ['ether','Diethyl ether','60297',74.1216,172.5,.706,34.6,-116,'Counsell, Lee et al., 1971'],
    ['dcm','Dichloromethane','75092',84.9326,102.3,1.325,40,-97,'Moseeva, Rabinovich et al., 1978'],
    ['chloroform','Chloroform','67663',119.378,114.25,1.492,61,-64,'Grolier, Roux-Desgranges et al., 1993'],
    ['toluene','Toluene','108883',92.1384,157.09,.865,110.6,-93,'Grolier, Roux-Desgranges et al., 1993'],
    ['hexane','n-Hexane','110543',86.1754,197.66,.659,69,-95,'Andreoli-Ball, Patterson et al., 1988'],
    ['heptane','n-Heptane','142825',100.2019,224.64,.684,98,-91,'Andreoli-Ball, Patterson et al., 1988'],
    ['dmf','N,N-Dimethylformamide (DMF)','68122',73.0938,146.05,.944,153,-61,'Grolier, Roux-Desgranges et al., 1993'],
    ['dmso','Dimethyl sulfoxide (DMSO)','67685',78.133,153.18,1.101,189,18.4,'Clever and Westrum, 1970'],
    ['dioxane','1,4-Dioxane','123911',88.1051,149.65,1.034,100,12,'Grolier, Roux-Desgranges et al., 1993']
  ];
  const solvents = rows.map(([id,name,cas,molarMass,molarCp,density,boiling,melting,reference]) => ({id,name,cas,molarMass,molarCp,density,boiling,melting,reference,cp:+(molarCp/molarMass).toFixed(4),referenceTemperature:25,cpSource:`https://webbook.nist.gov/cgi/cbook.cgi?ID=C${cas}&Mask=2`,densitySource:id==='ethanol'?'https://www.sigmaaldrich.com/US/en/product/sigald/e7023':densitySource}));
  const defaults = { mode:'threshold', accounting:'ideal', stimulus:'light', method:'direct', power:2, irradiance:100, area:10, voltage:3, current:100, work:.1, frequency:20, torque:.01, rpm:1000, duty:100, stimEfficiency:30, factor:5, temperature:25, minutes:10, solvent:'acetonitrile', volume:100, density:.786, cp:solvents[1].cp, vessel:0, limit:81, minimum:-47, ea:50, heaterEfficiency:80, ua:.1, warmup:5, aux:0, startup:0, eaMax:200, plot:'activation' };
  const api={solvents,defaults,densitySource,version:'2026-11-16'};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ThermalData=api;
})(typeof globalThis!=='undefined'?globalThis:this);
