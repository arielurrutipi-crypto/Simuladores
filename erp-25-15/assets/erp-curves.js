(() => {
  const units=[['active-A','R1 · activo DFO'],['monitor-A','R1 · monitor FC'],['active-C','R2 · activo DFO'],['monitor-C','R2 · monitor FC'],['active-B','Arranque · 631']];
  const sources={cg:'https://eqa.com.ar/wp-content/uploads/2016/02/956man-eng.pdf#page=89',sizing:'https://eqa.com.ar/wp-content/uploads/2025/07/S-956-01-ES.pdf',startup:'https://eqa.com.ar/wp-content/uploads/2025/05/S631-06-ESP.pdf#page=4'};
  // Capacity, not a droop or dynamic response law. Nm3/h per EQA sizing sheet.
  function capacity(cg,pin,pout,temp=15,density=.6){const p1=pin+1.01325,p2=pout+1.01325;if(p1<=p2||cg<=0)return 0;const factor=cg/Math.sqrt(density*(273.15+temp));return p1>=2*p2?6.97*p1*factor:13.94*Math.sqrt(p2*(p1-p2))*factor;}
  const table631={pins:[25,28,40,56,70],orifices:{'3,2':[167,185,251,342,428],'4,8':[353,396,545,744,861],'6,4':[679,762,916,1122,1172],'9,5':[1053,1109,null,null,null]}};
  function snapshot(trainer){const m=trainer.model,r={t:m.t,units:{}};for(const [id] of units){const [device,k]=id.split('-'),b=m.branches[k],st=trainer.state(k);r.units[id]={q:st.q<1e-8?0:st.q,p:m.p,sp:device==='monitor'?b.spMonitor:b.spActive,opening:!b.enabled||!st.ssv?null:st[device]<1e-10?0:100*st[device]};}return r;}
  function attach(trainer){trainer.curveHistory=[snapshot(trainer)];const advance=trainer.advance.bind(trainer),select=trainer.select.bind(trainer);trainer.select=function(mode){select(mode);this.curveHistory=[snapshot(this)];};trainer.advance=function(seconds){let left=seconds;while(left>1e-9){const step=Math.min(.1,left);advance(step);left-=step;const last=this.curveHistory[this.curveHistory.length-1];if(this.model.t-last.t>=.199999){this.curveHistory.push(snapshot(this));if(this.curveHistory.length>601)this.curveHistory.shift();}}};}
  globalThis.ERP25Curves={units,sources,capacity,table631,snapshot,attach};
})();
